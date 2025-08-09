import { createClient } from 'npm:@supabase/supabase-js@2.53.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface SearchRequest {
  query: string;
  status: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { query, status }: SearchRequest = await req.json();

    if (!query || !status) {
      return new Response(
        JSON.stringify({ error: "Query and status are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Perform text-based search on multiple fields
    const { data: assessments, error } = await supabase
      .from('assessments')
      .select(`
        id,
        user_id,
        risk_score,
        risk_category,
        timestamp,
        created_at,
        status,
        overall_recommendation,
        provider_comments,
        inputs,
        recommendations
      `)
      .eq('status', status)
      .or(`risk_category.ilike.%${query}%,overall_recommendation.ilike.%${query}%,provider_comments.ilike.%${query}%,risk_score.ilike.%${query}%`)
      .limit(5)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Search error:', error);
      return new Response(
        JSON.stringify({ error: `Search failed: ${error.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Add similarity score based on text matching
    const resultsWithSimilarity = (assessments || []).map((result, index) => {
      // Simple similarity calculation based on position and text matches
      let similarity = 0.9 - (index * 0.1); // Decreasing similarity for later results
      
      // Boost similarity if query matches risk_category exactly
      if (result.risk_category && result.risk_category.toLowerCase().includes(query.toLowerCase())) {
        similarity += 0.1;
      }
      
      // Ensure similarity is between 0 and 1
      similarity = Math.max(0.1, Math.min(1.0, similarity));
      
      return {
        ...result,
        similarity: parseFloat(similarity.toFixed(2))
      };
    });

    return new Response(
      JSON.stringify({ results: resultsWithSimilarity }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
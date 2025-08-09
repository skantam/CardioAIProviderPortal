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

    // Check for required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', { 
        hasUrl: !!supabaseUrl, 
        hasServiceKey: !!supabaseServiceKey 
      });
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build search conditions
    const searchTerm = query.toLowerCase().trim();
    let searchQuery = supabase
      .from('assessments')
      .select(`
        id,
        user_id,
    // Use RPC function for complex search
    const searchTerm = query.trim();
    const { data: assessments, error } = await supabase
      .rpc('search_assessments', {
        p_search_term: searchTerm,
        p_status: status
      });

    if (error) {
      console.error('RPC search error:', error);
      return new Response(
        JSON.stringify({ error: `Search failed: ${error.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Add similarity score based on search type and matches
    const resultsWithSimilarity = (assessments || []).map((result, index) => {
      let similarity = 0.9 - (index * 0.1); // Base similarity decreasing by position
      
      // Boost similarity for exact matches
      const numericQuery = parseFloat(searchTerm);
      if (!isNaN(numericQuery)) {
        // Risk score search
        const riskScore = parseFloat(result.risk_score);
        if (riskScore === numericQuery) {
          similarity += 0.2; // Exact match bonus
        } else if (Math.abs(riskScore - numericQuery) <= 5) {
          similarity += 0.1; // Close match bonus
        }
      } else if (result.risk_category && result.risk_category.toLowerCase().includes(searchTerm.toLowerCase())) {
        similarity += 0.15; // Category match bonus
      } else if (result.overall_recommendation && result.overall_recommendation.toLowerCase().includes(searchTerm.toLowerCase())) {
        similarity += 0.1; // Recommendation match bonus
      }
      
      // Ensure similarity is between 0.1 and 1.0
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
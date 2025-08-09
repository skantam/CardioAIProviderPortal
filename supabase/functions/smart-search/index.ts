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

    // Generate embedding for the search query
    try {
      const model = new Supabase.ai.Session('gte-small');
      const embedding = await model.run(query, { mean_pool: true, normalize: true });

      // Perform vector similarity search
      const { data: assessments, error } = await supabase.rpc('search_assessments', {
        query_embedding: embedding,
        match_threshold: 0.1,
        match_count: 5,
        filter_status: status
      });

      if (error) {
        console.error('Search RPC error:', error);
        return new Response(
          JSON.stringify({ error: `Search RPC failed: ${error.message}` }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ results: assessments || [] }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );

    } catch (embeddingError) {
      console.error('Embedding generation error:', embeddingError);
      
      // Fallback to text-based search if embedding fails
      const { data: fallbackResults, error: fallbackError } = await supabase
        .from('assessments')
        .select('*')
        .eq('status', status)
        .or(`risk_category.ilike.%${query}%,overall_recommendation.ilike.%${query}%,provider_comments.ilike.%${query}%`)
        .limit(5);

      if (fallbackError) {
        console.error('Fallback search error:', fallbackError);
        return new Response(
          JSON.stringify({ error: "Search failed" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Add similarity score of 0.5 for fallback results
      const resultsWithSimilarity = (fallbackResults || []).map(result => ({
        ...result,
        similarity: 0.5
      }));

      return new Response(
        JSON.stringify({ results: resultsWithSimilarity }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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
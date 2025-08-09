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
      .eq('status', status);

    // Check if query is a number (for risk score search)
    const numericQuery = parseFloat(searchTerm);
    if (!isNaN(numericQuery)) {
      // Search by risk score (exact match or range)
      searchQuery = searchQuery.or(`risk_score.eq.${numericQuery},risk_score.gte.${Math.max(0, numericQuery - 5)}.and.risk_score.lte.${Math.min(100, numericQuery + 5)}`);
    } else if (searchTerm.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) || searchTerm.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Date search - convert to ISO format for comparison
      let searchDate;
      if (searchTerm.includes('/')) {
        const [month, day, year] = searchTerm.split('/');
        searchDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        searchDate = searchTerm;
      }
      
      // Search by date (both timestamp and created_at fields)
      searchQuery = searchQuery.or(`timestamp.gte.${searchDate},created_at.gte.${searchDate}`);
    } else {
      // Text-based search on multiple fields
      searchQuery = searchQuery
        .or(`risk_category.ilike.%${searchTerm}%`)
        .or(`overall_recommendation.ilike.%${searchTerm}%`)
        .or(`provider_comments.ilike.%${searchTerm}%`)
        .or(`inputs::text.ilike.%${searchTerm}%`)
        .or(`recommendations::text.ilike.%${searchTerm}%`);
    }

    const { data: assessments, error } = await searchQuery
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

    // Add similarity score based on search type and matches
    const resultsWithSimilarity = (assessments || []).map((result, index) => {
      let similarity = 0.9 - (index * 0.1); // Base similarity decreasing by position
      
      // Boost similarity for exact matches
      if (!isNaN(numericQuery)) {
        // Risk score search
        const riskScore = parseFloat(result.risk_score);
        if (riskScore === numericQuery) {
          similarity += 0.2; // Exact match bonus
        } else if (Math.abs(riskScore - numericQuery) <= 5) {
          similarity += 0.1; // Close match bonus
        }
      } else if (result.risk_category && result.risk_category.toLowerCase().includes(searchTerm)) {
        similarity += 0.15; // Category match bonus
      } else if (result.overall_recommendation && result.overall_recommendation.toLowerCase().includes(searchTerm)) {
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
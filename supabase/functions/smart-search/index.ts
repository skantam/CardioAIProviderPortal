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

interface ParsedQuery {
  textQuery: string;
  filters: {
    riskScore?: { operator: string; value: number };
    date?: { operator: string; value: Date };
    riskCategory?: string;
  };
}

function parseSearchQuery(query: string): ParsedQuery {
  const filters: ParsedQuery['filters'] = {};
  let textQuery = query;

  // Parse risk score conditions (e.g., "risk score > 10%", "risk > 15", "score >= 20%")
  const riskScoreRegex = /(?:risk\s*score?|score)\s*([><=]+)\s*(\d+(?:\.\d+)?)%?/gi;
  const riskScoreMatch = riskScoreRegex.exec(query);
  if (riskScoreMatch) {
    const operator = riskScoreMatch[1];
    const value = parseFloat(riskScoreMatch[2]);
    filters.riskScore = { operator, value };
    textQuery = textQuery.replace(riskScoreMatch[0], '').trim();
  }

  // Parse date conditions (e.g., "date > August 3", "after January 15", "before 2024-01-01")
  const dateRegex = /(?:date|created|assessment)\s*([><=]+)\s*([A-Za-z]+\s+\d{1,2}(?:,?\s*\d{4})?|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/gi;
  const dateMatch = dateRegex.exec(query);
  if (dateMatch) {
    const operator = dateMatch[1];
    const dateStr = dateMatch[2];
    const parsedDate = parseDate(dateStr);
    if (parsedDate) {
      filters.date = { operator, value: parsedDate };
      textQuery = textQuery.replace(dateMatch[0], '').trim();
    }
  }

  // Parse "after" and "before" date keywords
  const afterRegex = /after\s+([A-Za-z]+\s+\d{1,2}(?:,?\s*\d{4})?|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/gi;
  const afterMatch = afterRegex.exec(query);
  if (afterMatch) {
    const dateStr = afterMatch[1];
    const parsedDate = parseDate(dateStr);
    if (parsedDate) {
      filters.date = { operator: '>', value: parsedDate };
      textQuery = textQuery.replace(afterMatch[0], '').trim();
    }
  }

  const beforeRegex = /before\s+([A-Za-z]+\s+\d{1,2}(?:,?\s*\d{4})?|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/gi;
  const beforeMatch = beforeRegex.exec(query);
  if (beforeMatch) {
    const dateStr = beforeMatch[1];
    const parsedDate = parseDate(dateStr);
    if (parsedDate) {
      filters.date = { operator: '<', value: parsedDate };
      textQuery = textQuery.replace(beforeMatch[0], '').trim();
    }
  }

  // Parse risk categories (e.g., "high risk", "low risk")
  const riskCategoryRegex = /\b(very high|high|intermediate|borderline|low)\s*risk?\b/gi;
  const riskCategoryMatch = riskCategoryRegex.exec(query);
  if (riskCategoryMatch) {
    filters.riskCategory = riskCategoryMatch[1].toLowerCase();
    textQuery = textQuery.replace(riskCategoryMatch[0], '').trim();
  }

  return { textQuery: textQuery.trim(), filters };
}

function parseDate(dateStr: string): Date | null {
  try {
    // Handle formats like "August 3", "August 3, 2024", "2024-01-01", "1/1/2024"
    const currentYear = new Date().getFullYear();
    
    // If it's just "Month Day", add current year
    if (/^[A-Za-z]+\s+\d{1,2}$/.test(dateStr)) {
      dateStr += `, ${currentYear}`;
    }
    
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function applyFilters(results: any[], filters: ParsedQuery['filters']): any[] {
  return results.filter(result => {
    // Apply risk score filter
    if (filters.riskScore) {
      const riskScore = parseFloat(result.risk_score);
      const { operator, value } = filters.riskScore;
      
      switch (operator) {
        case '>':
          if (riskScore <= value) return false;
          break;
        case '>=':
          if (riskScore < value) return false;
          break;
        case '<':
          if (riskScore >= value) return false;
          break;
        case '<=':
          if (riskScore > value) return false;
          break;
        case '=':
        case '==':
          if (riskScore !== value) return false;
          break;
      }
    }

    // Apply date filter
    if (filters.date) {
      const assessmentDate = new Date(result.created_at);
      const { operator, value } = filters.date;
      
      switch (operator) {
        case '>':
          if (assessmentDate <= value) return false;
          break;
        case '>=':
          if (assessmentDate < value) return false;
          break;
        case '<':
          if (assessmentDate >= value) return false;
          break;
        case '<=':
          if (assessmentDate > value) return false;
          break;
      }
    }

    // Apply risk category filter
    if (filters.riskCategory) {
      const resultCategory = (result.risk_category || '').toLowerCase();
      if (!resultCategory.includes(filters.riskCategory)) return false;
    }

    return true;
  });
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

    console.log(`Search request - Query: "${query}", Status: "${status}"`);

    // Parse the query to extract filters and text search
    const parsedQuery = parseSearchQuery(query);
    console.log('Parsed query:', parsedQuery);

    // Check for required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
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

    let searchResults: any[] = [];

    // If there's a text query, perform vector search
    if (parsedQuery.textQuery) {
      console.log('Generating embedding for text query:', parsedQuery.textQuery);
      const model = new Supabase.ai.Session('gte-small');
      const queryEmbedding = await model.run(parsedQuery.textQuery, { 
        mean_pool: true, 
        normalize: true 
      });

      console.log('Generated embedding, performing vector search...');

      // Perform vector similarity search
      const { data: vectorResults, error } = await supabase
        .rpc('search_assessments_vector', {
          query_embedding: queryEmbedding,
          similarity_threshold: 0.1,
          match_count: 100
        });

      if (error) {
        console.error('Vector search error:', error);
        return new Response(
          JSON.stringify({ error: `Search failed: ${error.message}` }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      searchResults = vectorResults || [];
      console.log(`Vector search returned ${searchResults.length} results`);
    } else {
      // If no text query, get all assessments for filtering
      console.log('No text query, fetching all assessments for filtering...');
      const { data: allResults, error } = await supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Database query error:', error);
        return new Response(
          JSON.stringify({ error: `Query failed: ${error.message}` }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Add similarity score of 1.0 for non-vector results
      searchResults = (allResults || []).map(result => ({ ...result, similarity: 1.0 }));
      console.log(`Fetched ${searchResults.length} assessments for filtering`);
    }

    // Apply numerical and date filters
    if (Object.keys(parsedQuery.filters).length > 0) {
      console.log('Applying filters:', parsedQuery.filters);
      searchResults = applyFilters(searchResults, parsedQuery.filters);
      console.log(`After filtering: ${searchResults.length} results`);
    }

    // Filter by status
    const filteredResults = searchResults.filter(result => 
      status === 'all' || result.status === status
    );

    console.log(`After status filtering: ${filteredResults.length} results`);

    // Sort by similarity (if vector search was used) or by date
    filteredResults.sort((a, b) => {
      if (parsedQuery.textQuery) {
        return (b.similarity || 0) - (a.similarity || 0);
      } else {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      }
    });

    return new Response(
      JSON.stringify({ 
        results: filteredResults,
        parsedQuery: parsedQuery,
        totalFound: filteredResults.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
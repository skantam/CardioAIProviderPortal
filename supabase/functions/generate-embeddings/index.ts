import { createClient } from 'npm:@supabase/supabase-js@2.53.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Check for required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
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

    // Get all assessments without embeddings
    const { data: assessments, error: fetchError } = await supabase
      .from('assessments')
      .select('*')
      .is('embedding', null);

    if (fetchError) {
      console.error('Error fetching assessments:', fetchError);
      return new Response(
        JSON.stringify({ error: `Failed to fetch assessments: ${fetchError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!assessments || assessments.length === 0) {
      return new Response(
        JSON.stringify({ message: "No assessments need embeddings", processed: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing ${assessments.length} assessments for embeddings`);

    // Initialize the embedding model
    const model = new Supabase.ai.Session('gte-small');
    let processed = 0;
    let errors = 0;

    // Process assessments in batches
    for (const assessment of assessments) {
      try {
        // Create text representation of the assessment
        const textParts = [];
        
        // Add risk information
        if (assessment.risk_category) textParts.push(assessment.risk_category);
        if (assessment.risk_score) textParts.push(`risk score ${assessment.risk_score}`);
        
        // Add recommendations
        if (assessment.overall_recommendation) textParts.push(assessment.overall_recommendation);
        if (assessment.provider_comments) textParts.push(assessment.provider_comments);
        
        // Add input data
        if (assessment.inputs && typeof assessment.inputs === 'object') {
          Object.entries(assessment.inputs).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              textParts.push(`${key}: ${value}`);
            }
          });
        }
        
        // Add recommendations array
        if (assessment.recommendations && Array.isArray(assessment.recommendations)) {
          assessment.recommendations.forEach((rec: any) => {
            if (rec.category) textParts.push(rec.category);
            if (rec.text) textParts.push(rec.text);
          });
        }

        const assessmentText = textParts.join(' ').trim();

        if (!assessmentText) {
          console.log(`Skipping assessment ${assessment.id} - no text content`);
          continue;
        }

        console.log(`Generating embedding for assessment ${assessment.id}`);

        // Generate embedding
        const embedding = await model.run(assessmentText, { 
          mean_pool: true, 
          normalize: true 
        });

        // Update the assessment with the embedding
        const { error: updateError } = await supabase
          .from('assessments')
          .update({ embedding })
          .eq('id', assessment.id);

        if (updateError) {
          console.error(`Error updating assessment ${assessment.id}:`, updateError);
          errors++;
        } else {
          processed++;
          console.log(`Generated embedding for assessment ${assessment.id}`);
        }

      } catch (error) {
        console.error(`Error processing assessment ${assessment.id}:`, error);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Embedding generation completed",
        processed,
        errors,
        total: assessments.length
      }),
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
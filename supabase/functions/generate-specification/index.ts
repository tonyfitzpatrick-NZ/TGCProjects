import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ============================================================
// TYPES (move these to src/types/database.ts later)
// ============================================================

interface SpecCbiCategory {
  id: string
  cbi_prefix: string
  category_label: string
  nzbc_clauses: string | null
}

interface Project {
  id: string
  name: string
  address: string | null
}

interface GenerateSpecificationResponse {
  success: boolean
  project: Project | null
  toc: Array<{
    number: string
    title: string
    cbi_prefix: string
    nzbc_clauses: string | null
    page: string
  }>
  section_count: number
  generated_at: string
}

// ============================================================
// EDGE FUNCTION
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { project_id } = await req.json()

    if (!project_id) {
      throw new Error('project_id is required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get basic project info
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, address')
      .eq('id', project_id)
      .single()

    if (projectError) throw projectError

    // Get CBI categories linked through scheduling items
    const { data: schedItems, error: schedError } = await supabase
      .from('sched_items')
      .select(`
        cbi_category_id,
        spec_cbi_categories (
          id,
          cbi_prefix,
          category_label,
          nzbc_clauses
        )
      `)
      .eq('project_id', project_id)
      .not('cbi_category_id', 'is', null)

    if (schedError) throw schedError

    // Deduplicate and sort by cbi_prefix
    const uniqueCbi = Array.from(
      new Map(
        schedItems
          .filter((item: any) => item.spec_cbi_categories)
          .map((item: any) => [
            item.spec_cbi_categories.id,
            item.spec_cbi_categories as SpecCbiCategory,
          ])
      ).values()
    ).sort((a, b) => a.cbi_prefix.localeCompare(b.cbi_prefix))

    // Build dynamic Table of Contents
    const toc = uniqueCbi.map((section, index) => ({
      number: (index + 1).toString(),
      title: section.category_label,
      cbi_prefix: section.cbi_prefix,
      nzbc_clauses: section.nzbc_clauses,
      page: String(12 + index * 2), // TODO: Replace with real page numbers later
    }))

    const response: GenerateSpecificationResponse = {
      success: true,
      project: project as Project,
      toc,
      section_count: toc.length,
      generated_at: new Date().toISOString(),
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Error in generate-specification:', err)
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Unknown error',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
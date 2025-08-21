import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LightcastSkill {
  id: string
  name: string
  category?: string
  description?: string
  aliases?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const lightcastUrl = Deno.env.get('LIGHTCAST_OPEN_SKILLS_URL') ?? 
      'https://github.com/lightcast-dev/Open-Skills/raw/main/open_skills.json'

    console.log(`Fetching Lightcast Open Skills from: ${lightcastUrl}`)

    // Fetch the Lightcast Open Skills data
    const response = await fetch(lightcastUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch Lightcast data: ${response.status}`)
    }

    const data = await response.json()
    const skills: LightcastSkill[] = Array.isArray(data) ? data : data.skills || []
    
    if (!skills.length) {
      throw new Error('No skills found in Lightcast data')
    }

    console.log(`Processing ${skills.length} skills from Lightcast`)

    // Get current timestamp for source_version
    const sourceVersion = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    let skillsUpserted = 0
    let aliasesUpserted = 0
    const batchSize = 1000

    // Process skills in batches
    for (let i = 0; i < skills.length; i += batchSize) {
      const batch = skills.slice(i, i + batchSize)
      
      // Prepare skills data for upsert
      const skillsData = batch.map(skill => ({
        lightcast_id: skill.id,
        name: skill.name,
        category: skill.category || 'General',
        description: skill.description || '',
        source: 'LIGHTCAST',
        source_version: sourceVersion
      }))

      // Upsert skills
      const { data: upsertedSkills, error: skillsError } = await supabaseClient
        .from('skills')
        .upsert(skillsData, { 
          onConflict: 'lightcast_id',
          ignoreDuplicates: false 
        })
        .select('id, lightcast_id')

      if (skillsError) {
        console.error('Error upserting skills:', skillsError)
        throw skillsError
      }

      skillsUpserted += upsertedSkills?.length || 0

      // Create skill ID lookup map
      const skillIdMap = new Map<string, string>()
      upsertedSkills?.forEach(skill => {
        if (skill.lightcast_id) {
          skillIdMap.set(skill.lightcast_id, skill.id)
        }
      })

      // Prepare aliases data
      const aliasesData: { skill_id: string; alias: string }[] = []
      
      batch.forEach(skill => {
        const skillId = skillIdMap.get(skill.id)
        if (skillId && skill.aliases) {
          skill.aliases.forEach(alias => {
            if (alias.trim() && alias.toLowerCase() !== skill.name.toLowerCase()) {
              aliasesData.push({
                skill_id: skillId,
                alias: alias.trim()
              })
            }
          })
        }
      })

      // Upsert aliases if any exist
      if (aliasesData.length > 0) {
        const { error: aliasesError } = await supabaseClient
          .from('skill_aliases')
          .upsert(aliasesData, { 
            onConflict: 'skill_id,alias',
            ignoreDuplicates: true 
          })

        if (aliasesError) {
          console.error('Error upserting aliases:', aliasesError)
          throw aliasesError
        }

        aliasesUpserted += aliasesData.length
      }

      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(skills.length / batchSize)}`)
    }

    const result = {
      success: true,
      skills_processed: skills.length,
      skills_upserted: skillsUpserted,
      aliases_upserted: aliasesUpserted,
      source_version: sourceVersion,
      timestamp: new Date().toISOString()
    }

    console.log('ETL completed:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('ETL error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function enrichSchoolData(school) {
  console.log(`\n🔍 Enriching data for: ${school.name}`)
  
  try {
    // Use AI to search and gather school information
    const prompt = `You are a research assistant. Find information about "${school.name}" educational institution.

Please provide the following in JSON format:
{
  "bio": "A 2-3 sentence description of the school, its mission, and what makes it unique",
  "city": "City where main campus is located",
  "state": "State abbreviation (e.g., FL, CA, NY)",
  "about_url": "Official website URL",
  "profile_image_url": "A relevant image URL from their website or a stock education image URL that represents the school"
}

Only include fields you're confident about. If you're unsure, omit that field.
Return valid JSON only, no markdown or explanation.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful research assistant that finds accurate information about educational institutions. Always return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    })

    const enrichedData = JSON.parse(completion.choices[0].message.content)
    console.log('📊 AI Response:', enrichedData)

    // Update the school record with enriched data
    const updateData = {}
    
    // Only update fields that are currently null/empty and AI provided data
    if (enrichedData.bio && !school.bio) updateData.bio = enrichedData.bio
    // Note: school_type column doesn't exist in DB, skipping it
    if (enrichedData.city && !school.city) updateData.city = enrichedData.city
    if (enrichedData.state && !school.state) updateData.state = enrichedData.state
    if (enrichedData.about_url && !school.about_url) updateData.about_url = enrichedData.about_url
    if (enrichedData.profile_image_url && !school.profile_image_url) updateData.profile_image_url = enrichedData.profile_image_url

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('schools')
        .update(updateData)
        .eq('id', school.id)

      if (error) {
        console.error('❌ Error updating school:', error.message)
        return { success: false, error: error.message }
      }

      console.log('✅ Updated fields:', Object.keys(updateData).join(', '))
      return { success: true, updatedFields: Object.keys(updateData) }
    } else {
      console.log('ℹ️  No updates needed - all fields already populated')
      return { success: true, updatedFields: [] }
    }

  } catch (error) {
    console.error('❌ Error enriching school data:', error.message)
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('🚀 Starting school data enrichment...\n')

  // Get all schools
  const { data: schools, error } = await supabase
    .from('schools')
    .select('*')
    .order('name')

  if (error) {
    console.error('❌ Error fetching schools:', error.message)
    process.exit(1)
  }

  console.log(`📚 Found ${schools.length} schools to process\n`)

  const results = {
    total: schools.length,
    updated: 0,
    skipped: 0,
    failed: 0
  }

  // Process each school with a delay to avoid rate limits
  for (const school of schools) {
    const result = await enrichSchoolData(school)
    
    if (result.success) {
      if (result.updatedFields.length > 0) {
        results.updated++
      } else {
        results.skipped++
      }
    } else {
      results.failed++
    }

    // Wait 2 seconds between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 ENRICHMENT SUMMARY')
  console.log('='.repeat(50))
  console.log(`Total schools: ${results.total}`)
  console.log(`✅ Updated: ${results.updated}`)
  console.log(`ℹ️  Skipped (already complete): ${results.skipped}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log('='.repeat(50))

  process.exit(0)
}

main()

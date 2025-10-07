# School Data Enrichment Script

## Overview
This script uses OpenAI's GPT-4 to automatically enrich school data in the database by researching and filling in missing information.

## What It Does

The script will:
1. Fetch all schools from the database
2. For each school with missing data, use AI to research and find:
   - **Bio**: 2-3 sentence description of the school
   - **School Type**: University, College, Technical College, etc.
   - **Location**: City and State
   - **Website**: Official about/website URL
   - **Profile Image**: A relevant image URL from their website

3. Only updates fields that are currently empty (won't overwrite existing data)
4. Processes schools with a 2-second delay to avoid API rate limits

## Prerequisites

1. **OpenAI API Key**: You need an OpenAI API key in your `.env.local`:
   ```
   OPENAI_API_KEY=sk-...
   ```

2. **Supabase Service Role Key**: Already in `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

## How to Run

```bash
# From the project root
node scripts/enrich-school-data.js
```

## Expected Output

```
🚀 Starting school data enrichment...

📚 Found 15 schools to process

🔍 Enriching data for: St. Petersburg College
📊 AI Response: { bio: "...", school_type: "Community College", ... }
✅ Updated fields: bio, city, state, about_url, profile_image_url

🔍 Enriching data for: University of South Florida
📊 AI Response: { bio: "...", ... }
✅ Updated fields: bio, profile_image_url

...

==================================================
📊 ENRICHMENT SUMMARY
==================================================
Total schools: 15
✅ Updated: 12
ℹ️  Skipped (already complete): 2
❌ Failed: 1
==================================================
```

## Cost Estimate

- Uses GPT-4o model
- ~$0.01-0.02 per school
- For 15 schools: ~$0.15-0.30 total

## Safety Features

- ✅ Only updates empty fields (preserves existing data)
- ✅ Rate limiting (2 second delay between requests)
- ✅ Error handling for each school
- ✅ Detailed logging of all changes
- ✅ JSON validation of AI responses

## Database Fields Updated

- `bio` - School description
- `school_type` - Type of institution
- `city` - City location
- `state` - State abbreviation
- `about_url` - Official website
- `profile_image_url` - Featured image URL

## Notes

- The AI is instructed to only include fields it's confident about
- If a school name is ambiguous, the AI will try to find the most relevant match
- Profile images are sourced from official websites when possible
- You can run this script multiple times safely - it won't overwrite existing data

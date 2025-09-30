import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CIPSuggestion {
  cipCode: string;
  cipTitle: string;
  confidence: number; // 0-100
  reasoning: string;
}

export async function suggestCIPCodes(
  programName: string,
  programDescription?: string,
  programType?: string,
  discipline?: string
): Promise<CIPSuggestion[]> {
  
  const context = `
Program Name: ${programName}
Program Type: ${programType || 'Unknown'}
Discipline: ${discipline || 'Unknown'}
Description: ${programDescription || 'Not provided'}

Task: Suggest the 3 most appropriate CIP 2020 codes for this educational program.

Consider:
- Program level (certificate, associate's, bachelor's, master's, etc.)
- Subject matter and discipline area
- Specific skills and content areas taught
- Industry alignment and career outcomes
- Use 6-digit CIP codes (format: ##.####)

Return top 3 CIP codes with confidence scores (0-100) and brief reasoning.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cheaper, faster, higher rate limits
      messages: [
        {
          role: "system",
          content: `You are a CIP code classification expert. You help assign Classification of Instructional Programs (CIP) codes to educational programs based on NCES CIP 2020 taxonomy.

CIP codes follow this format:
- 2-digit: Series (e.g., 11 = Computer and Information Sciences)
- 4-digit: Program group (e.g., 11.01 = Computer Science)
- 6-digit: Specific program (e.g., 11.0101 = Computer and Information Sciences, General)

Always suggest 6-digit CIP codes that best match the program's content, level, and discipline.

IMPORTANT: Return ONLY valid JSON, no other text.

Format:
{
  "suggestions": [
    {
      "cipCode": "11.0101",
      "cipTitle": "Computer and Information Sciences, General.",
      "confidence": 95,
      "reasoning": "Direct match for general computer science program at associate level"
    }
  ]
}

Be conservative with confidence scores:
- 90-100: Exact match, very confident
- 75-89: Strong match, confident
- 50-74: Reasonable match, some uncertainty
- Below 50: Weak match, low confidence`
        },
        {
          role: "user",
          content: context
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 400
    });

    const result = JSON.parse(response.choices[0].message.content || '{"suggestions":[]}');
    return result.suggestions || [];
    
  } catch (error) {
    console.error('Error getting CIP suggestions:', error);
    return [];
  }
}

export async function validateCIPCode(cipCode: string): Promise<boolean> {
  // This would check against our cip_codes table
  // For now, basic format validation
  const cipPattern = /^\d{2}\.\d{4}$/;
  return cipPattern.test(cipCode);
}

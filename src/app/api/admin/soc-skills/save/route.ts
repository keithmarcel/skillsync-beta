import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { socCode, skills } = await request.json();

    if (!socCode) {
      return NextResponse.json(
        { error: 'SOC Code is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json(
        { error: 'Skills array is required' },
        { status: 400 }
      );
    }

    // First, ensure all skills exist in the skills table (upsert)
    const skillRecords = [];
    for (const skill of skills) {
      // Check if skill exists
      let { data: existingSkill } = await supabase
        .from('skills')
        .select('id')
        .eq('name', skill.skill_name)
        .single();

      if (!existingSkill) {
        // Create new skill
        const { data: newSkill, error: createError } = await supabase
          .from('skills')
          .insert({
            name: skill.skill_name,
            description: skill.description,
            source: 'OPENAI',
            category: 'General', // Default category
            is_assessable: true
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating skill:', createError);
          continue;
        }
        existingSkill = newSkill;
      } else if (skill.description) {
        // Update description if provided
        await supabase
          .from('skills')
          .update({ description: skill.description })
          .eq('id', existingSkill.id);
      }

      skillRecords.push({
        skill_id: existingSkill.id,
        weight: skill.weight || 0.5,
        display_order: skill.display_order || 0
      });
    }

    // Now create soc_skills mappings
    const socSkillsInserts = skillRecords.map(sr => ({
      soc_code: socCode,
      skill_id: sr.skill_id,
      weight: sr.weight,
      display_order: sr.display_order
    }));

    const { error: insertError } = await supabase
      .from('soc_skills')
      .insert(socSkillsInserts);

    if (insertError) {
      console.error('Error inserting soc_skills:', insertError);
      return NextResponse.json(
        { error: 'Failed to save skills to SOC mapping' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      skillsSaved: skillRecords.length,
      socCode
    });
  } catch (error) {
    console.error('Save SOC skills error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

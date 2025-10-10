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

    // Create soc_skills mappings (skills already exist in skills table)
    const socSkillsInserts = skills.map(skill => ({
      soc_code: socCode,
      skill_id: skill.skill_id,
      weight: skill.weight || 0.8,
      display_order: skill.display_order || 0
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
      skillsSaved: skills.length,
      socCode
    });
  } catch (error) {
    console.error('Save manual SOC skills error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

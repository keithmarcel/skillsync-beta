import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: programSkills, error } = await supabase
      .from('program_skills')
      .select(`
        weight,
        skill:skills(id, name, source)
      `)
      .eq('program_id', params.id)
      .order('weight', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const skills = programSkills?.map(ps => ({
      id: ps.skill.id,
      name: ps.skill.name,
      source: ps.skill.source,
      weight: ps.weight
    })) || [];

    return NextResponse.json({ skills });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

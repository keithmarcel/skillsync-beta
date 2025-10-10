import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First, get the job to find its SOC code
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('soc_code')
      .eq('id', params.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (!job.soc_code) {
      return NextResponse.json({
        skills: [],
        message: 'No SOC code assigned to this role'
      });
    }

    // Fetch curated skills from soc_skills table (SOC taxonomy mapping)
    const { data: socSkills, error: skillsError } = await supabase
      .from('soc_skills')
      .select(`
        weight,
        display_order,
        skill:skills(
          id,
          name,
          category,
          description
        )
      `)
      .eq('soc_code', job.soc_code)
      .order('weight', { ascending: false });

    if (skillsError) {
      console.error('Failed to fetch SOC skills:', skillsError);
      return NextResponse.json(
        { error: 'Failed to fetch skills' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      skills: (socSkills || []).map((ss: any) => ({
        id: ss.skill.id,
        name: ss.skill.name,
        category: ss.skill.category,
        description: ss.skill.description,
        weight: ss.weight,
        display_order: ss.display_order
      })),
      source: 'soc_skills',
      soc_code: job.soc_code
    });
  } catch (error) {
    console.error('Failed to fetch job skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

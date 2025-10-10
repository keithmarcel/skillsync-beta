import { NextRequest, NextResponse } from 'next/server';
import { getJobSkills } from '@/lib/database/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const skills = await getJobSkills(params.id);
    
    return NextResponse.json({
      skills: skills.map(js => ({
        id: js.skill.id,
        name: js.skill.name,
        category: js.skill.category,
        weight: js.weight
      }))
    });
  } catch (error) {
    console.error('Failed to fetch job skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

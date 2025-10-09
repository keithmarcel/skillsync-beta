import { NextRequest, NextResponse } from 'next/server';
import { generateCoreResponsibilities } from '@/lib/services/generate-core-responsibilities';

export async function POST(request: NextRequest) {
  try {
    const { occupationTitle, socCode, tasks, skills } = await request.json();

    if (!occupationTitle || !socCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const responsibilities = await generateCoreResponsibilities(
      occupationTitle,
      socCode,
      tasks,
      skills
    );

    return NextResponse.json({ responsibilities });
  } catch (error) {
    console.error('Error in generate-responsibilities API:', error);
    return NextResponse.json(
      { error: 'Failed to generate responsibilities' },
      { status: 500 }
    );
  }
}

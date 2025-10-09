import { NextRequest, NextResponse } from 'next/server';
import { generateRelatedJobTitles } from '@/lib/services/generate-related-titles';

export async function POST(request: NextRequest) {
  try {
    const { occupationTitle, socCode } = await request.json();

    if (!occupationTitle || !socCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const titles = await generateRelatedJobTitles(occupationTitle, socCode);

    return NextResponse.json({ titles });
  } catch (error) {
    console.error('Error in generate-related-titles API:', error);
    return NextResponse.json(
      { error: 'Failed to generate related titles' },
      { status: 500 }
    );
  }
}

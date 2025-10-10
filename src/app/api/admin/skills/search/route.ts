import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({
        skills: [],
        message: 'Query must be at least 2 characters'
      });
    }

    // Search ONLY skills that are already in use (soc_skills or program_skills)
    // This creates a self-reinforcing, curated pool that grows as HDOs are curated
    const { data: skills, error } = await supabase
      .from('skills')
      .select(`
        id, 
        name, 
        category, 
        description,
        soc_skills!inner(soc_code),
        program_skills(program_id)
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_active', true)
      .order('name')
      .limit(20);

    if (error) {
      console.error('Skills search error:', error);
      return NextResponse.json(
        { error: 'Failed to search skills' },
        { status: 500 }
      );
    }

    // Deduplicate and clean up
    const uniqueSkills = skills?.reduce((acc: any[], skill) => {
      const existing = acc.find(s => s.id === skill.id);
      if (!existing) {
        acc.push({
          id: skill.id,
          name: skill.name,
          category: skill.category,
          description: skill.description
        });
      }
      return acc;
    }, []) || [];

    return NextResponse.json({
      skills: uniqueSkills,
      count: uniqueSkills.length,
      message: 'Showing only skills already in use (curated via AI extractor)'
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

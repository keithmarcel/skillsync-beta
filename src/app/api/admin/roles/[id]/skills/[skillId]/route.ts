import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; skillId: string } }
) {
  try {
    const { id: jobId, skillId } = params;

    // Delete the job_skill relationship
    const { error } = await supabase
      .from('job_skills')
      .delete()
      .eq('job_id', jobId)
      .eq('skill_id', skillId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing skill:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove skill' },
      { status: 500 }
    );
  }
}

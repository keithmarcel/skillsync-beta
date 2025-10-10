import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; skillId: string } }
) {
  try {
    const { id: jobId, skillId } = params;

    console.log('🗑️ DELETE API called:', { jobId, skillId });

    // Delete the job_skill relationship
    const { data, error, count } = await supabase
      .from('job_skills')
      .delete()
      .eq('job_id', jobId)
      .eq('skill_id', skillId)
      .select();

    console.log('🗑️ DELETE result:', { data, error, count });

    if (error) {
      console.error('🗑️ DELETE error:', error);
      throw error;
    }

    return NextResponse.json({ success: true, deleted: data });
  } catch (error: any) {
    console.error('Error removing skill:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove skill' },
      { status: 500 }
    );
  }
}

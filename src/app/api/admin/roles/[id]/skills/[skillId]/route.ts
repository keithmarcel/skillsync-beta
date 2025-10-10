import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; skillId: string } }
) {
  try {
    const { id: jobId, skillId } = params;

    console.log('🗑️ DELETE API called:', { jobId, skillId });

    // First, get the job's SOC code
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('soc_code')
      .eq('id', jobId)
      .single();

    if (jobError || !job || !job.soc_code) {
      throw new Error('Job or SOC code not found');
    }

    // Delete from soc_skills table (SOC taxonomy mapping)
    const { data, error } = await supabase
      .from('soc_skills')
      .delete()
      .eq('soc_code', job.soc_code)
      .eq('skill_id', skillId)
      .select();

    console.log('🗑️ DELETE result:', { data, error, rowsDeleted: data?.length });

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

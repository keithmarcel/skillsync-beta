'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface ProgramJob {
  job_id: string;
  match_type: 'auto' | 'manual' | 'fuzzy';
  match_confidence: number;
  notes?: string;
  job: {
    id: string;
    title: string;
    soc_code: string;
  };
}

interface Props {
  programId: string;
  cipCode?: string;
}

export function ProgramJobsManager({ programId, cipCode }: Props) {
  const [programJobs, setProgramJobs] = useState<ProgramJob[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadProgramJobs();
    loadAvailableJobs();
  }, [programId]);

  async function loadProgramJobs() {
    const { data, error } = await supabase
      .from('program_jobs')
      .select(`
        job_id,
        match_type,
        match_confidence,
        notes,
        job:jobs(id, title, soc_code)
      `)
      .eq('program_id', programId);

    if (!error && data) {
      setProgramJobs(data as any);
    }
    setIsLoading(false);
  }

  async function loadAvailableJobs() {
    const { data } = await supabase
      .from('jobs')
      .select('id, title, soc_code')
      .order('title');

    if (data) {
      setAvailableJobs(data);
    }
  }

  async function addJob(jobId: string) {
    const { error } = await supabase
      .from('program_jobs')
      .insert({
        program_id: programId,
        job_id: jobId,
        match_type: 'manual',
        match_confidence: 1.0
      });

    if (!error) {
      loadProgramJobs();
    }
  }

  async function removeJob(jobId: string) {
    const { error } = await supabase
      .from('program_jobs')
      .delete()
      .eq('program_id', programId)
      .eq('job_id', jobId);

    if (!error) {
      loadProgramJobs();
    }
  }

  const linkedJobIds = new Set(programJobs.map(pj => pj.job_id));
  const unlinkedJobs = availableJobs.filter(j => !linkedJobIds.has(j.id));

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading job associations...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Current Associations */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Associated Jobs ({programJobs.length})</h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Job
          </Button>
        </div>

        {programJobs.length === 0 ? (
          <div className="text-sm text-muted-foreground p-4 bg-gray-50 rounded">
            <p>No jobs associated yet.</p>
            {cipCode && (
              <p className="mt-1">
                CIP Code <span className="font-mono">{cipCode}</span> maps to specific SOC codes via the crosswalk.
                You can manually add relevant jobs here.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {programJobs.map((pj) => (
              <div
                key={pj.job_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{pj.job.title}</span>
                    <Badge variant={pj.match_type === 'manual' ? 'default' : 'secondary'}>
                      {pj.match_type}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    SOC: {pj.job.soc_code}
                    {pj.match_confidence < 1.0 && (
                      <span className="ml-2">
                        Confidence: {(pj.match_confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {pj.notes && (
                    <div className="text-xs text-muted-foreground mt-1 italic">
                      Note: {pj.notes}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`/admin/jobs/${pj.job_id}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  {pj.match_type === 'manual' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeJob(pj.job_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Job Interface */}
      {isAdding && (
        <div className="border rounded p-4 bg-white">
          <h4 className="text-sm font-medium mb-2">Add Job Association</h4>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {unlinkedJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">All jobs are already linked</p>
            ) : (
              unlinkedJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                >
                  <div>
                    <div className="text-sm font-medium">{job.title}</div>
                    <div className="text-xs text-muted-foreground">SOC: {job.soc_code}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      addJob(job.id);
                      setIsAdding(false);
                    }}
                  >
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Crosswalk Info */}
      {cipCode && (
        <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded">
          <p className="font-medium">About Job Matching:</p>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li><strong>Auto:</strong> Jobs matched via official CIP-SOC crosswalk</li>
            <li><strong>Manual:</strong> Jobs you've added based on program relevance</li>
            <li><strong>Fuzzy:</strong> Jobs matched by skill similarity (future)</li>
          </ul>
        </div>
      )}
    </div>
  );
}

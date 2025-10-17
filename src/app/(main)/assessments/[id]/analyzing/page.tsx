'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import PageHeader from '@/components/ui/page-header';
import BreadcrumbLayout from '@/components/ui/breadcrumb-layout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AssessmentAnalyzingPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  const [job, setJob] = useState<any>(null);
  const [analysisTriggered, setAnalysisTriggered] = useState(false);

  useEffect(() => {
    // Load assessment and job data
    const loadAssessmentData = async () => {
      const { data: assessment } = await supabase
        .from('assessments')
        .select('*, job:jobs(id, title, soc_code, company:companies(name))')
        .eq('id', assessmentId)
        .single();

      if (assessment?.job) {
        setJob(assessment.job);
      }
    };

    loadAssessmentData();
  }, [assessmentId]);


  useEffect(() => {
    // Trigger AI analysis once
    const triggerAnalysis = async () => {
      if (analysisTriggered) return;
      
      setAnalysisTriggered(true);
      
      try {
        console.log('Triggering AI analysis for assessment:', assessmentId);
        const response = await fetch('/api/assessments/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assessmentId })
        });
        
        const result = await response.json();
        console.log('AI analysis response:', response.status, result);
        
        if (!response.ok) {
          console.error('AI analysis failed:', result);
        }
      } catch (error) {
        console.error('Error triggering analysis:', error);
      }
    };

    triggerAnalysis();
  }, [assessmentId, analysisTriggered]);

  useEffect(() => {
    // Poll for assessment completion
    const checkAssessmentStatus = async () => {
      const { data: assessment } = await supabase
        .from('assessments')
        .select('analyzed_at, readiness_pct')
        .eq('id', assessmentId)
        .single();

      if (assessment?.analyzed_at && assessment?.readiness_pct !== null) {
        // Assessment is complete, redirect to results
        router.push(`/assessments/${assessmentId}/results`);
      }
    };

    // Check immediately
    checkAssessmentStatus();

    // Then poll every 2 seconds
    const pollInterval = setInterval(checkAssessmentStatus, 2000);

    return () => clearInterval(pollInterval);
  }, [assessmentId, router]);

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0694A2]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title={`${job.title} Assessment`}
        subtitle={job.company?.name ? `${job.company.name} | SOC Code: ${job.soc_code}` : `SOC Code: ${job.soc_code}`}
        variant="split"
      />

      {/* Breadcrumb Layout wraps content */}
      <BreadcrumbLayout items={[
        { label: 'Jobs', href: '/jobs' },
        { label: job.title, href: `/jobs/${job.id}` },
        { label: 'Assessment Analysis', isActive: true }
      ]}>
        <div className="bg-white rounded-lg shadow-sm p-12">
          <div className="flex flex-col items-center justify-center text-center">
            {/* SkillSync Logo */}
            <div className="mb-8">
              <Image
                src="/app/logo_skillsync-powered-by-bisk-amplified.svg"
                alt="SkillSync - Powered by Bisk Amplified"
                width={122}
                height={24}
                priority
              />
            </div>

            {/* Diamond Loader */}
            <div className="mb-8">
              <LoadingSpinner size={80} />
            </div>

            {/* Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Analyzing your assessment
            </h2>
            <p className="text-gray-600 max-w-md">
              Our AI is reviewing your responses and calculating your role readiness score. This typically takes 30-60 seconds.
            </p>

            {/* Progress indicator */}
            <div className="mt-8 w-full max-w-md">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#0694A2] rounded-full animate-progress"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom CSS for progress animation */}
        <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }

        .animate-progress {
          animation: progress 3s ease-in-out infinite;
        }
        `}</style>
      </BreadcrumbLayout>
    </div>
  );
}

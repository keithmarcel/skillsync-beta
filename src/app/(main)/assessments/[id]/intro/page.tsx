'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AssessmentSimulator } from '@/components/admin/AssessmentSimulator';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

export default function AssessmentIntroPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const jobId = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = user?.email === 'keith-woods@bisk.com';

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, company:companies(name, logo_url)')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      
      // Find quiz for this job
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('job_id', data.id)
        .single();
      
      if (quizError || !quizData) {
        console.error('No quiz found for this job:', quizError);
        // Could show error message to user
      } else {
        setQuiz(quizData);
      }
      
      setJob(data);
    } catch (error) {
      console.error('Error loading job:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = () => {
    // Navigate to quiz page using quiz ID
    if (quiz?.id) {
      router.push(`/assessments/quiz/${quiz.id}`);
    } else {
      console.error('No quiz available for this job');
      // Show error to user that quiz hasn't been created yet
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Job not found</p>
          <Button asChild className="mt-4">
            <a href="/jobs">Back to Jobs</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            {job.company?.logo_url && (
              <Image
                src={job.company.logo_url}
                alt={job.company.name}
                width={48}
                height={48}
                className="rounded"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-600">
                {job.company?.name} • SOC Code: {job.soc_code}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Content */}
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See How Your Skills Stack Up
            </h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Complete this quiz to discover how your current skills align with the role
              of a {job.title}. We'll assess your technical knowledge, decision-making,
              and soft skills across key areas.
            </p>

            {/* Assessment Info */}
            <div className="flex items-center gap-2 text-teal-700 bg-teal-50 px-4 py-3 rounded-lg mb-8">
              <Clock className="h-5 w-5" />
              <span className="font-medium">This assessment takes ~5 minutes</span>
            </div>

            {/* What to Expect */}
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-900">What to Expect:</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Skills-Based Questions
                    </p>
                    <p className="text-sm text-gray-600">
                      Answer scenario-based questions testing your knowledge and
                      decision-making
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-6 w-6 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Instant Role Readiness Score
                    </p>
                    <p className="text-sm text-gray-600">
                      Get your personalized proficiency score and see where you excel
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Tailored Program Recommendations
                    </p>
                    <p className="text-sm text-gray-600">
                      Discover education programs to close any skill gaps
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <Button
              size="lg"
              onClick={startAssessment}
              className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 text-lg"
            >
              <Clock className="mr-2 h-5 w-5" />
              Start Quiz
            </Button>
          </div>

          {/* Right: Image */}
          <div className="relative">
            <div className="rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/assets/hero_my-assessments.jpg"
                alt="Construction workers"
                width={600}
                height={400}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>

        {/* Super Admin Simulator */}
        {isSuperAdmin && quiz && (
          <div className="mt-12">
            <AssessmentSimulator 
              jobId={jobId}
              quizId={quiz.id}
              userId={user?.id || "mock-user-id"}
            />
          </div>
        )}

        {/* Additional Info Card */}
        <Card className="mt-12 p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Why Take This Assessment?
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>
                Understand your current skill level compared to industry standards
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>
                Identify specific areas for professional development
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>
                Get matched with relevant training programs in your area
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>
                Demonstrate your qualifications to potential employers
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

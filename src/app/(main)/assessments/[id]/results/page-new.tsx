// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoleReadinessWidget } from '@/components/results/RoleReadinessWidget';
import { SkillsGapChart } from '@/components/results/SkillsGapChart';
import { ProgramMatchesCTA } from '@/components/results/ProgramMatchesCTA';
import {
  getAssessmentById,
  type Assessment,
  type AssessmentSkillResult
} from '@/lib/database/queries';
import { useToast } from '@/hooks/use-toast'
import { PageLoader } from '@/components/ui/loading-spinner'

import Link from 'next/link';

interface SkillGap {
  skillName: string;
  userScore: number;
  requiredScore: number;
  status: 'benchmark' | 'proficient' | 'building' | 'needs_development';
}

interface SkillDetail {
  name: string;
  percentage: number;
  description: string;
}

export default function AssessmentResultsPageNew() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [strengths, setStrengths] = useState<SkillDetail[]>([]);
  const [growthAreas, setGrowthAreas] = useState<SkillDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (assessmentId) {
      loadAssessmentResults();
    }
  }, [assessmentId]);

  const loadAssessmentResults = async () => {
    setLoading(true);
    try {
      const assessmentData = await getAssessmentById(assessmentId);
      if (!assessmentData) {
        router.push('/assessments');
        return;
      }
      setAssessment(assessmentData);

      // Calculate skill gaps and categorize
      if (assessmentData.skill_results && assessmentData.job) {
        await calculateSkillAnalysis(assessmentData);
      }
    } catch (error) {
      console.error('Error loading assessment results:', error);
      router.push('/assessments');
    } finally {
      setLoading(false);
    }
  };

  const calculateSkillAnalysis = async (assessmentData: Assessment) => {
    // Get job skills for comparison
    const { data: jobSkills } = await supabase
      .from('job_skills')
      .select(
        `
        skill_id,
        proficiency_threshold,
        skill:skills(*)
      `
      )
      .eq('job_id', assessmentData.job_id);

    if (!jobSkills || !assessmentData.skill_results) return;

    const gaps: SkillGap[] = [];
    const strengthsList: SkillDetail[] = [];
    const growthList: SkillDetail[] = [];

    for (const jobSkill of jobSkills) {
      const assessmentResult = assessmentData.skill_results.find(
        (result: AssessmentSkillResult) => result.skill_id === jobSkill.skill_id
      );

      if (assessmentResult) {
        const userScore = assessmentResult.score_pct;
        const requiredScore = (jobSkill.proficiency_threshold || 0.8) * 100;

        let status: 'benchmark' | 'proficient' | 'building' | 'needs_development' =
          'needs_development';
        if (userScore >= 90) status = 'benchmark';
        else if (userScore >= 80) status = 'proficient';
        else if (userScore >= 60) status = 'building';

        gaps.push({
          skillName: jobSkill.skill?.name || 'Unknown Skill',
          userScore,
          requiredScore,
          status
        });

        // Categorize into strengths or growth areas
        const skillDetail: SkillDetail = {
          name: jobSkill.skill?.name || 'Unknown Skill',
          percentage: userScore,
          description: getSkillDescription(userScore, status)
        };

        if (userScore >= 80) {
          strengthsList.push(skillDetail);
        } else {
          growthList.push(skillDetail);
        }
      }
    }

    // Sort by score
    gaps.sort((a, b) => b.userScore - a.userScore);
    strengthsList.sort((a, b) => b.percentage - a.percentage);
    growthList.sort((a, b) => a.percentage - b.percentage);

    setSkillGaps(gaps);
    setStrengths(strengthsList.slice(0, 3));
    setGrowthAreas(growthList.slice(0, 3));
  };

  const getSkillDescription = (score: number, status: string): string => {
    if (score >= 90) {
      return 'Demonstrates exceptional proficiency and mastery of this skill.';
    } else if (score >= 80) {
      return 'Shows strong competency and consistent performance in this area.';
    } else if (score >= 60) {
      return 'Developing proficiency with room for continued growth and practice.';
    }
    return 'Needs focused development to meet role requirements.';
  };

  const getSummaryText = (readiness: number): string => {
    if (readiness >= 90) {
      return 'You excel in strategic planning and leadership, critical skills for driving business success in the dynamic project management market. To further grow, focus on enhancing your project management, data analysis, and process improvement abilities. Engaging in business analytics and operations programs will support your career readiness.';
    } else if (readiness >= 70) {
      return 'You excel in strategic planning and leadership, critical skills for driving business success in the dynamic project management market. To further grow, focus on enhancing your project management, data analysis, and process improvement abilities. Engaging in business analytics and operations programs will support your career readiness.';
    } else if (readiness >= 50) {
      return 'You show promise in several key areas. Continue building your foundational skills while focusing on the specific competencies that will make you stand out in this role. Consider targeted training programs to accelerate your development.';
    }
    return 'This assessment has identified specific areas where focused development will help you build the skills needed for this role. Explore our recommended programs to start your learning journey.';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PageLoader text="Loading your results..." />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Assessment results not found.</p>
          <Button asChild className="mt-4">
            <Link href="/assessments">Back to Assessments</Link>
          </Button>
        </div>
      </div>
    );
  }

  const readiness = assessment.readiness_pct || 0;
  const requiredProficiency = 80; // Default, should come from job
  const demonstratedSkills = skillGaps.filter((s) => s.userScore >= 80).length;
  const totalSkills = skillGaps.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href="/my-assessments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Assessments
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {assessment.job?.title || 'Assessment Results'}
          </h1>
          <p className="text-gray-600">
            SOC Code: {assessment.job?.soc_code || 'N/A'} • Completed{' '}
            {assessment.analyzed_at
              ? new Date(assessment.analyzed_at).toLocaleDateString()
              : 'Recently'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Role Readiness Widget */}
        <RoleReadinessWidget
          percentage={readiness}
          status={
            readiness >= 80
              ? 'role_ready'
              : readiness >= 60
              ? 'close_gaps'
              : 'needs_development'
          }
          jobTitle={assessment.job?.title || 'this role'}
          requiredProficiency={requiredProficiency}
          demonstratedSkills={demonstratedSkills}
          totalSkills={totalSkills}
          summary={getSummaryText(readiness)}
        />

        {/* Program Matches CTA */}
        <ProgramMatchesCTA
          requiredProficiency={requiredProficiency}
          userProficiency={readiness}
          assessmentId={assessmentId}
        />

        {/* Skills Gap Analysis */}
        {skillGaps.length > 0 && <SkillsGapChart skills={skillGaps} />}

        {/* Strengths and Growth Areas */}
        {(strengths.length > 0 || growthAreas.length > 0) && (
          <StrengthsAndGrowth strengths={strengths} growthAreas={growthAreas} />
        )}

        {/* Bottom CTA */}
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Ready to boost your knowledge and close your gaps?
          </h3>
          <p className="text-gray-600 mb-6">
            Explore programs tailored to your skill development needs
          </p>
          <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700">
            <Link href={`/program-matches/${assessmentId}`}>
              <BookOpen className="mr-2 h-5 w-5" />
              View Your Program Matches
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

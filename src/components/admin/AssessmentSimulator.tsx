'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Beaker, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface AssessmentSimulatorProps {
  jobId: string;
  quizId: string;
  userId: string;
}

export function AssessmentSimulator({ jobId, quizId, userId }: AssessmentSimulatorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const scenarios = [
    {
      id: 'benchmark',
      name: 'Benchmark Performance',
      description: 'All skills at 90-100%',
      color: 'bg-green-500',
      readiness: 95,
      skillScores: [95, 92, 98, 90, 94]
    },
    {
      id: 'proficient',
      name: 'Proficient Performance',
      description: 'Most skills at 80-89%',
      color: 'bg-teal-500',
      readiness: 85,
      skillScores: [88, 85, 82, 87, 83]
    },
    {
      id: 'building',
      name: 'Building Proficiency',
      description: 'Skills at 60-79%',
      color: 'bg-orange-500',
      readiness: 70,
      skillScores: [75, 68, 72, 65, 70]
    },
    {
      id: 'needs_development',
      name: 'Needs Development',
      description: 'Skills below 60%',
      color: 'bg-red-500',
      readiness: 45,
      skillScores: [55, 42, 48, 38, 50]
    },
    {
      id: 'mixed',
      name: 'Mixed Performance',
      description: 'Varied skill levels',
      color: 'bg-purple-500',
      readiness: 72,
      skillScores: [90, 75, 55, 85, 60]
    }
  ];
  const simulateAssessment = async (scenario: typeof scenarios[0]) => {
    setLoading(true);
    setSelectedScenario(scenario.id);

    try {
      // Get job skills
      const { data: jobSkills } = await supabase
        .from('job_skills')
        .select('skill_id, skills(name)')
        .eq('job_id', jobId)
        .limit(5);

      if (!jobSkills || jobSkills.length === 0) {
        alert('No skills found for this job. Cannot simulate assessment.');
        setLoading(false);
        return;
      }

      // Create assessment record WITHOUT results (let AI calculate)
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          user_id: userId,
          job_id: jobId,
          quiz_id: quizId,
          method: 'quiz',
          // Don't set readiness_pct or status_tag - let AI calculate
          // Don't set analyzed_at - will be set when AI completes
        })
        .select()
        .single();

      if (assessmentError || !assessment) {
        console.error('Error creating assessment:', assessmentError);
        alert('Failed to create simulated assessment');
        setLoading(false);
        return;
      }

      // Get quiz questions for this quiz
      const { data: sections } = await supabase
        .from('quiz_sections')
        .select('id, skill_id')
        .eq('quiz_id', quizId);

      if (!sections || sections.length === 0) {
        alert('No quiz sections found. Please generate a quiz first.');
        setLoading(false);
        return;
      }

      // Get questions for these sections
      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('id, section_id, answer_key')
        .in('section_id', sections.map(s => s.id));

      if (!questions || questions.length === 0) {
        alert('No quiz questions found. Please generate a quiz first.');
        setLoading(false);
        return;
      }

      console.log('Creating realistic quiz responses for', questions.length, 'questions');

      // Create realistic quiz responses based on scenario
      // Group questions by section to apply skill-specific scores
      const sectionMap = new Map(sections.map(s => [s.id, s.skill_id]));
      const skillScoreMap = new Map(
        jobSkills.slice(0, 5).map((skill, index) => [
          skill.skill_id,
          scenario.skillScores[index] || 70
        ])
      );

      const quizResponses = questions.map(question => {
        const sectionId = question.section_id;
        const skillId = sectionMap.get(sectionId);
        const targetScore = skillScoreMap.get(skillId) || 70;
        
        // Randomly determine if this question is answered correctly based on target score
        const isCorrect = Math.random() * 100 < targetScore;
        
        return {
          assessment_id: assessment.id,
          question_id: question.id,
          selected: isCorrect ? question.answer_key : 'wrong_answer',
          is_correct: isCorrect
        };
      });

      console.log('Inserting', quizResponses.length, 'quiz responses');

      const { error: responsesError } = await supabase
        .from('quiz_responses')
        .insert(quizResponses);

      if (responsesError) {
        console.error('Error creating quiz responses:', responsesError);
        alert(`Failed to create quiz responses: ${responsesError.message}`);
        setLoading(false);
        return;
      }

      console.log('Successfully created quiz responses, redirecting to analyzing page');

      // Redirect to analyzing page - it will trigger AI analysis and poll for completion
      router.push(`/assessments/${assessment.id}/analyzing`);
    } catch (error) {
      console.error('Simulation error:', error);
      alert('Failed to simulate assessment');
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Beaker className="h-5 w-5" />
          Assessment Simulator (Super Admin Only)
        </CardTitle>
        <p className="text-sm text-purple-700">
          Quickly test different assessment scenarios without taking the full quiz
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-purple-400 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <Badge className={`${scenario.color} text-white`}>
                  {scenario.readiness}%
                </Badge>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{scenario.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => simulateAssessment(scenario)}
                disabled={loading && selectedScenario === scenario.id}
              >
                {loading && selectedScenario === scenario.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Simulate
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

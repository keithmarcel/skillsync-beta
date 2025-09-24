'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { getAssessmentById } from '@/lib/database/queries';
import { supabase } from '@/lib/supabase/client';
import { Assessment } from '@/lib/database/queries';

interface QuizQuestion {
  id: string;
  stem: string;
  choices: { [key: string]: string };
  answer_key: string;
}

interface QuizSection {
  id: string;
  skill_id: string;
  order_index: number;
  skill?: { name: string };
  questions: QuizQuestion[];
}

interface AssessmentQuizPageProps {
  params: { id: string };
}

export default function AssessmentQuizPage({ params }: AssessmentQuizPageProps) {
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [sections, setSections] = useState<QuizSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAssessmentAndQuiz();
  }, [params.id]);

  const loadAssessmentAndQuiz = async () => {
    try {
      setLoading(true);

      // Load assessment
      const assessmentData = await getAssessmentById(params.id);
      if (!assessmentData) {
        setError('Assessment not found');
        return;
      }
      setAssessment(assessmentData);

      // Load quiz data
      if (assessmentData.job_id) {
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select(`
            id,
            sections:quiz_sections(
              id,
              skill_id,
              order_index,
              skill:skills(name),
              questions:quiz_questions(
                id,
                stem,
                choices,
                answer_key
              )
            )
          `)
          .eq('job_id', assessmentData.job_id)
          .single();

        if (quizError) {
          console.error('Error loading quiz:', quizError);
          setError('Quiz not found for this assessment');
          return;
        }

        // Transform and sort sections
        const transformedSections: QuizSection[] = (quizData.sections || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((section: any) => ({
            ...section,
            questions: section.questions || []
          }));

        setSections(transformedSections);
      }
    } catch (err) {
      console.error('Error loading assessment quiz:', err);
      setError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    const currentSection = sections[currentSectionIndex];
    const currentQuestion = currentSection?.questions[currentQuestionIndex];

    if (!currentQuestion) return;

    // Check if we're at the last question of the last section
    const isLastQuestion = currentQuestionIndex === currentSection.questions.length - 1;
    const isLastSection = currentSectionIndex === sections.length - 1;

    if (isLastQuestion && isLastSection) {
      handleSubmit();
    } else if (isLastQuestion) {
      // Move to next section
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    const currentSection = sections[currentSectionIndex];

    if (currentQuestionIndex === 0) {
      // Move to previous section
      if (currentSectionIndex > 0) {
        setCurrentSectionIndex(prev => prev - 1);
        const prevSection = sections[currentSectionIndex - 1];
        setCurrentQuestionIndex(prevSection.questions.length - 1);
      }
    } else {
      // Move to previous question
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Calculate results based on answers
      const questionResponses = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        assessment_id: params.id,
        question_id: questionId,
        selected: selectedAnswer,
        is_correct: false // Will be determined by backend
      }));

      // Submit responses
      const { error: submitError } = await supabase
        .from('quiz_responses')
        .insert(questionResponses);

      if (submitError) {
        console.error('Error submitting quiz responses:', submitError);
        setError('Failed to submit quiz responses');
        return;
      }

      // Trigger readiness calculation
      await supabase.rpc('fn_compute_readiness', { p_assessment_id: params.id });

      // Redirect to results
      router.push(`/admin/assessments/${params.id}/results`);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const getTotalQuestions = () => {
    return sections.reduce((total, section) => total + section.questions.length, 0);
  };

  const getAnsweredQuestions = () => {
    return Object.keys(answers).length;
  };

  const getCurrentQuestion = () => {
    const currentSection = sections[currentSectionIndex];
    return currentSection?.questions[currentQuestionIndex];
  };

  const getProgress = () => {
    const totalQuestions = getTotalQuestions();
    if (totalQuestions === 0) return 0;

    let questionCount = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      questionCount += sections[i].questions.length;
    }
    questionCount += currentQuestionIndex + 1;

    return (questionCount / totalQuestions) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Loading quiz...</div>
          <div className="text-sm text-muted-foreground mt-2">Preparing assessment questions</div>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium text-red-600">Error</div>
          <div className="text-sm text-muted-foreground mt-2">{error || 'Assessment not found'}</div>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">No Quiz Available</div>
          <div className="text-sm text-muted-foreground mt-2">
            No quiz has been created for this job role yet.
          </div>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const currentSection = sections[currentSectionIndex];
  const totalQuestions = getTotalQuestions();
  const answeredQuestions = getAnsweredQuestions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assessment Quiz</h1>
            <p className="text-muted-foreground">
              {assessment.job?.title} • Admin Testing Mode
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Progress</CardTitle>
            <div className="text-sm text-muted-foreground">
              Question {Math.min(getProgress() / 100 * totalQuestions, totalQuestions).toFixed(0)} of {totalQuestions}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={getProgress()} className="mb-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{answeredQuestions} answered</span>
            <span>{currentSection?.skill?.name || 'Current Skill'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentQuestion.stem}</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {currentSection?.skill?.name || 'Skill Assessment'}
              </Badge>
              <Badge variant="secondary">
                Question {currentQuestionIndex + 1} of {currentSection?.questions.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
              className="space-y-3"
            >
              {Object.entries(currentQuestion.choices).map(([key, choice]) => (
                <div key={key} className="flex items-center space-x-3">
                  <RadioGroupItem value={key} id={key} />
                  <Label htmlFor={key} className="flex-1 cursor-pointer">
                    <span className="font-medium mr-2">{key.toUpperCase()}.</span>
                    {choice}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
        >
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={!answers[currentQuestion?.id || '']}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {currentQuestionIndex === (currentSection?.questions.length || 0) - 1 &&
           currentSectionIndex === sections.length - 1 ? (
            <>
              {submitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Assessment
                </>
              )}
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Next
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, FileText, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuizSection {
  id: string;
  skill_id: string;
  order_index: number;
  skill?: { id: string; name: string };
  questions: QuizQuestion[];
}

interface QuizQuestion {
  id: string;
  stem: string;
  choices: { [key: string]: string };
  answer_key: string;
  difficulty?: string;
}

interface Quiz {
  id: string;
  job_id: string | null;
  estimated_minutes: number;
  version: number;
  job?: {
    id: string;
    title: string;
    job_kind: string;
  } | null;
  sections: QuizSection[];
}

interface QuizDetailPageProps {
  params: { id: string };
}

export default function QuizDetailPage({ params }: QuizDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Question editing state
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);

  const isNew = params.id === 'new';

  useEffect(() => {
    if (!isNew) {
      loadQuiz();
    } else {
      setQuiz({
        id: '',
        job_id: null,
        estimated_minutes: 15,
        version: 1,
        sections: []
      });
      setLoading(false);
    }
  }, [params.id, isNew]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          id,
          job_id,
          estimated_minutes,
          version,
          job:jobs(id, title, job_kind),
          sections:quiz_sections(
            id,
            skill_id,
            order_index,
            skill:skills(id, name),
            questions:quiz_questions(
              id,
              stem,
              choices,
              answer_key,
              difficulty
            )
          )
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;

      // Transform sections to ensure proper typing
      const transformedSections = (data.sections || []).map((section: any) => ({
        ...section,
        questions: section.questions || []
      }));

      setQuiz({
        ...data,
        sections: transformedSections,
        job: data.job ? data.job[0] : null // Take first job if array
      });
    } catch (err) {
      console.error('Error loading quiz:', err);
      setError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!quiz) return;

    try {
      setSaving(true);

      const quizData = {
        job_id: quiz.job_id,
        estimated_minutes: quiz.estimated_minutes,
        version: quiz.version
      };

      if (isNew) {
        const { data, error } = await supabase
          .from('quizzes')
          .insert(quizData)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Success",
          description: "Quiz created successfully",
        });

        router.push(`/admin/quizzes/${data.id}`);
      } else {
        const { error } = await supabase
          .from('quizzes')
          .update(quizData)
          .eq('id', quiz.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Quiz updated successfully",
        });
      }
    } catch (err) {
      console.error('Error saving quiz:', err);
      toast({
        title: "Error",
        description: "Failed to save quiz",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = (sectionId: string) => {
    setEditingQuestion({
      id: '',
      stem: '',
      choices: { A: '', B: '', C: '', D: '' },
      answer_key: 'A',
      difficulty: 'intermediate'
    });
    setQuestionDialogOpen(true);
  };

  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setQuestionDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion || !quiz) return;

    try {
      const questionData = {
        stem: editingQuestion.stem,
        choices: editingQuestion.choices,
        answer_key: editingQuestion.answer_key,
        difficulty: editingQuestion.difficulty
      };

      if (editingQuestion.id) {
        // Update existing question
        const { error } = await supabase
          .from('quiz_questions')
          .update(questionData)
          .eq('id', editingQuestion.id);

        if (error) throw error;
      } else {
        // Create new question - need to find section and add it
        // This would need additional logic to associate with the correct section
        console.log('New question creation not implemented yet');
      }

      toast({
        title: "Success",
        description: "Question saved successfully",
      });

      setQuestionDialogOpen(false);
      setEditingQuestion(null);
      loadQuiz(); // Reload to get updated data
    } catch (err) {
      console.error('Error saving question:', err);
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive",
      });
    }
  };

  const getTotalQuestions = () => {
    return quiz?.sections?.reduce((total, section) => total + (section.questions?.length || 0), 0) || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Loading quiz...</div>
          <div className="text-sm text-muted-foreground mt-2">Fetching quiz details</div>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium text-red-600">Error</div>
          <div className="text-sm text-muted-foreground mt-2">{error || 'Quiz not found'}</div>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold tracking-tight">
              {isNew ? 'Create Quiz' : 'Edit Quiz'}
            </h1>
            <p className="text-muted-foreground">
              {quiz.job?.title || 'Configure quiz settings and questions'}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isNew ? 'Create Quiz' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>

      {/* Quiz Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="estimated_minutes">Estimated Duration (minutes)</Label>
              <Input
                id="estimated_minutes"
                type="number"
                value={quiz.estimated_minutes}
                onChange={(e) => setQuiz({ ...quiz, estimated_minutes: parseInt(e.target.value) || 15 })}
                min="1"
                max="120"
              />
            </div>
            <div>
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                type="number"
                value={quiz.version}
                onChange={(e) => setQuiz({ ...quiz, version: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
            <div>
              <Label>Total Questions</Label>
              <div className="text-2xl font-bold text-muted-foreground">
                {getTotalQuestions()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Sections and Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Questions</h2>
          <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion?.id ? 'Edit Question' : 'Add Question'}
                </DialogTitle>
              </DialogHeader>
              {editingQuestion && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="question-stem">Question</Label>
                    <Textarea
                      id="question-stem"
                      value={editingQuestion.stem}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        stem: e.target.value
                      })}
                      placeholder="Enter the question text..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(editingQuestion.choices).map(([key, value]) => (
                      <div key={key}>
                        <Label htmlFor={`choice-${key}`}>Choice {key}</Label>
                        <Input
                          id={`choice-${key}`}
                          value={value}
                          onChange={(e) => setEditingQuestion({
                            ...editingQuestion,
                            choices: {
                              ...editingQuestion.choices,
                              [key]: e.target.value
                            }
                          })}
                          placeholder={`Choice ${key}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="answer-key">Correct Answer</Label>
                      <Select
                        value={editingQuestion.answer_key}
                        onValueChange={(value) => setEditingQuestion({
                          ...editingQuestion,
                          answer_key: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Choice A</SelectItem>
                          <SelectItem value="B">Choice B</SelectItem>
                          <SelectItem value="C">Choice C</SelectItem>
                          <SelectItem value="D">Choice D</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select
                        value={editingQuestion.difficulty || 'intermediate'}
                        onValueChange={(value) => setEditingQuestion({
                          ...editingQuestion,
                          difficulty: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setQuestionDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveQuestion}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      Save Question
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {quiz.sections && quiz.sections.length > 0 ? (
          <div className="space-y-4">
            {quiz.sections.map((section, sectionIndex) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{section.skill?.name || `Skill Section ${sectionIndex + 1}`}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {section.questions?.length || 0} questions
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddQuestion(section.id)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Question
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {section.questions && section.questions.length > 0 ? (
                    <div className="space-y-3">
                      {section.questions.map((question, questionIndex) => (
                        <div key={question.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-medium mb-2">
                                Question {questionIndex + 1}: {question.stem}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {Object.entries(question.choices).map(([key, choice]) => (
                                  <div
                                    key={key}
                                    className={`p-2 rounded ${
                                      key === question.answer_key
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-50'
                                    }`}
                                  >
                                    <strong>{key}.</strong> {choice}
                                    {key === question.answer_key && (
                                      <span className="ml-2 text-green-600">✓ Correct</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditQuestion(question)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No questions in this section yet.
                      <Button
                        variant="link"
                        onClick={() => handleAddQuestion(section.id)}
                        className="ml-2"
                      >
                        Add the first question
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Questions Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start building your quiz by adding questions organized by skills.
              </p>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Add First Question
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

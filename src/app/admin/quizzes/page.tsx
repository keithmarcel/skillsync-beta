'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, FileText, Users, Clock, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';

interface Quiz {
  id: string;
  job_id: string | null;
  estimated_minutes: number;
  version: number;
  job?: {
    id: string;
    title: string;
    job_kind: string;
  };
  sections?: Array<{
    id: string;
    questions: Array<{
      id: string;
    }>;
  }>;
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
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
            questions:quiz_questions(id)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match Quiz interface
      const transformedData = (data || []).map((quiz: any) => ({
        ...quiz,
        job: quiz.job ? quiz.job[0] : null // Take first job if array
      }));

      setQuizzes(transformedData);
    } catch (err) {
      console.error('Error loading quizzes:', err);
      setError('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const getTotalQuestions = (quiz: Quiz) => {
    return quiz.sections?.reduce((total, section) => total + (section.questions?.length || 0), 0) || 0;
  };

  const getJobTypeLabel = (jobKind: string) => {
    return jobKind === 'featured_role' ? 'Featured Role' : 'Occupation';
  };

  const filteredQuizzes = quizzes.filter(quiz =>
    !searchTerm ||
    quiz.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Loading quizzes...</div>
          <div className="text-sm text-muted-foreground mt-2">Fetching quiz data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz Management</h1>
          <p className="text-muted-foreground">
            Create and manage skill assessment quizzes
          </p>
        </div>
        <Button asChild className="bg-teal-600 hover:bg-teal-700">
          <Link href="/admin/quizzes/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Quiz
          </Link>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Quizzes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by job title or quiz ID..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quizzes Grid */}
      {filteredQuizzes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {quiz.job?.title || 'Untitled Quiz'}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mb-2">
                      {quiz.job?.job_kind && (
                        <Badge variant="outline">
                          {getJobTypeLabel(quiz.job.job_kind)}
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        v{quiz.version}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/quizzes/${quiz.id}`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>{getTotalQuestions(quiz)} questions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{quiz.estimated_minutes} min</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {quiz.sections?.length || 0} skill sections
                  </span>
                </div>

                <div className="pt-2 border-t">
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/admin/quizzes/${quiz.id}`}>
                      Manage Quiz
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No quizzes found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm
                ? 'No quizzes match your search criteria.'
                : 'Get started by creating your first quiz.'}
            </p>
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link href="/admin/quizzes/new">
                <Plus className="w-4 h-4 mr-2" />
                Create First Quiz
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizzes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quizzes.reduce((total, quiz) => total + getTotalQuestions(quiz), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Questions/Quiz</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quizzes.length > 0
                ? Math.round(quizzes.reduce((total, quiz) => total + getTotalQuestions(quiz), 0) / quizzes.length)
                : 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quizzes.length > 0
                ? Math.round(quizzes.reduce((total, quiz) => total + quiz.estimated_minutes, 0) / quizzes.length)
                : 0} min
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

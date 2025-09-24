'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, FileText, Target, TrendingUp, Award, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getAssessmentById } from '@/lib/database/queries';
import { Assessment } from '@/lib/database/queries';

interface AssessmentResultsPageProps {
  params: { id: string };
}

export default function AssessmentResultsPage({ params }: AssessmentResultsPageProps) {
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssessment();
  }, [params.id]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const data = await getAssessmentById(params.id);
      if (!data) {
        setError('Assessment not found');
        return;
      }
      setAssessment(data);
    } catch (err) {
      console.error('Error loading assessment:', err);
      setError('Failed to load assessment results');
    } finally {
      setLoading(false);
    }
  };

  const getProficiencyColor = (band: string) => {
    switch (band) {
      case 'proficient': return 'bg-green-500';
      case 'building': return 'bg-yellow-500';
      case 'needs_dev': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getProficiencyLabel = (band: string) => {
    switch (band) {
      case 'proficient': return 'Proficient';
      case 'building': return 'Building';
      case 'needs_dev': return 'Needs Development';
      default: return band;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'role_ready': return 'bg-green-100 text-green-800';
      case 'close_gaps': return 'bg-yellow-100 text-yellow-800';
      case 'needs_development': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'role_ready': return <CheckCircle className="w-4 h-4" />;
      case 'close_gaps': return <TrendingUp className="w-4 h-4" />;
      case 'needs_development': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Loading assessment results...</div>
          <div className="text-sm text-muted-foreground mt-2">Please wait</div>
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

  const skillResults = assessment.skill_results || [];
  const proficientCount = skillResults.filter(r => r.band === 'proficient').length;
  const buildingCount = skillResults.filter(r => r.band === 'developing').length;
  const needsDevCount = skillResults.filter(r => r.band === 'expert').length;

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
            <h1 className="text-3xl font-bold tracking-tight">Assessment Results</h1>
            <p className="text-muted-foreground">
              {assessment.job?.title} • {assessment.method === 'quiz' ? 'Quiz Assessment' : 'Resume Analysis'}
            </p>
          </div>
        </div>
        <Button asChild className="bg-teal-600 hover:bg-teal-700">
          <Link href="/my-assessments">
            View All Assessments
          </Link>
        </Button>
      </div>

      {/* Assessment Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Readiness Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessment.readiness_pct || 0}%</div>
            <div className="flex items-center space-x-2 mt-2">
              {getStatusIcon(assessment.status_tag)}
              <Badge className={getStatusColor(assessment.status_tag)}>
                {assessment.status_tag?.replace('_', ' ').toUpperCase() || 'PENDING'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Assessed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skillResults.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {assessment.method === 'quiz' ? 'Quiz questions' : 'Resume analysis'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proficient Skills</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{proficientCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {skillResults.length > 0 ? Math.round((proficientCount / skillResults.length) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessment Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {assessment.analyzed_at ? new Date(assessment.analyzed_at).toLocaleDateString() : 'Not analyzed'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {assessment.analyzed_at ? new Date(assessment.analyzed_at).toLocaleTimeString() : 'Pending analysis'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Proficiency Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Skills Proficiency Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {skillResults.length > 0 ? (
            <div className="space-y-3">
              {skillResults.map((result) => (
                <div key={result.skill_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{result.skill?.name || 'Unknown Skill'}</div>
                    <div className="text-sm text-muted-foreground">{result.skill?.category || 'Uncategorized'}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-medium">{result.score_pct}%</div>
                      <Badge variant="outline" className={`text-white ${getProficiencyColor(result.band)}`}>
                        {getProficiencyLabel(result.band)}
                      </Badge>
                    </div>
                    <div className="w-24">
                      <Progress value={result.score_pct} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No skill results available for this assessment.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proficiency Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Proficient</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{proficientCount}</div>
            <p className="text-sm text-muted-foreground">Skills at proficient level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Developing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{buildingCount}</div>
            <p className="text-sm text-muted-foreground">Skills currently developing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Expert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{needsDevCount}</div>
            <p className="text-sm text-muted-foreground">Skills at expert level</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Summary Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>AI Readiness Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground italic">
            AI-generated readiness summary will be displayed here once the assessment analysis is complete.
            This will provide personalized insights and recommendations based on your skill assessment results.
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={() => router.back()}>
          Back to Assessments
        </Button>
        <Button asChild className="bg-teal-600 hover:bg-teal-700">
          <Link href="/programs">
            Explore Programs
          </Link>
        </Button>
      </div>
    </div>
  );
}

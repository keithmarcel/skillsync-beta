'use client';

import { useState, useEffect } from 'react';
import { Bot, Play, Pause, CheckCircle, AlertCircle, Clock, FileText, Target, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AdminTable } from '@/components/admin/AdminTable';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

interface PipelineJob {
  id: string;
  job_id: string;
  job_title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  generated_questions: number;
  job?: {
    title: string;
    soc_code: string;
  };
}

interface AIPipelineConfig {
  model_version: string;
  temperature: number;
  max_questions: number;
  question_types: string[];
  skill_weighting: 'equal' | 'importance' | 'difficulty';
}

export default function AdminAIPipelinePage() {
  const { toast } = useToast();
  const [pipelineJobs, setPipelineJobs] = useState<PipelineJob[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Array<{ id: string; title: string; soc_code: string }>>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [config, setConfig] = useState<AIPipelineConfig>({
    model_version: 'gpt-4',
    temperature: 0.7,
    max_questions: 15,
    question_types: ['multiple_choice', 'true_false'],
    skill_weighting: 'importance',
  });
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadPipelineJobs();
    loadAvailableJobs();
  }, []);

  const loadPipelineJobs = async () => {
    try {
      // Mock data for now - in real implementation, this would come from a pipeline_jobs table
      setPipelineJobs([
        {
          id: '1',
          job_id: 'job-123',
          job_title: 'Software Engineer',
          status: 'completed',
          progress: 100,
          started_at: '2024-01-15T10:00:00Z',
          completed_at: '2024-01-15T10:15:00Z',
          generated_questions: 12,
        },
        {
          id: '2',
          job_id: 'job-456',
          job_title: 'Data Analyst',
          status: 'processing',
          progress: 65,
          started_at: '2024-01-15T11:00:00Z',
          generated_questions: 8,
        },
      ]);
    } catch (err) {
      console.error('Error loading pipeline jobs:', err);
    }
  };

  const loadAvailableJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, soc_code')
        .eq('status', 'published')
        .limit(50);

      if (error) throw error;
      setAvailableJobs(data || []);
    } catch (err) {
      console.error('Error loading available jobs:', err);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedJobId) {
      toast({
        title: "Error",
        description: "Please select a job to generate quiz for",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);

      // Mock API call - in real implementation, this would call an AI service
      const response = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: selectedJobId,
          config,
          customPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      toast({
        title: "Success",
        description: "AI quiz generation started successfully",
      });

      // Refresh the jobs list
      await loadPipelineJobs();

    } catch (err) {
      console.error('Error generating quiz:', err);
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing': return <Play className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pipelineColumns = [
    {
      key: 'job_title',
      header: 'Job Title',
      render: (value: string, row: PipelineJob) => (
        <div>
          <div className="font-medium">{row.job_title}</div>
          <div className="text-sm text-muted-foreground">ID: {row.job_id}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string, row: PipelineJob) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(row.status)}
          <Badge className={getStatusColor(row.status)}>
            {row.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      ),
      width: 120,
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (value: number, row: PipelineJob) => (
        <div className="w-24">
          <Progress value={row.progress} className="h-2" />
          <div className="text-xs text-muted-foreground mt-1">
            {row.progress}%
          </div>
        </div>
      ),
      width: 100,
    },
    {
      key: 'questions',
      header: 'Questions',
      render: (value: any, row: PipelineJob) => (
        <div className="flex items-center space-x-1">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span>{row.generated_questions}</span>
        </div>
      ),
      width: 80,
    },
    {
      key: 'started_at',
      header: 'Started',
      render: (value: string, row: PipelineJob) => (
        <div className="text-sm">
          {new Date(row.started_at).toLocaleDateString()}
        </div>
      ),
      width: 100,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Pipeline Management</h1>
          <p className="text-muted-foreground">
            Generate skill assessments and quizzes using AI
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center space-x-1">
          <Bot className="w-4 h-4" />
          <span>AI Powered</span>
        </Badge>
      </div>

      {/* Pipeline Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pipelineJobs.filter(job => job.status === 'processing').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {pipelineJobs.filter(job => job.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pipelineJobs.reduce((sum, job) => sum + job.generated_questions, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Generated this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              {pipelineJobs.length > 0
                ? Math.round((pipelineJobs.filter(job => job.status === 'completed').length / pipelineJobs.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Generation success
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Generate New Quiz */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Quiz</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use AI to automatically generate skill assessment questions for a job role
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="job-select">Select Job Role</Label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job to generate quiz for..." />
                </SelectTrigger>
                <SelectContent>
                  {availableJobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} {job.soc_code && `(${job.soc_code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="model-select">AI Model</Label>
              <Select
                value={config.model_version}
                onValueChange={(value) => setConfig({ ...config, model_version: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4 (Recommended)</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3">Claude 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="max-questions">Max Questions</Label>
              <Select
                value={config.max_questions.toString()}
                onValueChange={(value) => setConfig({ ...config, max_questions: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Questions</SelectItem>
                  <SelectItem value="15">15 Questions</SelectItem>
                  <SelectItem value="20">20 Questions</SelectItem>
                  <SelectItem value="25">25 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="temperature">Creativity Level</Label>
              <Select
                value={config.temperature.toString()}
                onValueChange={(value) => setConfig({ ...config, temperature: parseFloat(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.3">Conservative (0.3)</SelectItem>
                  <SelectItem value="0.7">Balanced (0.7)</SelectItem>
                  <SelectItem value="1.0">Creative (1.0)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="weighting">Skill Weighting</Label>
              <Select
                value={config.skill_weighting}
                onValueChange={(value: any) => setConfig({ ...config, skill_weighting: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">Equal Distribution</SelectItem>
                  <SelectItem value="importance">By Importance</SelectItem>
                  <SelectItem value="difficulty">By Difficulty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
            <Label htmlFor="custom-prompt">Custom Instructions (Optional)</Label>
            <Textarea
              id="custom-prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Add any specific instructions for the AI to follow when generating questions..."
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleGenerateQuiz}
              disabled={!selectedJobId || generating}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {generating ? (
                <>
                  <Bot className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" />
                  Generate Quiz
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Jobs History */}
      <Card>
        <CardHeader>
          <CardTitle>Generation History</CardTitle>
          <p className="text-sm text-muted-foreground">
            View the status and results of AI-generated content
          </p>
        </CardHeader>
        <CardContent>
          <AdminTable
            data={pipelineJobs}
            columns={pipelineColumns}
            loading={loading}
            emptyMessage="No AI pipeline jobs found"
          />
        </CardContent>
      </Card>
    </div>
  );
}

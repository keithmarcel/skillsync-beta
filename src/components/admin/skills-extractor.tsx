'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface SkillsExtractorProps {
  socCode: string;
  jobId: string;
  jobTitle: string;
  onSkillsExtracted?: () => void;
}

export function SkillsExtractor({ socCode, jobId, jobTitle, onSkillsExtracted }: SkillsExtractorProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    skillsAdded?: number;
    method?: string;
    error?: string;
  } | null>(null);

  const handleExtract = async () => {
    setIsExtracting(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/populate-lightcast-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socCode,
          forceRefresh: true // Always refresh to replace existing skills
        })
      });

      const data = await response.json();

      if (data.success && data.results && data.results.length > 0) {
        const jobResult = data.results.find((r: any) => r.jobId === jobId) || data.results[0];
        setResult({
          success: jobResult.success,
          skillsAdded: jobResult.skillsAdded,
          method: jobResult.method,
          error: jobResult.error
        });

        if (jobResult.success && onSkillsExtracted) {
          onSkillsExtracted();
        }
      } else {
        setResult({
          success: false,
          error: data.error || 'Failed to extract skills'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">AI Skills Extraction</CardTitle>
        <CardDescription>
          Extract and curate skills for this role using AI analysis of the job description and O*NET/Lightcast data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <Button
            onClick={handleExtract}
            disabled={isExtracting || !socCode}
            className="gap-2"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Extracting Skills...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Extract Skills with AI
              </>
            )}
          </Button>
          
          {!socCode && (
            <p className="text-sm text-amber-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              SOC Code required to extract skills
            </p>
          )}
        </div>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? 'Skills Extracted Successfully!' : 'Extraction Failed'}
                </p>
                {result.success && result.skillsAdded && (
                  <p className="text-sm text-green-700 mt-1">
                    {result.skillsAdded} skills extracted using {result.method} method
                  </p>
                )}
                {result.error && (
                  <p className="text-sm text-red-700 mt-1">{result.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>How it works:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>AI analyzes your job title and description</li>
            <li>Matches against O*NET and Lightcast skill taxonomy</li>
            <li>Extracts 15-30 relevant skills with confidence scores</li>
            <li>Replaces current skills (you can re-run anytime)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

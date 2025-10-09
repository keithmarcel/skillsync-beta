'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface AIContentTabProps {
  occupationTitle: string;
  socCode: string;
  coreResponsibilities: string[] | null;
  relatedJobTitles: string[] | null;
  tasks?: any[];
  skills?: any[];
  onChange: (field: string, value: string[] | null) => void;
}

export function AIContentTab({
  occupationTitle,
  socCode,
  coreResponsibilities,
  relatedJobTitles,
  tasks,
  skills,
  onChange
}: AIContentTabProps) {
  const [generatingResponsibilities, setGeneratingResponsibilities] = useState(false);
  const [generatingTitles, setGeneratingTitles] = useState(false);

  const generateResponsibilities = async () => {
    setGeneratingResponsibilities(true);
    try {
      const response = await fetch('/api/generate-responsibilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occupationTitle,
          socCode,
          tasks,
          skills
        })
      });

      if (response.ok) {
        const { responsibilities } = await response.json();
        onChange('core_responsibilities', responsibilities);
      } else {
        console.error('Failed to generate responsibilities');
      }
    } catch (error) {
      console.error('Error generating responsibilities:', error);
    } finally {
      setGeneratingResponsibilities(false);
    }
  };

  const generateRelatedTitles = async () => {
    setGeneratingTitles(true);
    try {
      const response = await fetch('/api/generate-related-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occupationTitle,
          socCode
        })
      });

      if (response.ok) {
        const { titles } = await response.json();
        onChange('related_job_titles', titles);
      } else {
        console.error('Failed to generate related titles');
      }
    } catch (error) {
      console.error('Error generating related titles:', error);
    } finally {
      setGeneratingTitles(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Core Responsibilities */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="core_responsibilities">Core Responsibilities</Label>
          <Button
            type="button"
            onClick={generateResponsibilities}
            disabled={generatingResponsibilities || !occupationTitle || !socCode}
            size="sm"
            variant="outline"
          >
            {generatingResponsibilities ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate with AI'
            )}
          </Button>
        </div>
        <Textarea
          id="core_responsibilities"
          value={coreResponsibilities?.join('\n') || ''}
          onChange={(e) => {
            const lines = e.target.value.split('\n').filter(line => line.trim());
            onChange('core_responsibilities', lines.length > 0 ? lines : null);
          }}
          placeholder="Enter core responsibilities, one per line..."
          rows={8}
          className="font-mono text-sm"
        />
        <p className="text-sm text-gray-500 mt-1">
          One responsibility per line. Click "Generate with AI" to auto-generate based on occupation data.
        </p>
      </div>

      {/* Related Job Titles */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="related_job_titles">Related Job Titles</Label>
          <Button
            type="button"
            onClick={generateRelatedTitles}
            disabled={generatingTitles || !occupationTitle || !socCode}
            size="sm"
            variant="outline"
          >
            {generatingTitles ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate with AI'
            )}
          </Button>
        </div>
        <Textarea
          id="related_job_titles"
          value={relatedJobTitles?.join('\n') || ''}
          onChange={(e) => {
            const lines = e.target.value.split('\n').filter(line => line.trim());
            onChange('related_job_titles', lines.length > 0 ? lines : null);
          }}
          placeholder="Enter related job titles, one per line..."
          rows={8}
          className="font-mono text-sm"
        />
        <p className="text-sm text-gray-500 mt-1">
          One job title per line. Click "Generate with AI" to auto-generate variations and related titles.
        </p>
      </div>
    </div>
  );
}

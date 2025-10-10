'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { AIGenerateButton } from '@/components/admin/ai-generate-button';

interface SOCSkillsExtractorProps {
  socCode: string;
  onSkillsUpdated?: () => void;
}

interface ExtractedSkill {
  skill: string;
  description?: string;
  confidence?: number;
  curation_status?: string;
}

export function SOCSkillsExtractor({ socCode, onSkillsUpdated }: SOCSkillsExtractorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<ExtractedSkill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!socCode) {
      setError('SOC Code is required');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    setExtractedSkills([]);
    setSelectedSkills(new Set());

    try {
      const response = await fetch('/api/admin/skills-extractor/soc-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract skills');
      }

      if (data.extractedSkills && data.extractedSkills.length > 0) {
        setExtractedSkills(data.extractedSkills);
        // Auto-select high confidence skills
        const highConfidence = new Set<string>(
          data.extractedSkills
            .filter((s: ExtractedSkill) => (s.confidence || 0) >= 85)
            .map((s: ExtractedSkill) => s.skill)
        );
        setSelectedSkills(highConfidence);
      } else {
        setError('No skills extracted. Try a different SOC code.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract skills');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (selectedSkills.size === 0) {
      setError('Please select at least one skill to save');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const skillsToSave = extractedSkills
        .filter(s => selectedSkills.has(s.skill))
        .map(s => ({
          skill_name: s.skill,
          description: s.description,
          confidence: s.confidence,
          curation_status: 'approved'
        }));

      const response = await fetch('/api/admin/skills-extractor/bulk-curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socCode,
          skills: skillsToSave
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save skills');
      }

      setSuccess(`Successfully saved ${selectedSkills.size} skills!`);
      setExtractedSkills([]);
      setSelectedSkills(new Set());
      
      if (onSkillsUpdated) {
        onSkillsUpdated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save skills');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSkill = (skillName: string) => {
    const newSelected = new Set(selectedSkills);
    if (newSelected.has(skillName)) {
      newSelected.delete(skillName);
    } else {
      newSelected.add(skillName);
    }
    setSelectedSkills(newSelected);
  };

  const selectHighConfidence = () => {
    const highConfidence = new Set<string>(
      extractedSkills
        .filter(s => (s.confidence || 0) >= 85)
        .map(s => s.skill)
    );
    setSelectedSkills(highConfidence);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Skills Extraction</CardTitle>
        <CardDescription>
          Extract and curate skills for SOC code: <strong>{socCode || 'Not set'}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Extract Button */}
        <div>
          {isProcessing && extractedSkills.length === 0 ? (
            <Button disabled className="gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting Skills...
            </Button>
          ) : (
            <AIGenerateButton
              onClick={handleExtract}
              buttonText="Extract Skills with AI"
              disabled={!socCode}
              tooltipContent={{
                title: 'What happens when you click:',
                points: [
                  'AI analyzes your SOC code and job description',
                  'Extracts 15-30 relevant skills from O*NET/Lightcast',
                  'Auto-selects high confidence skills (≥85%)',
                  'You can review and curate before saving',
                  'No changes until you click Save'
                ]
              }}
            />
          )}
          {!socCode && (
            <p className="text-sm text-amber-600 mt-2">
              Please add a SOC Code in Basic Information first
            </p>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">{success}</AlertDescription>
          </Alert>
        )}

        {/* Extracted Skills */}
        {extractedSkills.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                Extracted {extractedSkills.length} skills - Select to save:
              </h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectHighConfidence}
                >
                  Select High Confidence
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isProcessing || selectedSkills.size === 0}
                  size="sm"
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Save {selectedSkills.size} Skills</>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {extractedSkills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedSkills.has(skill.skill)}
                    onCheckedChange={() => toggleSkill(skill.skill)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{skill.skill}</span>
                      {skill.confidence && (
                        <Badge
                          variant={skill.confidence >= 85 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {skill.confidence}% confidence
                        </Badge>
                      )}
                    </div>
                    {skill.description && (
                      <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ManualSkillsSelectorProps {
  socCode: string;
  onSkillsUpdated?: () => void;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export function ManualSkillsSelector({ socCode, onSkillsUpdated }: ManualSkillsSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/admin/skills/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        
        if (response.ok) {
          // Filter out already selected skills
          const filtered = (data.skills || []).filter(
            (skill: Skill) => !selectedSkills.find(s => s.id === skill.id)
          );
          setSearchResults(filtered);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedSkills]);

  const handleSelectSkill = (skill: Skill) => {
    setSelectedSkills(prev => [...prev, skill]);
    setSearchResults(prev => prev.filter(s => s.id !== skill.id));
    setSearchQuery('');
  };

  const handleRemoveSkill = (skillId: string) => {
    setSelectedSkills(prev => prev.filter(s => s.id !== skillId));
  };

  const handleSave = async () => {
    if (selectedSkills.length === 0) {
      setError('Please select at least one skill');
      return;
    }

    if (!socCode) {
      setError('SOC Code is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Delete existing skills
      const deleteResponse = await fetch(`/api/admin/soc-skills/${socCode}`, {
        method: 'DELETE'
      });

      if (!deleteResponse.ok) {
        console.warn('Failed to delete existing skills');
      }

      // Save selected skills
      const skillsToSave = selectedSkills.map((skill, index) => ({
        skill_id: skill.id,
        skill_name: skill.name,
        description: skill.description,
        display_order: index + 1,
        weight: 0.8 // Default weight for manually selected skills
      }));

      const response = await fetch('/api/admin/soc-skills/save-manual', {
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

      setSuccess(`Successfully saved ${selectedSkills.length} skills! The skills above will update shortly.`);
      setSelectedSkills([]);
      
      if (onSkillsUpdated) {
        setTimeout(() => {
          onSkillsUpdated();
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save skills');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Skills Selection</CardTitle>
        <CardDescription>
          Search and select skills from our complete taxonomy for SOC code: <strong>{socCode || 'Not set'}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search skills (e.g., 'Python', 'Communication', 'Project Management')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={!socCode}
            className="pl-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="border rounded-lg max-h-48 overflow-y-auto">
            {searchResults.map((skill) => (
              <button
                key={skill.id}
                onClick={() => handleSelectSkill(skill)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
              >
                <div className="font-medium">{skill.name}</div>
                {skill.category && (
                  <div className="text-xs text-gray-500">{skill.category}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Selected Skills Pills */}
        {selectedSkills.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">
              Selected Skills ({selectedSkills.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100 border border-teal-600 rounded-full text-sm"
                >
                  <span className="font-medium text-teal-600">{skill.name}</span>
                  <button
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="hover:bg-teal-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3 text-teal-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        {selectedSkills.length > 0 && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save & Overwrite Current Skills</>
            )}
          </Button>
        )}

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

        {!socCode && (
          <p className="text-sm text-amber-600">
            Please add a SOC Code in Basic Information first
          </p>
        )}
      </CardContent>
    </Card>
  );
}

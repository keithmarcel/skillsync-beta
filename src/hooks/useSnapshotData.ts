'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getUserAssessments } from '@/lib/api';
import type { Assessment, AssessmentSkillResult } from '@/lib/database/queries';

interface SnapshotMetrics {
  rolesReadyFor: number;
  overallRoleReadiness: number;
  skillsIdentified: number;
  gapsHighlighted: number;
}

interface SkillData {
  proficient: number;
  building: number;
  needsDevelopment: number;
}

interface UseSnapshotDataReturn {
  metrics: SnapshotMetrics | null;
  skillData: SkillData | null;
  loading: boolean;
  hasAssessments: boolean;
}

export function useSnapshotData(): UseSnapshotDataReturn {
  const { user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<SnapshotMetrics | null>(null);
  const [skillData, setSkillData] = useState<SkillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAssessments, setHasAssessments] = useState(false);

  useEffect(() => {
    async function loadSnapshotData(userId: string) {
      setLoading(true);
      try {
        const assessments = await getUserAssessments();
        setHasAssessments(assessments.length > 0);

        if (assessments.length > 0) {
          // This is a simplified calculation. A real implementation would be more complex.
          const rolesReadyFor = assessments.filter(a => a.status_tag === 'role_ready').length;
          const overallRoleReadiness = assessments.reduce((acc, a) => acc + (a.readiness_pct || 0), 0) / assessments.length;
          
          const allSkills = new Set<string>();
          let proficient = 0, developing = 0, needsDevelopment = 0;

          assessments.forEach(a => {
            a.skill_results?.forEach((sr: AssessmentSkillResult) => {
              allSkills.add(sr.skill_id);
              if (sr.band === 'proficient') proficient++;
              else if (sr.band === 'developing') developing++;
              else needsDevelopment++; // This assumes any other value is 'needs_development'
            });
          });

          setMetrics({
            rolesReadyFor,
            overallRoleReadiness: Math.round(overallRoleReadiness),
            skillsIdentified: allSkills.size,
            gapsHighlighted: developing + needsDevelopment,
          });

          setSkillData({
            proficient,
            building: developing, // Map 'developing' to the 'building' property for the chart
            needsDevelopment,
          });
        }
      } catch (error) {
        console.error('Failed to load snapshot data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      if (user) {
        loadSnapshotData(user.id);
      } else {
        setLoading(false);
        setHasAssessments(false);
        setMetrics(null);
        setSkillData(null);
      }
    }
  }, [user, authLoading]);

  return { metrics, skillData, loading, hasAssessments };
}

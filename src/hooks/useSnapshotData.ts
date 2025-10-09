'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getUserAssessments } from '@/lib/api';
import { getUnreadInvitationCount } from '@/lib/services/employer-invitations';
import type { Assessment, AssessmentSkillResult } from '@/lib/database/queries';

interface SnapshotMetrics {
  rolesReadyFor: number;
  overallRoleReadiness: number;
  skillsIdentified: number;
  gapsHighlighted: number;
  pendingInvitations: number;
  assessmentsCompleted: number;
}

interface SkillData {
  proficient: number;
  building: number;
  needsDevelopment: number;
  proficientSkills?: string[];
  buildingSkills?: string[];
  developingSkills?: string[];
}

interface AssessmentProgress {
  date: string;
  score: number;
  role: string;
}

interface UseSnapshotDataReturn {
  metrics: SnapshotMetrics | null;
  skillData: SkillData | null;
  assessmentProgress: AssessmentProgress[];
  loading: boolean;
  hasAssessments: boolean;
}

export function useSnapshotData(): UseSnapshotDataReturn {
  const { user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<SnapshotMetrics | null>(null);
  const [skillData, setSkillData] = useState<SkillData | null>(null);
  const [assessmentProgress, setAssessmentProgress] = useState<AssessmentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAssessments, setHasAssessments] = useState(false);

  useEffect(() => {
    async function loadSnapshotData(userId: string) {
      setLoading(true);
      try {
        const [assessments, invitationCount] = await Promise.all([
          getUserAssessments(),
          getUnreadInvitationCount().catch(() => 0) // Graceful fallback
        ]);
        
        console.log('📊 Assessments loaded:', assessments.length);
        assessments.forEach((a, idx) => {
          console.log(`📊 Assessment ${idx + 1}:`, {
            id: a.id.substring(0, 8),
            method: a.method,
            skill_results_count: a.skill_results?.length || 0,
            has_skill_results: !!a.skill_results,
            skill_results_sample: a.skill_results?.slice(0, 2)
          });
        });
        
        setHasAssessments(assessments.length > 0);

        if (assessments.length > 0) {
          // Calculate metrics
          const rolesReadyFor = assessments.filter(a => a.status_tag === 'role_ready').length;
          const overallRoleReadiness = assessments.reduce((acc, a) => acc + (a.readiness_pct || 0), 0) / assessments.length;
          
          const allSkills = new Set<string>();
          let proficient = 0, developing = 0, needsDevelopment = 0;
          const proficientSkillNames: string[] = [];
          const buildingSkillNames: string[] = [];
          const developingSkillNames: string[] = [];

          assessments.forEach(a => {
            a.skill_results?.forEach((sr: AssessmentSkillResult) => {
              allSkills.add(sr.skill_id);
              const skillName = (sr as any).skill?.name || (sr as any).skills?.name || 'Unknown Skill';
              
              if (sr.band === 'proficient') {
                proficient++;
                if (!proficientSkillNames.includes(skillName)) {
                  proficientSkillNames.push(skillName);
                }
              } else if (sr.band === 'building') {
                developing++;
                if (!buildingSkillNames.includes(skillName)) {
                  buildingSkillNames.push(skillName);
                }
              } else if (sr.band === 'needs_dev') {
                needsDevelopment++;
                if (!developingSkillNames.includes(skillName)) {
                  developingSkillNames.push(skillName);
                }
              }
            });
          });

          setMetrics({
            rolesReadyFor,
            overallRoleReadiness: Math.round(overallRoleReadiness),
            skillsIdentified: allSkills.size,
            gapsHighlighted: developing + needsDevelopment,
            pendingInvitations: invitationCount,
            assessmentsCompleted: assessments.length,
          });

          console.log('📊 Skill counts:', { proficient, building: developing, needsDevelopment });
          console.log('📊 Total skills:', proficient + developing + needsDevelopment);
          console.log('📊 Skill names:', { proficientSkillNames, buildingSkillNames, developingSkillNames });
          
          setSkillData({
            proficient,
            building: developing,
            needsDevelopment,
            proficientSkills: proficientSkillNames,
            buildingSkills: buildingSkillNames,
            developingSkills: developingSkillNames,
          });

          // Build progress timeline (last 5 assessments)
          const progress = assessments
            .sort((a, b) => new Date(b.analyzed_at || 0).getTime() - new Date(a.analyzed_at || 0).getTime())
            .slice(0, 5)
            .map(a => ({
              date: new Date(a.analyzed_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              score: a.readiness_pct || 0,
              role: a.job?.title || 'Unknown Role'
            }))
            .reverse(); // Show oldest to newest for timeline

          setAssessmentProgress(progress);
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
        setAssessmentProgress([]);
      }
    }
  }, [user, authLoading]);

  return { metrics, skillData, assessmentProgress, loading, hasAssessments };
}

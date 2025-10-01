'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface SkillGap {
  skillName: string;
  userScore: number; // 0-100
  requiredScore: number; // 0-100
  status: 'benchmark' | 'proficient' | 'building' | 'needs_development';
}

interface SkillsGapChartProps {
  skills: SkillGap[];
}

export function SkillsGapChart({ skills }: SkillsGapChartProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'benchmark':
        return 'bg-green-500';
      case 'proficient':
        return 'bg-teal-500';
      case 'building':
        return 'bg-orange-500';
      case 'needs_development':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'benchmark':
        return 'Benchmark';
      case 'proficient':
        return 'Proficient';
      case 'building':
        return 'Building Proficiency';
      case 'needs_development':
        return 'Needs Development';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Title and Legend */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills Gap Analysis</h2>
        <p className="text-gray-600 mb-4">
          Here's how <span className="font-semibold">your skills</span> compare to what
          employers expect for this role.
        </p>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-700">Benchmark (90-100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-teal-500"></div>
            <span className="text-gray-700">Proficient (80-89%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-700">Building Proficiency (60-79%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-700">Needs Development (&lt;60%)</span>
          </div>
        </div>
      </div>

      {/* Skills bars */}
      <div className="space-y-6">
        {skills.map((skill, index) => (
          <div key={index} className="space-y-2">
            {/* Skill name and percentage */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{skill.skillName}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {skill.userScore}%
                </span>
                <Badge
                  variant="outline"
                  className={`${getStatusColor(skill.status)} text-white border-0`}
                >
                  {skill.userScore}%
                </Badge>
              </div>
            </div>

            {/* Bar visualization */}
            <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
              {/* Filled portion */}
              <div
                className={`absolute left-0 top-0 h-full ${getStatusColor(
                  skill.status
                )} transition-all duration-700 ease-out`}
                style={{ width: `${skill.userScore}%` }}
              />

              {/* 100% marker line */}
              <div className="absolute right-0 top-0 h-full w-px bg-gray-400"></div>

              {/* Percentage label inside bar (if space) */}
              {skill.userScore > 15 && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-sm font-medium">
                  {skill.userScore}%
                </div>
              )}

              {/* 100% label */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 text-xs">
                100%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

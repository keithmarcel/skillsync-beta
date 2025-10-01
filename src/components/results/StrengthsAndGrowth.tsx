'use client';

import React from 'react';

interface SkillDetail {
  name: string;
  percentage: number;
  description: string;
}

interface StrengthsAndGrowthProps {
  strengths: SkillDetail[];
  growthAreas: SkillDetail[];
}

export function StrengthsAndGrowth({ strengths, growthAreas }: StrengthsAndGrowthProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
      {/* Your Strengths */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Your Strengths</h3>
        <div className="space-y-4">
          {strengths.map((skill, index) => (
            <div key={index} className="border-l-4 border-green-500 pl-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                <span className="text-sm font-medium text-green-600">
                  {skill.percentage}%
                </span>
              </div>
              <p className="text-sm text-gray-600">{skill.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Areas for Growth */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Areas for Growth</h3>
        <div className="space-y-4">
          {growthAreas.map((skill, index) => (
            <div key={index} className="border-l-4 border-orange-500 pl-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                <span className="text-sm font-medium text-orange-600">
                  {skill.percentage}%
                </span>
              </div>
              <p className="text-sm text-gray-600">{skill.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

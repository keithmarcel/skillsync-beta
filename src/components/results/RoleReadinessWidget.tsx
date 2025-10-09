'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface RoleReadinessWidgetProps {
  percentage: number;
  status: 'role_ready' | 'close_gaps' | 'needs_development';
  jobTitle: string;
  requiredProficiency?: number;
  demonstratedSkills: number;
  totalSkills: number;
  summary: string;
}

export function RoleReadinessWidget({
  percentage,
  status,
  jobTitle,
  requiredProficiency = 80,
  demonstratedSkills,
  totalSkills,
  summary
}: RoleReadinessWidgetProps) {
  // Calculate match label based on percentage
  const getMatchLabel = () => {
    if (percentage >= 90) return "You are role ready!";
    if (percentage >= 70) return "You are almost there!";
    if (percentage >= 50) return "You are developing proficiency.";
    return "Focus on skill development.";
  };

  // Get status badge
  const getStatusBadge = () => {
    switch (status) {
      case 'role_ready':
        return <Badge className="bg-green-500 text-white">Role Ready</Badge>;
      case 'close_gaps':
        return <Badge className="bg-teal-500 text-white">Close to Ready</Badge>;
      case 'needs_development':
        return <Badge className="bg-orange-500 text-white">Developing Skills</Badge>;
    }
  };

  return (
    <div className="bg-[#0F4C5C] rounded-lg shadow-lg overflow-hidden">
      {/* Main content - two column layout */}
      <div className="flex flex-col md:flex-row">
        {/* Left side with glowing bar visualization */}
        <div className="bg-[#0A3A47] py-12 px-6 md:px-12 flex-shrink-0 w-full md:w-[420px] flex items-center justify-center">
          <div className="flex flex-col items-center">
            {/* 10 Horizontal bars filling bottom-to-top */}
            <div className="mb-6 w-[200px]">
              {Array.from({ length: 10 }).map((_, i) => {
                // Fill from bottom (index 9) to top (index 0)
                const isFilled = i >= 10 - Math.ceil(percentage / 10);

                return (
                  <div
                    key={i}
                    className={`h-3 w-full mb-2 rounded-full transition-all duration-500 ${
                      isFilled
                        ? 'bg-[#00E1FF] shadow-glow animate-pulse-glow'
                        : 'bg-[rgba(50,70,80,0.5)]'
                    }`}
                    style={{
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                );
              })}
            </div>

            {/* Percentage display */}
            <div className="flex flex-col items-center">
              <span className="text-6xl md:text-7xl font-bold text-white leading-none">
                {percentage}%
              </span>
              <span className="text-base text-white/70 mt-2">Role Readiness</span>
            </div>
          </div>
        </div>

        {/* Right side with content */}
        <div className="p-6 md:p-12 flex-grow flex items-center">
          <div className="w-full">
            {/* Heading with status badge */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h2 className="text-3xl font-bold text-white">{getMatchLabel()}</h2>
              {getStatusBadge()}
            </div>

            {/* Match percentage text */}
            <p className="text-white/90 text-lg leading-7 mb-4">
              Based on your assessment, you have a{' '}
              <span className="font-semibold text-white">{percentage}% match</span> with
              the skills required for{' '}
              <span className="font-semibold text-white">{jobTitle}</span> role.
            </p>

            {/* Skills demonstrated */}
            <p className="text-white/80 text-base mb-6">
              You've demonstrated{' '}
              <span className="font-bold text-white">
                {demonstratedSkills} of {totalSkills}
              </span>{' '}
              core skills.
            </p>

            {/* Summary paragraph */}
            <p className="text-white/80 text-base leading-[26px]">{summary}</p>
          </div>
        </div>
      </div>

      {/* Custom CSS for glow animation */}
      <style jsx>{`
        @keyframes pulse-glow {
          0%,
          100% {
            transform: scaleY(1);
            box-shadow: 0 0 0 0 rgba(0, 225, 255, 0);
          }
          50% {
            transform: scaleY(1.15);
            box-shadow: 0 0 13.3653px 3.34134px rgba(0, 225, 255, 0.5);
          }
        }

        .shadow-glow {
          box-shadow: 0 0 8px 2px rgba(0, 225, 255, 0.3);
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

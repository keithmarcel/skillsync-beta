'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ProgramMatchesCTAProps {
  requiredProficiency: number;
  userProficiency: number;
  assessmentId: string;
}

export function ProgramMatchesCTA({
  requiredProficiency,
  userProficiency,
  assessmentId
}: ProgramMatchesCTAProps) {
  const isRoleReady = userProficiency >= requiredProficiency;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 my-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-gray-900 text-base">
            {isRoleReady ? (
              <>
                <span className="font-semibold">Congratulations!</span> You meet the{' '}
                {requiredProficiency}% proficiency requirement for this role.
              </>
            ) : (
              <>
                This role requires a{' '}
                <span className="font-semibold">{requiredProficiency}% proficiency</span>{' '}
                to unlock the application.
              </>
            )}
          </p>
        </div>
        <Button asChild className="bg-teal-600 hover:bg-teal-700 flex-shrink-0">
          <Link href={`/program-matches/${assessmentId}`}>
            View Your Program Matches
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

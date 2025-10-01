'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SkillsDataPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the working skills page
    router.push('/admin/skills');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Skills Management...</p>
      </div>
    </div>
  );
}

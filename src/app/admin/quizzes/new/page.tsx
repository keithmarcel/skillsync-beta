'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewQuizPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the detail page with 'new' parameter
    router.replace('/admin/quizzes/new');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="text-lg font-medium">Creating new quiz...</div>
        <div className="text-sm text-muted-foreground mt-2">Redirecting...</div>
      </div>
    </div>
  );
}

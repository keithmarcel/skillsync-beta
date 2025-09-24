'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OccupationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  useEffect(() => {
    // Redirect occupations to jobs route since they're unified in the jobs table
    router.replace(`/jobs/${params.id}`)
  }, [params.id, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to job details...</p>
      </div>
    </div>
  )
}

'use client'

interface EmployerDashboardProps {
  company: {
    id: string
    name: string
    logo_url: string | null
    city: string | null
    state: string | null
  }
}

export function EmployerDashboard({ company }: EmployerDashboardProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Engagement Dashboard</h2>
      
      {/* Placeholder for dashboard widgets */}
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Dashboard Widgets
          </h3>
          <p className="text-gray-600">
            Place useful widgets for provider admins here
          </p>
          <div className="mt-6 text-sm text-gray-500">
            <p>Suggested metrics:</p>
            <ul className="mt-2 space-y-1">
              <li>• Total role views</li>
              <li>• Candidate invitations sent</li>
              <li>• Application conversion rate</li>
              <li>• Top performing roles</li>
              <li>• Candidate pipeline status</li>
              <li>• Skills gap analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

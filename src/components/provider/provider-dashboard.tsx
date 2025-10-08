'use client'

interface ProviderDashboardProps {
  school: {
    id: string
    name: string
    logo_url: string | null
    city: string | null
    state: string | null
  }
}

export function ProviderDashboard({ school }: ProviderDashboardProps) {
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
            Place useful widgets for employer admins here
          </p>
          <div className="mt-6 text-sm text-gray-500">
            <p>Suggested metrics:</p>
            <ul className="mt-2 space-y-1">
              <li>• Total program views</li>
              <li>• Student inquiries</li>
              <li>• Featured programs performance</li>
              <li>• Skills alignment with job market</li>
              <li>• Program completion rates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

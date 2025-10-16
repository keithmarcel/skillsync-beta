'use client'

interface EmployerSettingsProps {
  company: {
    id: string
    name: string
    logo_url: string | null
    hq_city: string | null
    hq_state: string | null
  }
}

export function EmployerSettings({ company }: EmployerSettingsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      
      {/* Placeholder for settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Settings
          </h3>
          <p className="text-gray-600 mb-4">
            Place useful settings for employer admins here
          </p>
          <ul className="text-sm text-gray-500 space-y-1 text-left max-w-md mx-auto">
            <li>• Credentials</li>
            <li>• Profile (Bio, Featured image, Logo, Company details, etc)</li>
            <li>• Cancel</li>
            <li>• Save Changes</li>
            <li>• Dialogs</li>
            <li>• Toasts</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

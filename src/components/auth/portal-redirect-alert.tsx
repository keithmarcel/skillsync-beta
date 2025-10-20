import { AlertCircle } from 'lucide-react'

interface PortalRedirectAlertProps {
  portalName: 'Employer' | 'Provider'
}

export function PortalRedirectAlert({ portalName }: PortalRedirectAlertProps) {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-[#101929] border border-[#101929] rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 whitespace-nowrap">
        <AlertCircle className="h-5 w-5 text-white flex-shrink-0" />
        <p className="text-white text-sm">
          <strong className="font-semibold">{portalName} Portal Required:</strong>{' '}
          Please sign in here to access your {portalName.toLowerCase()} dashboard.
        </p>
      </div>
    </div>
  )
}

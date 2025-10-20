import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface PortalRedirectAlertProps {
  portalName: 'Employer' | 'Provider'
}

export function PortalRedirectAlert({ portalName }: PortalRedirectAlertProps) {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full mx-4">
      <Alert className="bg-[#101929] border-[#101929] shadow-lg [&>svg]:text-white">
        <AlertCircle className="h-5 w-5" />
        <AlertDescription className="text-white">
          <strong className="font-semibold">{portalName} Portal Required:</strong>{' '}
          Please sign in here to access your {portalName.toLowerCase()} dashboard.
        </AlertDescription>
      </Alert>
    </div>
  )
}

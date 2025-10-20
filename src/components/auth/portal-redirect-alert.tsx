import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface PortalRedirectAlertProps {
  portalName: 'Employer' | 'Provider'
}

export function PortalRedirectAlert({ portalName }: PortalRedirectAlertProps) {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full mx-4">
      <Alert className="bg-[#101929] border-[#101929] shadow-lg">
        <AlertCircle className="h-4 w-4 text-white" />
        <AlertDescription className="text-white flex items-center">
          <strong className="font-semibold">{portalName} Portal Required:</strong>
          <span className="ml-1">Please sign in here to access your {portalName.toLowerCase()} dashboard.</span>
        </AlertDescription>
      </Alert>
    </div>
  )
}

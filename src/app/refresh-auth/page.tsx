'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function RefreshAuthPage() {
  const { user, profile, loading, isAdmin, isSuperAdmin, signOut } = useAuth()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    // Sign out and back in to refresh session
    await signOut()
    router.push('/auth/signin')
  }

  const handleClearCache = () => {
    // Clear localStorage
    localStorage.clear()
    // Clear sessionStorage
    sessionStorage.clear()
    // Reload page
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>🔍 Auth Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div>Loading auth state...</div>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold">User Info:</h3>
                <div className="bg-gray-100 p-4 rounded-lg space-y-1 text-sm font-mono">
                  <div>Email: {user?.email || 'Not logged in'}</div>
                  <div>User ID: {user?.id || 'None'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Profile Info:</h3>
                <div className="bg-gray-100 p-4 rounded-lg space-y-1 text-sm font-mono">
                  <div>Name: {profile?.first_name} {profile?.last_name}</div>
                  <div>Role: {profile?.role || 'None'}</div>
                  <div>Admin Role: {profile?.admin_role || 'None'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Computed Auth Flags:</h3>
                <div className="bg-gray-100 p-4 rounded-lg space-y-1 text-sm font-mono">
                  <div>isAdmin: {isAdmin ? '✅ true' : '❌ false'}</div>
                  <div>isSuperAdmin: {isSuperAdmin ? '✅ true' : '❌ false'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Expected for Keith Woods:</h3>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-1 text-sm">
                  <div>✓ role: super_admin</div>
                  <div>✓ admin_role: super_admin</div>
                  <div>✓ isAdmin: true</div>
                  <div>✓ isSuperAdmin: true</div>
                </div>
              </div>

              {profile?.admin_role !== 'super_admin' && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-red-800 font-semibold">⚠️ Issue Detected</p>
                  <p className="text-sm text-red-700 mt-2">
                    Your profile admin_role is not set correctly. Try signing out and back in.
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <Button onClick={handleRefresh} disabled={refreshing}>
                  {refreshing ? 'Refreshing...' : 'Sign Out & Refresh'}
                </Button>
                <Button onClick={handleClearCache} variant="outline">
                  Clear Cache & Reload
                </Button>
                <Button onClick={() => router.push('/')} variant="outline">
                  Go Home
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

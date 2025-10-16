'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Briefcase, 
  Users, 
  Send, 
  FileText, 
  UserCheck,
  Mail,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Filter,
  Info
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import { 
  getDashboardMetrics, 
  getRecentActivity,
  type DashboardMetrics,
  type RecentActivity
} from '@/lib/services/employer-dashboard'
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'

interface EmployerDashboardProps {
  company: {
    id: string
    name: string
    logo_url: string | null
    hq_city: string | null
    hq_state: string | null
  }
}

export function EmployerDashboard({ company }: EmployerDashboardProps) {
  const router = useRouter()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [company.id])

  async function loadDashboardData() {
    try {
      setLoading(true)
      const [metricsData, activityData] = await Promise.all([
        getDashboardMetrics(company.id),
        getRecentActivity(company.id, 5)
      ])
      setMetrics(metricsData)
      setRecentActivity(activityData)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size={60} text="Loading Dashboard" />
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-12 text-gray-500">
        Unable to load dashboard data
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string, text: string, label: string, icon?: any }> = {
      pending: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Pending' },
      sent: { bg: 'bg-gray-200', text: 'text-gray-700', label: 'Invite Sent' },
      applied: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Applied', icon: Check },
      hired: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Hired' },
      declined: { bg: 'bg-red-100', text: 'text-red-800', label: 'Declined', icon: X },
      unqualified: { bg: 'border border-gray-300 bg-white', text: 'text-gray-700', label: 'Unqualified' }
    }

    const statusConfig = config[status]
    if (!statusConfig) return null

    // All badges are non-clickable status indicators
    return (
      <Badge className={`${statusConfig.bg} ${statusConfig.text} border-0 rounded-md shadow-none inline-flex items-center justify-center gap-1.5 px-2 py-0.5 pointer-events-none min-w-[100px]`} style={{ fontSize: '10px', height: '24px' }}>
        {statusConfig.icon && <statusConfig.icon className="w-3 h-3" />}
        {statusConfig.label}
      </Badge>
    )
  }

  const getReadinessBadge = (proficiency: number, requiredProficiency: number = 90) => {
    const isReady = proficiency >= requiredProficiency
    if (isReady) {
      return (
        <Badge className="bg-green-100 text-green-800 border-0 rounded-full shadow-none flex items-center gap-1" style={{ fontSize: '10px' }}>
          <span>Ready</span>
          <span className="text-green-600">|</span>
          <span className="font-semibold">{proficiency}%</span>
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-0 rounded-full shadow-none flex items-center gap-1" style={{ fontSize: '10px' }}>
          <span>Almost There</span>
          <span className="text-orange-600">|</span>
          <span className="font-semibold">{proficiency}%</span>
        </Badge>
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards - 4 Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Active Roles</p>
              <Briefcase className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.activeRoles}</div>
            <p className="text-xs text-gray-500">Published roles</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Role Views</p>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.totalRoleViews.toLocaleString()}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">All-time views</p>
              {metrics.roleViews30d > 0 && (
                <Badge className="bg-green-50 text-green-700 border-0 hover:bg-green-50 rounded-full flex items-center gap-0.5 px-2 py-0.5 shadow-none">
                  <ArrowUp className="w-2.5 h-2.5" />
                  <span style={{ fontSize: '10px' }} className="font-medium">
                    {metrics.roleViews30d.toLocaleString()} last 30d
                  </span>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Total Candidates</p>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.totalCandidates}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">In your pipeline</p>
              {metrics.newCandidates30d > 0 && (
                <Badge className="bg-green-50 text-green-700 border-0 hover:bg-green-50 rounded-full flex items-center gap-0.5 px-2 py-0.5 shadow-none">
                  <ArrowUp className="w-2.5 h-2.5" />
                  <span style={{ fontSize: '10px' }} className="font-medium">
                    {metrics.newCandidates30d} last 30d
                  </span>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/employer?tab=invites')}>
          <CardContent className="flex flex-col p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Applications</p>
              <FileText className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.applicationsReceived}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {metrics.unreadResponses > 0 ? (
                  <span className="text-teal-600 font-semibold">{metrics.unreadResponses} unread</span>
                ) : (
                  'All reviewed'
                )}
              </p>
              {metrics.newApplications30d > 0 && (
                <Badge className="bg-green-50 text-green-700 border-0 hover:bg-green-50 rounded-full flex items-center gap-0.5 px-2 py-0.5 shadow-none">
                  <ArrowUp className="w-2.5 h-2.5" />
                  <span style={{ fontSize: '10px' }} className="font-medium">
                    {metrics.newApplications30d} last 30d
                  </span>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-gray-900 font-source-sans-pro mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button 
              onClick={() => router.push('/employer?tab=roles&action=new')}
              className="flex items-center justify-start h-auto py-4 px-4 bg-teal-600 hover:bg-teal-700 text-white"
              disabled={(metrics?.activeRoles || 0) + (metrics?.draftRoles || 0) >= 10}
            >
              <Plus className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Create New Role</div>
                <div className="text-xs opacity-90">Add a featured position</div>
              </div>
            </Button>

            <Button 
              onClick={() => router.push('/employer?tab=invites&filter=pending')}
              variant="outline"
              className="border-teal-600 text-teal-700 hover:bg-[#036672] hover:text-white justify-start h-auto py-4 transition-colors"
            >
              <Send className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Invite Candidates</div>
                <div className="text-xs opacity-90">{metrics.pendingToInvite} ready to invite</div>
              </div>
            </Button>

            <Button 
              onClick={() => router.push('/employer?tab=invites&filter=applied')}
              variant="outline"
              className="border-teal-600 text-teal-700 hover:bg-[#036672] hover:text-white justify-start h-auto py-4 transition-colors"
            >
              <FileText className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Review Applications</div>
                <div className="text-xs opacity-90">{metrics.applicationsReceived} to review</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 font-source-sans-pro">Recent Activity</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/employer?tab=invites')}
                className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push('/employer?tab=invites')}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {activity.candidateAvatar ? (
                        <img 
                          src={activity.candidateAvatar} 
                          alt={`${activity.candidateFirstName} ${activity.candidateLastName}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <span className="text-teal-700 font-semibold text-sm">
                            {activity.candidateFirstName[0]}{activity.candidateLastName[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {activity.candidateFirstName} {activity.candidateLastName}
                          </p>
                          <p className="text-xs text-gray-600 truncate">{activity.roleTitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        {getReadinessBadge(activity.proficiencyPct)}
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge - Vertically Centered */}
                    <div className="flex-shrink-0" onClick={(e) => {
                      // Prevent status badge from triggering row navigation
                      e.stopPropagation()
                    }}>
                      {getStatusBadge(activity.status || 'sent')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Overview */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 font-source-sans-pro">Pipeline Overview</h3>
              <Filter className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              {/* Pending */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-gray-700">Pending Invitations</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{metrics.pendingToInvite}</span>
              </div>

              {/* Sent */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-700">Invitations Sent</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{metrics.invitationsSent}</span>
              </div>

              {/* Applied */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                  <span className="text-sm text-gray-700">Applications Received</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{metrics.applicationsReceived}</span>
              </div>

              {/* Hired */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700">Candidates Hired</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{metrics.candidatesHired}</span>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-4"></div>

              {/* Total */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-900">Total Pipeline</span>
                <span className="text-lg font-bold text-gray-900">{metrics.totalCandidates}</span>
              </div>

              {/* Pipeline Funnel Visualization */}
              <div className="flex-1 flex flex-col bg-gray-50 rounded-lg p-4">
                <div className="flex-1 flex flex-col justify-center space-y-3">
                  {/* Stage 1: Pending → Sent */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">Invitation Rate</span>
                      <span className="text-xs font-semibold text-gray-900">
                        {metrics.pendingToInvite > 0 
                          ? Math.round((metrics.invitationsSent / (metrics.pendingToInvite + metrics.invitationsSent)) * 100)
                          : 100}%
                      </span>
                    </div>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-9 bg-gray-200 rounded-md overflow-hidden relative cursor-pointer hover:bg-gray-300 transition-colors">
                            <div 
                              className="h-full bg-teal-600 hover:bg-teal-700 transition-all absolute left-0 top-0"
                              style={{ 
                                width: metrics.pendingToInvite > 0 
                                  ? `${Math.round((metrics.invitationsSent / (metrics.pendingToInvite + metrics.invitationsSent)) * 100)}%`
                                  : '100%',
                                minWidth: metrics.invitationsSent > 0 ? '60px' : '0%'
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-start pl-2">
                              <span className="text-xs font-semibold bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                {metrics.invitationsSent} Sent
                              </span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Percentage of candidates you've sent invitations to</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {metrics.invitationsSent} sent out of {metrics.pendingToInvite + metrics.invitationsSent} total
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Stage 2: Sent → Applied */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">Response Rate</span>
                      <span className="text-xs font-semibold text-gray-900">
                        {(metrics.invitationsSent + metrics.applicationsReceived) > 0 
                          ? Math.round((metrics.applicationsReceived / (metrics.invitationsSent + metrics.applicationsReceived)) * 100)
                          : 0}%
                      </span>
                    </div>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-9 bg-gray-200 rounded-md overflow-hidden relative cursor-pointer hover:bg-gray-300 transition-colors">
                            <div 
                              className="h-full bg-teal-500 hover:bg-teal-600 transition-all absolute left-0 top-0"
                              style={{ 
                                width: (metrics.invitationsSent + metrics.applicationsReceived) > 0 
                                  ? `${Math.round((metrics.applicationsReceived / (metrics.invitationsSent + metrics.applicationsReceived)) * 100)}%`
                                  : '0%',
                                minWidth: metrics.applicationsReceived > 0 ? '60px' : '0%'
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-start pl-2">
                              <span className="text-xs font-semibold bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                {metrics.applicationsReceived} Applied
                              </span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Percentage of invited candidates who applied</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {metrics.applicationsReceived} applied out of {metrics.invitationsSent + metrics.applicationsReceived} invited
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Stage 3: Applied → Hired */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">Hire Rate</span>
                      <span className="text-xs font-semibold text-gray-900">
                        {metrics.applicationsReceived > 0 
                          ? Math.round((metrics.candidatesHired / metrics.applicationsReceived) * 100)
                          : 0}%
                      </span>
                    </div>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-9 bg-gray-200 rounded-md overflow-hidden relative cursor-pointer hover:bg-gray-300 transition-colors">
                            <div 
                              className="h-full bg-teal-400 hover:bg-teal-500 transition-all absolute left-0 top-0"
                              style={{ 
                                width: metrics.applicationsReceived > 0 
                                  ? `${Math.min(100, Math.round((metrics.candidatesHired / metrics.applicationsReceived) * 100))}%`
                                  : '0%',
                                minWidth: metrics.candidatesHired > 0 ? '60px' : '0%'
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-start pl-2">
                              <span className="text-xs font-semibold bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                {metrics.candidatesHired} Hired
                              </span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Percentage of applicants you've hired</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {metrics.candidatesHired} hired out of {metrics.applicationsReceived} applicants
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Overall Pipeline Health */}
                  <div className="pt-3 border-t border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">Overall Conversion</span>
                      <span className="text-sm font-bold text-teal-700">
                        {metrics.totalCandidates > 0 
                          ? Math.round((metrics.candidatesHired / metrics.totalCandidates) * 100)
                          : 0}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {metrics.candidatesHired} hired from {metrics.totalCandidates} total candidates
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Assessment analytics and KPI tracking utilities

export interface EngagementMetrics {
  mouseMovements: number
  keyPresses: number
  focusTime: number
  blurTime: number
  tabSwitches: number
}

export interface QuestionMetrics {
  questionId: string
  timeSpent: number
  confidenceLevel?: number
  difficultyRating?: number
  firstInteractionDelay: number
}

export class AssessmentTracker {
  private startTime: Date
  private questionStartTime: Date
  private mouseMovements: number = 0
  private keyPresses: number = 0
  private focusTime: number = 0
  private blurTime: number = 0
  private tabSwitches: number = 0
  private currentFocusStart: Date | null = null
  private pageVisibilityListener: (() => void) | null = null

  constructor() {
    this.startTime = new Date()
    this.questionStartTime = new Date()
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Mouse movement tracking
    const handleMouseMove = () => {
      this.mouseMovements++
    }

    // Keyboard tracking
    const handleKeyPress = () => {
      this.keyPresses++
    }

    // Focus/blur tracking
    const handleFocus = () => {
      if (this.currentFocusStart) {
        this.blurTime += (new Date().getTime() - this.currentFocusStart.getTime()) / 1000
      }
      this.currentFocusStart = new Date()
    }

    const handleBlur = () => {
      if (this.currentFocusStart) {
        this.focusTime += (new Date().getTime() - this.currentFocusStart.getTime()) / 1000
        this.currentFocusStart = null
      }
    }

    // Tab switching detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        this.tabSwitches++
        handleBlur()
      } else {
        handleFocus()
      }
    }

    // Add listeners
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('keypress', handleKeyPress)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Store cleanup function
    this.pageVisibilityListener = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('keypress', handleKeyPress)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }

    // Initial focus
    handleFocus()
  }

  // Start tracking a new question
  startQuestion() {
    this.questionStartTime = new Date()
  }

  // Get metrics for current question
  getQuestionMetrics(firstInteractionAt?: Date): QuestionMetrics {
    const now = new Date()
    const timeSpent = (now.getTime() - this.questionStartTime.getTime()) / 1000
    const firstInteractionDelay = firstInteractionAt
      ? (firstInteractionAt.getTime() - this.questionStartTime.getTime()) / 1000
      : 0

    return {
      questionId: 'current-question-id', // Will be set by component
      timeSpent,
      firstInteractionDelay,
      // confidenceLevel and difficultyRating will be collected from user input
    }
  }

  // Get overall engagement metrics
  getEngagementMetrics(): EngagementMetrics {
    // Calculate final focus/blur times
    if (this.currentFocusStart) {
      this.focusTime += (new Date().getTime() - this.currentFocusStart.getTime()) / 1000
    }

    return {
      mouseMovements: this.mouseMovements,
      keyPresses: this.keyPresses,
      focusTime: this.focusTime,
      blurTime: this.blurTime,
      tabSwitches: this.tabSwitches
    }
  }

  // Calculate engagement score (0-100)
  calculateEngagementScore(): number {
    const metrics = this.getEngagementMetrics()
    const totalTime = metrics.focusTime + metrics.blurTime

    if (totalTime === 0) return 0

    // Engagement factors:
    // - Focus time ratio (higher is better)
    // - Tab switches (fewer is better)
    // - Activity levels (mouse + keyboard)

    const focusRatio = metrics.focusTime / totalTime
    const activityScore = Math.min((metrics.mouseMovements + metrics.keyPresses) / 100, 1)
    const focusPenalty = Math.max(0, (metrics.tabSwitches - 2) * 10) // Penalize excessive tab switching

    const baseScore = (focusRatio * 60) + (activityScore * 30) + 10
    const finalScore = Math.max(0, Math.min(100, baseScore - focusPenalty))

    return Math.round(finalScore)
  }

  // Get total assessment time
  getTotalTime(): number {
    return (new Date().getTime() - this.startTime.getTime()) / 1000
  }

  // Cleanup event listeners
  cleanup() {
    if (this.pageVisibilityListener) {
      this.pageVisibilityListener()
    }
  }
}

// Utility functions for assessment analytics
export const AssessmentAnalytics = {
  // Detect device type
  getDeviceType(): string {
    const ua = navigator.userAgent
    if (/mobile/i.test(ua)) return 'mobile'
    if (/tablet/i.test(ua)) return 'tablet'
    return 'desktop'
  },

  // Get browser info
  getBrowserInfo(): string {
    const ua = navigator.userAgent
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return 'Unknown'
  },

  // Get screen resolution
  getScreenResolution(): string {
    return `${screen.width}x${screen.height}`
  },

  // Calculate completion rate
  calculateCompletionRate(answered: number, total: number): number {
    return total > 0 ? Math.round((answered / total) * 100) : 0
  },

  // Calculate average time per question
  calculateAverageTime(times: number[]): number {
    if (times.length === 0) return 0
    return times.reduce((sum, time) => sum + time, 0) / times.length
  },

  // Calculate focus score based on engagement metrics
  calculateFocusScore(engagement: EngagementMetrics): number {
    const totalTime = engagement.focusTime + engagement.blurTime
    if (totalTime === 0) return 0

    const focusRatio = engagement.focusTime / totalTime
    const tabPenalty = Math.min(engagement.tabSwitches * 5, 30) // Max 30 point penalty

    return Math.max(0, Math.min(100, Math.round(focusRatio * 100 - tabPenalty)))
  }
}

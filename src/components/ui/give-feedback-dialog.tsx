'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

interface GiveFeedbackDialogProps {
  children?: React.ReactNode
  triggerClassName?: string
}

type FeedbackSentiment = 'positive' | 'neutral' | 'negative' | null
type SubmissionState = 'idle' | 'submitting' | 'success' | 'error'

export function GiveFeedbackDialog({ children, triggerClassName }: GiveFeedbackDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedSentiment, setSelectedSentiment] = useState<FeedbackSentiment>(null)
  const [message, setMessage] = useState('')
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle')

  const { user } = useAuth()
  const pathname = usePathname()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSentiment) {
      return
    }

    setSubmissionState('submitting')
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentiment: selectedSentiment,
          message: message.trim() || null,
          user_id: user?.id,
          user_email: user?.email,
          route_path: pathname
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to submit feedback')
      }
      
      setSubmissionState('success')
      
      // Reset form after success
      setTimeout(() => {
        setMessage('')
        setSelectedSentiment(null)
        setSubmissionState('idle')
        setOpen(false)
      }, 2000)
      
    } catch (error) {
      console.error('Feedback submission error:', error)
      setSubmissionState('error')
      
      // Reset error state after 3 seconds
      setTimeout(() => {
        setSubmissionState('idle')
      }, 3000)
    }
  }

  const isSubmitting = submissionState === 'submitting'
  const isSuccess = submissionState === 'success'
  const isError = submissionState === 'error'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            variant="outline" 
            className={`flex h-10 px-3 justify-center items-center gap-2 text-gray-900 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 hover:text-gray-900 ${triggerClassName}`}
          >
            Give Feedback
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Give Feedback
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Report an issue or let us know how you like SkillSync!
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Thank you!</h3>
              <p className="text-gray-600">Your feedback has been submitted successfully.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Emoji Sentiment Selection */}
            <div className="flex justify-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setSelectedSentiment('negative')}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center p-2 sm:p-3 transition-all ${
                  selectedSentiment === 'negative' 
                    ? 'bg-teal-300' 
                    : 'bg-gray-100 hover:bg-gray-100 hover:ring-2 hover:ring-teal-300'
                }`}
                style={{ fontSize: '48px', lineHeight: '48px' }}
              >
                😟
              </button>
              <button
                type="button"
                onClick={() => setSelectedSentiment('positive')}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center p-2 sm:p-3 transition-all ${
                  selectedSentiment === 'positive' 
                    ? 'bg-teal-300' 
                    : 'bg-gray-100 hover:bg-gray-100 hover:ring-2 hover:ring-teal-300'
                }`}
                style={{ fontSize: '48px', lineHeight: '48px' }}
              >
                😍
              </button>
              <button
                type="button"
                onClick={() => setSelectedSentiment('neutral')}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center p-2 sm:p-3 transition-all ${
                  selectedSentiment === 'neutral' 
                    ? 'bg-teal-300' 
                    : 'bg-gray-100 hover:bg-gray-100 hover:ring-2 hover:ring-teal-300'
                }`}
                style={{ fontSize: '48px', lineHeight: '48px' }}
              >
                😐
              </button>
            </div>

            {/* Feedback Text Area */}
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-gray-700">
                Feedback (Optional)
              </label>
              <Textarea
                id="message"
                placeholder="Share your feedback."
                value={message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={isSubmitting}
              />
            </div>

            {isError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-700">
                  Failed to submit feedback. Please try again.
                </p>
              </div>
            )}

            <DialogFooter className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-white transition-colors"
                style={{ 
                  backgroundColor: '#0694A2',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#047481'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0694A2'}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

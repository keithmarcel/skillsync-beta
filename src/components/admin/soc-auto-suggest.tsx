'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Loader2, Sparkles, CheckCircle2, AlertCircle, InfoIcon } from 'lucide-react'

interface SocSuggestion {
  soc_code: string
  soc_title: string
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  validated?: boolean
  alternatives?: Array<{
    soc_code: string
    title: string
    reason: string
  }>
}

interface SocAutoSuggestProps {
  jobTitle: string
  jobDescription?: string
  onAccept: (socCode: string, socTitle: string) => void
  disabled?: boolean
}

export function SocAutoSuggest({ 
  jobTitle, 
  jobDescription, 
  onAccept,
  disabled = false 
}: SocAutoSuggestProps) {
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<SocSuggestion | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSuggest = async () => {
    if (!jobTitle.trim()) {
      setError('Please enter a job title first')
      return
    }

    setLoading(true)
    setError(null)
    setSuggestion(null)

    try {
      const response = await fetch('/api/admin/suggest-soc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jobTitle,
          description: jobDescription
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get suggestion')
      }

      const data = await response.json()
      setSuggestion(data)
    } catch (err) {
      setError('Failed to generate SOC suggestion. Please try again.')
      console.error('SOC suggestion error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceBadge = (confidence: string) => {
    const variants = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-orange-100 text-orange-800'
    }
    return variants[confidence as keyof typeof variants] || variants.medium
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={handleSuggest}
          disabled={loading || disabled || !jobTitle.trim()}
          variant="outline"
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              AI Suggest SOC Code
            </>
          )}
        </Button>
        
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs bg-gray-900 text-white border-gray-700">
              <p className="text-sm">
                <strong>What happens when you click AI Suggest:</strong><br/>
                • AI analyzes your job title and description<br/>
                • Suggests the best matching SOC code<br/>
                • Shows confidence level and reasoning<br/>
                • You can review and accept or modify<br/>
                • No changes until you click "Use This Code"
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {!jobTitle.trim() && (
          <span className="text-sm text-gray-500">
            Enter a job title to get AI suggestions
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {suggestion && (
        <Card className="border-teal-200 bg-teal-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600" />
              AI Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Primary Suggestion */}
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getConfidenceBadge(suggestion.confidence)}>
                      {suggestion.confidence} confidence
                    </Badge>
                    {suggestion.validated && (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Validated
                      </Badge>
                    )}
                  </div>
                  <div className="font-semibold text-lg">
                    {suggestion.soc_code}
                  </div>
                  <div className="text-gray-700">
                    {suggestion.soc_title}
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    onAccept(suggestion.soc_code, suggestion.soc_title)
                    setSuggestion(null) // Close the card
                  }}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Use This Code
                </Button>
              </div>
              
              <div className="text-sm text-gray-600 border-t pt-3">
                <strong>Why this match:</strong> {suggestion.reasoning}
              </div>
            </div>

            {/* Alternatives */}
            {suggestion.alternatives && suggestion.alternatives.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 list-none flex items-center gap-2">
                  <span className="group-open:rotate-90 transition-transform">▶</span>
                  View {suggestion.alternatives.length} alternative{suggestion.alternatives.length > 1 ? 's' : ''}
                </summary>
                <div className="mt-3 space-y-2">
                  {suggestion.alternatives.map((alt, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-3 border border-gray-200 hover:border-teal-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {alt.soc_code} - {alt.title}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {alt.reason}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onAccept(alt.soc_code, alt.title)
                            setSuggestion(null) // Close the card
                          }}
                        >
                          Use
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

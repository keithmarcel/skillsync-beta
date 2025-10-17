'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { CheckSquare, ToggleLeft, Type, FileText, ChevronLeft } from 'lucide-react'
import type { QuizQuestion, QuestionType, ImportanceLevel, DifficultyLevel } from '@/types/assessment'
import { QUESTION_TYPES, IMPORTANCE_LEVELS, DIFFICULTY_LEVELS } from '@/types/assessment'

interface QuestionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (question: Partial<QuizQuestion>) => Promise<void>
  editQuestion?: QuizQuestion | null
  skills: Array<{ id: string; name: string }>
}

export function QuestionModal({ open, onOpenChange, onSave, editQuestion, skills }: QuestionModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<'type' | 'details'>(editQuestion ? 'details' : 'type')
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [questionType, setQuestionType] = useState<QuestionType>('multiple_choice')
  const [stem, setStem] = useState('')
  const [choices, setChoices] = useState(['', '', '', ''])
  const [answerKey, setAnswerKey] = useState<string | boolean>('')
  const [goodAnswerExample, setGoodAnswerExample] = useState('')
  const [skillId, setSkillId] = useState('')
  const [importanceLevel, setImportanceLevel] = useState<ImportanceLevel>(3)
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium')

  // Load edit question data
  useEffect(() => {
    if (editQuestion) {
      setStep('details')
      setQuestionType(editQuestion.question_type)
      setStem(editQuestion.stem)

      // Robust choices parsing
      let parsedChoices: string[] = ['', '', '', '']
      try {
        if (editQuestion.choices) {
          if (typeof editQuestion.choices === 'string') {
            parsedChoices = JSON.parse(editQuestion.choices)
          } else if (Array.isArray(editQuestion.choices)) {
            parsedChoices = editQuestion.choices
          } else if (typeof editQuestion.choices === 'object' && editQuestion.choices !== null) {
            parsedChoices = Object.values(editQuestion.choices)
          }
        }
        // Ensure it's always an array of strings
        if (!Array.isArray(parsedChoices)) {
          parsedChoices = ['', '', '', '']
        }
        // Filter out non-string values and ensure we have at least 4 options
        parsedChoices = parsedChoices.filter(c => typeof c === 'string').slice(0, 4)
        while (parsedChoices.length < 4) {
          parsedChoices.push('')
        }
      } catch (e) {
        console.error('Error parsing choices for edit:', e, 'raw data:', editQuestion.choices)
        parsedChoices = ['', '', '', '']
      }
      setChoices(parsedChoices)

      setAnswerKey(editQuestion.answer_key)
      setGoodAnswerExample(editQuestion.good_answer_example || '')
      setSkillId(editQuestion.skill_id || '')
      setImportanceLevel(editQuestion.importance_level)
      setDifficulty(editQuestion.difficulty)
    } else {
      resetForm()
    }
  }, [editQuestion, open])

  const resetForm = () => {
    setStep('type')
    setQuestionType('multiple_choice')
    setStem('')
    setChoices(['', '', '', ''])
    setAnswerKey('')
    setGoodAnswerExample('')
    setSkillId('')
    setImportanceLevel(3)
    setDifficulty('medium')
  }

  const handleTypeSelect = (type: QuestionType) => {
    setQuestionType(type)
    setStep('details')
    
    // Reset type-specific fields
    if (type === 'true_false') {
      setAnswerKey(true)
    } else if (type === 'multiple_choice') {
      setChoices(['', '', '', ''])
      setAnswerKey('A')
    } else {
      setAnswerKey('')
    }
  }

  const handleSave = async () => {
    // Validation
    if (!stem.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Question text is required',
        variant: 'destructive'
      })
      return
    }

    if (questionType === 'multiple_choice') {
      const filledChoices = choices.filter(o => o.trim())
      if (filledChoices.length < 2) {
        toast({
          title: 'Validation Error',
          description: 'Please provide at least 2 answer options',
          variant: 'destructive'
        })
        return
      }
    }

    if ((questionType === 'short_answer' || questionType === 'long_answer') && !goodAnswerExample.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Good answer example is required for open-ended questions',
        variant: 'destructive'
      })
      return
    }

    try {
      setSaving(true)

      const questionData: Partial<QuizQuestion> = {
        question_type: questionType,
        stem: stem.trim(),
        importance_level: importanceLevel,
        difficulty,
        skill_id: skillId || undefined,
      }

      // Type-specific fields
      if (questionType === 'multiple_choice') {
        questionData.choices = JSON.stringify(choices.filter(o => o.trim()))
        questionData.answer_key = answerKey as string
      } else if (questionType === 'true_false') {
        questionData.choices = JSON.stringify([]) // Empty array for true/false
        questionData.answer_key = answerKey as any
      } else {
        questionData.choices = JSON.stringify([]) // Empty array for open-ended
        questionData.answer_key = ''
        questionData.good_answer_example = goodAnswerExample.trim()
        questionData.max_length = questionType === 'short_answer' ? 200 : 1000
      }

      // If editing, include the ID
      if (editQuestion) {
        questionData.id = editQuestion.id
      }

      await onSave(questionData)
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Error saving question:', error)
      toast({
        title: 'Error',
        description: 'Failed to save question. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (editQuestion) {
      onOpenChange(false)
    } else {
      setStep('type')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editQuestion ? 'Edit Question' : step === 'type' ? 'Create New Question' : 'Question Details'}
          </DialogTitle>
          <DialogDescription>
            {step === 'type' 
              ? 'Select the type of question you want to create'
              : 'Fill in the question details and settings'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Question Type Selection */}
        {step === 'type' && !editQuestion && (
          <div className="space-y-3 py-4">
            {QUESTION_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeSelect(type.value)}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200">
                    {type.value === 'multiple_choice' && <CheckSquare className="w-5 h-5 text-teal-600" />}
                    {type.value === 'true_false' && <ToggleLeft className="w-5 h-5 text-teal-600" />}
                    {type.value === 'short_answer' && <Type className="w-5 h-5 text-teal-600" />}
                    {type.value === 'long_answer' && <FileText className="w-5 h-5 text-teal-600" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{type.label}</h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Question Details */}
        {step === 'details' && (
          <div className="space-y-4 py-4">
            {/* Question Type Badge */}
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {QUESTION_TYPES.find(t => t.value === questionType)?.label}
              </Badge>
            </div>

            {/* Question Text */}
            <div>
              <Label htmlFor="question-text">Question Text *</Label>
              <Textarea
                id="question-text"
                value={stem}
                onChange={(e) => setStem(e.target.value)}
                placeholder="Enter your question..."
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Multiple Choice Options */}
            {questionType === 'multiple_choice' && (
              <div>
                <Label>Answer Options *</Label>
                <div className="space-y-2 mt-1">
                  {Array.isArray(choices) && choices.length > 0 ? choices.map((choice, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 w-6">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <Input
                        value={choice}
                        onChange={(e) => {
                          const newChoices = [...choices]
                          newChoices[idx] = e.target.value
                          setChoices(newChoices)
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      />
                      <input
                        type="radio"
                        name="correct"
                        checked={answerKey === String.fromCharCode(65 + idx)}
                        onChange={() => setAnswerKey(String.fromCharCode(65 + idx))}
                        className="w-4 h-4 text-teal-600"
                      />
                    </div>
                  )) : (
                    <div className="text-gray-500 italic">No choices available</div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">Select the correct answer</p>
              </div>
            )}

            {/* True/False */}
            {questionType === 'true_false' && (
              <div>
                <Label>Correct Answer *</Label>
                <div className="flex gap-4 mt-1">
                  <button
                    onClick={() => setAnswerKey(true)}
                    className={`flex-1 px-4 py-2 rounded-md border-2 transition-all ${
                      answerKey === true
                        ? 'border-teal-500 bg-teal-50 text-teal-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    True
                  </button>
                  <button
                    onClick={() => setAnswerKey(false)}
                    className={`flex-1 px-4 py-2 rounded-md border-2 transition-all ${
                      answerKey === false
                        ? 'border-teal-500 bg-teal-50 text-teal-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    False
                  </button>
                </div>
              </div>
            )}

            {/* Good Answer Example for Open-Ended */}
            {(questionType === 'short_answer' || questionType === 'long_answer') && (
              <div>
                <Label htmlFor="good-answer">Example of a Good Answer *</Label>
                <Textarea
                  id="good-answer"
                  value={goodAnswerExample}
                  onChange={(e) => setGoodAnswerExample(e.target.value)}
                  placeholder={
                    questionType === 'short_answer'
                      ? 'e.g., "13 miles" or "Yes, I can start immediately"'
                      : 'Provide a detailed example answer that demonstrates the expected quality and depth...'
                  }
                  rows={questionType === 'short_answer' ? 2 : 4}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {questionType === 'short_answer'
                    ? 'AI will compare candidate answers to this example (max 200 chars)'
                    : 'AI will evaluate technical accuracy, completeness, and relevance (max 1000 chars)'}
                </p>
              </div>
            )}

            {/* Associated Skill */}
            <div>
              <Label htmlFor="skill">Associated Skill (Optional)</Label>
              <select
                id="skill"
                value={skillId}
                onChange={(e) => setSkillId(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">No specific skill</option>
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Importance Level */}
            <div>
              <Label htmlFor="importance">Importance Level</Label>
              <select
                id="importance"
                value={importanceLevel}
                onChange={(e) => setImportanceLevel(parseInt(e.target.value) as ImportanceLevel)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {IMPORTANCE_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label} - {level.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Level */}
            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {DIFFICULTY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label} ({level.multiplier}x) - {level.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'details' && !editQuestion && (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step === 'details' && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#0694A2] hover:bg-[#047481] text-white"
            >
              {saving ? (
                <>
                  <LoadingSpinner size={16} className="mr-2" />
                  {editQuestion ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editQuestion ? 'Update Question' : 'Create Question'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

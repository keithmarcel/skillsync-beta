'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GripVertical, Edit, Trash2, CheckSquare, ToggleLeft, Type, FileText } from 'lucide-react'
import type { QuizQuestion } from '@/types/assessment'
import { IMPORTANCE_LEVELS, DIFFICULTY_LEVELS } from '@/types/assessment'

interface QuestionCardProps {
  question: QuizQuestion
  index: number
  onEdit: () => void
  onDelete: () => void
  isDragging?: boolean
}

export function QuestionCard({ question, index, onEdit, onDelete, isDragging }: QuestionCardProps) {
  const getQuestionTypeIcon = () => {
    switch (question.question_type) {
      case 'multiple_choice':
        return <CheckSquare className="w-4 h-4" />
      case 'true_false':
        return <ToggleLeft className="w-4 h-4" />
      case 'short_answer':
        return <Type className="w-4 h-4" />
      case 'long_answer':
        return <FileText className="w-4 h-4" />
      default:
        return <CheckSquare className="w-4 h-4" />
    }
  }

  const getQuestionTypeLabel = () => {
    switch (question.question_type) {
      case 'multiple_choice':
        return 'Multiple Choice'
      case 'true_false':
        return 'True/False'
      case 'short_answer':
        return 'Short Answer'
      case 'long_answer':
        return 'Long Answer'
      default:
        return 'Unknown'
    }
  }

  const importanceConfig = IMPORTANCE_LEVELS.find(l => l.value === question.importance_level)
  const difficultyConfig = DIFFICULTY_LEVELS.find(d => d.value === question.difficulty)

  return (
    <Card className={`transition-all ${isDragging ? 'opacity-50 rotate-2' : 'hover:shadow-md'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <div className="flex-shrink-0 pt-1 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>

          {/* Question Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                  <Badge variant="outline" className="text-xs">
                    {getQuestionTypeIcon()}
                    <span className="ml-1">{getQuestionTypeLabel()}</span>
                  </Badge>
                </div>
                <p className="text-base font-medium text-gray-900 line-clamp-2">
                  {question.stem}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Question Details */}
            <div className="flex items-center gap-4 text-sm">
              {/* Skill */}
              {question.skill && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Skill:</span>
                  <span className="text-gray-700 font-medium">{question.skill.name}</span>
                </div>
              )}

              {/* Importance */}
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Importance:</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs rounded-full ${
                    importanceConfig?.value === 5 ? 'bg-red-50 border-red-200 text-red-700' :
                    importanceConfig?.value === 4 ? 'bg-orange-50 border-orange-200 text-orange-700' :
                    importanceConfig?.value === 3 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                    importanceConfig?.value === 2 ? 'bg-blue-50 border-blue-200 text-blue-700' :
                    'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  {importanceConfig?.label}
                </Badge>
              </div>

              {/* Difficulty */}
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Difficulty:</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs rounded-full ${
                    difficultyConfig?.value === 'expert' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                    difficultyConfig?.value === 'hard' ? 'bg-red-50 border-red-200 text-red-700' :
                    difficultyConfig?.value === 'medium' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                    'bg-green-50 border-green-200 text-green-700'
                  }`}
                >
                  {difficultyConfig?.label} ({difficultyConfig?.multiplier}x)
                </Badge>
              </div>
            </div>

            {/* Answer Preview for Multiple Choice */}
            {question.question_type === 'multiple_choice' && question.choices && (
              <div className="mt-3 pt-3 border-t">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(typeof question.choices === 'string' ? JSON.parse(question.choices) : question.choices).map((choice: string, idx: number) => (
                    <div 
                      key={idx}
                      className={`px-2 py-1 rounded ${
                        String.fromCharCode(65 + idx) === question.answer_key 
                          ? 'bg-green-50 text-green-700 font-medium' 
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}. {choice}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Answer Preview for True/False */}
            {question.question_type === 'true_false' && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-sm">
                  <span className="text-gray-500">Correct Answer: </span>
                  <span className="font-medium text-gray-900">
                    {question.answer_key === true || question.answer_key === 'true' ? 'True' : 'False'}
                  </span>
                </div>
              </div>
            )}

            {/* Good Answer Example for Open-Ended */}
            {(question.question_type === 'short_answer' || question.question_type === 'long_answer') && question.good_answer_example && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-sm">
                  <span className="text-gray-500">Good Answer Example: </span>
                  <p className="text-gray-700 mt-1 italic">"{question.good_answer_example}"</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

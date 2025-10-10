'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon, Sparkles } from 'lucide-react';

interface AIGenerateButtonProps {
  onClick: () => void;
  buttonText: string;
  tooltipContent: {
    title: string;
    points: string[];
  };
  className?: string;
  disabled?: boolean;
}

export function AIGenerateButton({
  onClick,
  buttonText,
  tooltipContent,
  className = '',
  disabled = false
}: AIGenerateButtonProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        {buttonText}
      </Button>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs bg-gray-900 text-white border-gray-700">
            <p className="text-sm">
              <strong>{tooltipContent.title}</strong><br/>
              {tooltipContent.points.map((point, index) => (
                <span key={index}>• {point}<br/></span>
              ))}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

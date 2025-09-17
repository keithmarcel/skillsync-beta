import * as React from 'react';

// Switch component types are now defined in the component file itself

declare module '@/components/ui/use-toast' {
  export interface ToastProps {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
    duration?: number;
    action?: React.ReactNode;
  }

  export interface ToastActionElement
    extends React.ReactElement<{
      altText: string;
      onClick: () => void;
      children: React.ReactNode;
    }> {}

  export function toast(options: ToastProps): {
    id: string;
    update: (props: ToastProps) => void;
    dismiss: () => void;
  };
}

// Add global type declarations for JSX elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'switch': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          checked?: boolean;
          disabled?: boolean;
        },
        HTMLElement
      >;
    }
  }
}

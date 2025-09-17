// Simple toast hook replacement - using console.log for now
export function useToast() {
  return {
    toast: ({ title, description, variant }: { title?: string; description?: string; variant?: string }) => {
      console.log(`Toast: ${title}`, { description, variant })
    },
    toasts: []
  }
}

export function toast({ title, description, variant }: { title?: string; description?: string; variant?: string }) {
  console.log(`Toast: ${title}`, { description, variant })
}

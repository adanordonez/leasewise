import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          'bg-purple-100 text-uchicago-maroon-dark': variant === 'default',
          'bg-red-100 text-red-700': variant === 'destructive',
          'border border-gray-300 text-gray-700': variant === 'outline',
          'bg-gray-100 text-gray-700': variant === 'secondary',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }

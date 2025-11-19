import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  variant?: "default" | "primary" | "success" | "warning"
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
  className,
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background p-6 transition-colors",
        "hover:bg-zinc-50 dark:hover:bg-zinc-900",
        variant === "primary" && "bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-base font-bold text-zinc-700 dark:text-zinc-300">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {trend && (
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive !== false ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}
              >
                {trend.isPositive !== false ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-zinc-500">{description}</p>
          )}
          {trend && trend.label && (
            <p className="text-xs text-zinc-500">{trend.label}</p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "flex items-center justify-center w-12 h-12 rounded-lg transition-colors",
            variant === "default" && "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
            variant === "primary" && "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300",
            variant === "success" && "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300",
            variant === "warning" && "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300"
          )}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  )
}

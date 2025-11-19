import * as React from "react"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StepperProps {
  steps: {
    title: string
    description?: string
  }[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isUpcoming = stepNumber > currentStep

          return (
            <React.Fragment key={index}>
              {/* Step */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all duration-300",
                    isCompleted && "bg-blue-500 text-white ring-4 ring-blue-50 dark:ring-blue-900/30",
                    isCurrent && "bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-800 scale-110",
                    isUpcoming && "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors",
                      (isCompleted || isCurrent) && "text-foreground",
                      isUpcoming && "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-[2px] mx-2 mb-12">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      stepNumber < currentStep && "bg-blue-500",
                      stepNumber >= currentStep && "bg-zinc-200 dark:bg-zinc-800"
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

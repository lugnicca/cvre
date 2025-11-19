"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "rounded-xl border border-border bg-background text-foreground shadow-lg",
          description: "text-muted-foreground",
          actionButton: "rounded-xl bg-primary text-primary-foreground",
          cancelButton: "rounded-xl bg-muted text-muted-foreground",
          success: "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20",
          error: "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20",
          warning: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20",
          info: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

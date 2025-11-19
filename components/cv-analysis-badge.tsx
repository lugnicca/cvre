'use client'

import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import type { CVAnalysisStatus } from '@/lib/db'

interface CVAnalysisBadgeProps {
  status: CVAnalysisStatus | null
}

export function CVAnalysisBadge({ status }: CVAnalysisBadgeProps) {
  if (!status) {
    return (
      <Badge variant="outline" className="gap-1.5">
        <Clock className="h-3 w-3" />
        En attente
      </Badge>
    )
  }

  switch (status.status) {
    case 'idle':
      return (
        <Badge variant="outline" className="gap-1.5">
          <Clock className="h-3 w-3" />
          En attente
        </Badge>
      )

    case 'extracting':
      return (
        <Badge variant="outline" className="gap-1.5 bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300">
          <Loader2 className="h-3 w-3 animate-spin" />
          Extraction ({status.progress}%)
        </Badge>
      )

    case 'analyzing':
      return (
        <Badge variant="outline" className="gap-1.5 bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300">
          <Loader2 className="h-3 w-3 animate-spin" />
          Analyse IA ({status.progress}%)
        </Badge>
      )

    case 'completed':
      return (
        <Badge variant="outline" className="gap-1.5 bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300">
          <CheckCircle2 className="h-3 w-3" />
          Analysé
        </Badge>
      )

    case 'error':
      return (
        <Badge variant="outline" className="gap-1.5 bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
          <AlertCircle className="h-3 w-3" />
          Erreur
        </Badge>
      )

    default:
      return null
  }
}


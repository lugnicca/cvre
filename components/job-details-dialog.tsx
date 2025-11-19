"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  FileText,
  Sparkles,
  TrendingUp,
  ExternalLink,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Wrench,
  Target,
  User,
  ListChecks,
  Gift,
} from "lucide-react"
import type { OptimizedCV } from "@/lib/db"

interface JobDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  optimizedCV: OptimizedCV
}

export function JobDetailsDialog({ open, onOpenChange, optimizedCV }: JobDetailsDialogProps) {
  const [changesOpen, setChangesOpen] = useState(false)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [descriptionOpen, setDescriptionOpen] = useState(false)

  const getStatusColor = (status: OptimizedCV['status']) => {
    switch (status) {
      case 'optimized':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
      case 'sent':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
      case 'interview':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
      case 'offer':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
    }
  }

  const getStatusLabel = (status: OptimizedCV['status']) => {
    switch (status) {
      case 'optimized':
        return 'Optimisé'
      case 'sent':
        return 'Envoyé'
      case 'interview':
        return 'Entretien'
      case 'rejected':
        return 'Refusé'
      case 'offer':
        return 'Offre'
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const jobDetails = optimizedCV.jobDetails

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{optimizedCV.jobTitle}</DialogTitle>
              <DialogDescription className="text-base flex items-center gap-2 mb-3">
                <Briefcase className="h-4 w-4" />
                {optimizedCV.company}
              </DialogDescription>
              
              {/* Date et Stats */}
              <div className="flex items-center gap-3 flex-wrap mt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(optimizedCV.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-sm font-bold text-green-600">{optimizedCV.matchScore}%</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  <span className="text-sm font-medium capitalize">{optimizedCV.matchMode}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-sm font-medium uppercase">{optimizedCV.language}</span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className={getStatusColor(optimizedCV.status)}>
              {getStatusLabel(optimizedCV.status)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Description de l'offre (Collapsible) */}
          <Collapsible open={descriptionOpen} onOpenChange={setDescriptionOpen}>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-zinc-600" />
                    <h3 className="text-sm font-semibold">Description de l'offre</h3>
                  </div>
                  {descriptionOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">{optimizedCV.jobDescription}</p>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Profile */}
          {jobDetails?.profile && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-indigo-50/50 dark:bg-indigo-900/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-semibold">Profil recherché</h3>
              </div>
              <p className="text-sm whitespace-pre-wrap">{jobDetails.profile}</p>
            </div>
          )}

          {/* Quick Info */}
          {(jobDetails?.location || jobDetails?.contractType || jobDetails?.salary || optimizedCV.jobUrl) && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {jobDetails?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{jobDetails.location}</span>
                </div>
              )}
              {jobDetails?.contractType && (
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>{jobDetails.contractType}</span>
                </div>
              )}
              {jobDetails?.salary && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>{jobDetails.salary}</span>
                </div>
              )}
              {optimizedCV.jobUrl && (
                <Button asChild variant="ghost" size="sm" className="h-5 px-2 -ml-2">
                  <a href={optimizedCV.jobUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Lien
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* Keywords */}
          {jobDetails?.keywords && jobDetails.keywords.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold">Mots-clés de l'offre</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobDetails.keywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          {jobDetails?.tools && jobDetails.tools.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-semibold">Outils & Technologies</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobDetails.tools.map((tool, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
                  >
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Required Skills */}
          {jobDetails?.requiredSkills && jobDetails.requiredSkills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="h-4 w-4 text-red-600" />
                <h3 className="text-sm font-semibold">Compétences indispensables</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobDetails.requiredSkills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Skills */}
          {jobDetails?.preferredSkills && jobDetails.preferredSkills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-semibold">Compétences appréciées</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobDetails.preferredSkills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}


          {/* Missions */}
          {jobDetails?.missions && jobDetails.missions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold">Missions principales</h3>
              </div>
              <ul className="space-y-2">
                {jobDetails.missions.map((mission, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-emerald-50/50 dark:bg-emerald-900/10 p-3"
                  >
                    <span className="text-emerald-600 mt-0.5">•</span>
                    <span>{mission}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {jobDetails?.benefits && jobDetails.benefits.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Gift className="h-4 w-4 text-pink-600" />
                <h3 className="text-sm font-semibold">Avantages</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobDetails.benefits.map((benefit, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800"
                  >
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Changes (Collapsible) */}
          {optimizedCV.changes.length > 0 && (
            <Collapsible open={changesOpen} onOpenChange={setChangesOpen}>
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <h3 className="text-sm font-semibold">
                        Changements effectués ({optimizedCV.changes.length})
                      </h3>
                    </div>
                    {changesOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                    {optimizedCV.changes.map((change, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm rounded-lg bg-blue-50/50 dark:bg-blue-900/10 p-3"
                      >
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>{change}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Suggestions (Collapsible) */}
          {optimizedCV.suggestions.length > 0 && (
            <Collapsible open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                        Suggestions supplémentaires ({optimizedCV.suggestions.length})
                      </h3>
                    </div>
                    {suggestionsOpen ? (
                      <ChevronUp className="h-4 w-4 text-amber-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-amber-600" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-2 border-t border-amber-200 dark:border-amber-800 pt-3">
                    {optimizedCV.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm rounded-lg bg-amber-100/50 dark:bg-amber-900/20 p-3"
                      >
                        <Sparkles className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span className="text-amber-900 dark:text-amber-100">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

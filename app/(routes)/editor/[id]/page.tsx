"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { db } from "@/lib/db"
import type { OptimizedCV } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Save, Download, Camera, Plus, GripVertical, User, FileText, Briefcase, GraduationCap, Wrench, Languages, Award, Heart, Code, Copy, Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import { CVPreview } from "@/components/cv-editor/cv-preview"
import { EditPersonalModal } from "@/components/cv-editor/edit-personal-modal"
import { EditAboutModal } from "@/components/cv-editor/edit-about-modal"
import { EditExperienceModalV2 } from "@/components/cv-editor/edit-experience-modal-v2"
import { EditEducationModal } from "@/components/cv-editor/edit-education-modal"
import { EditSkillsModal } from "@/components/cv-editor/edit-skills-modal"
import { EditLanguagesModal } from "@/components/cv-editor/edit-languages-modal"
import { EditCertificationsModal } from "@/components/cv-editor/edit-certifications-modal"
import { EditHobbiesModal } from "@/components/cv-editor/edit-hobbies-modal"
import { EditJsonModal } from "@/components/cv-editor/edit-json-modal"
import { PhotoUploadModal } from "@/components/cv-editor/photo-upload-modal"
import { JobDetailsDialog } from "@/components/job-details-dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type {
  EditableCVData,
  CVTemplate,
  EditableSection,
} from "@/lib/types/cv-editor"
import { toast } from "sonner"

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const cvId = params.id as string

  const [cv, setCv] = useState<OptimizedCV | null>(null)
  const [cvData, setCvData] = useState<EditableCVData | null>(null)
  const [template, setTemplate] = useState<CVTemplate>("classic")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modal states
  const [editState, setEditState] = useState<{
    section: EditableSection
    index?: number
  } | null>(null)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [editJsonModalOpen, setEditJsonModalOpen] = useState(false)

  // Collapsible states
  const [changesOpen, setChangesOpen] = useState(false)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)

  // Load CV from database
  useEffect(() => {
    const loadCV = async () => {
      try {
        const loadedCV = await db.optimizedCVs.get(cvId)
        if (!loadedCV) {
          toast.error("CV introuvable")
          router.push("/dashboard")
          return
        }
        setCv(loadedCV)
        setCvData(loadedCV.optimizedCV as EditableCVData)
        setLoading(false)
      } catch (error) {
        console.error("Error loading CV:", error)
        toast.error("Erreur lors du chargement du CV")
        router.push("/dashboard")
      }
    }

    loadCV()
  }, [cvId, router])

  // Auto-save
  const saveCV = useCallback(async () => {
    if (!cv || !cvData) return

    setSaving(true)
    try {
      await db.optimizedCVs.update(cv.id, {
        optimizedCV: cvData,
        updatedAt: Date.now(),
      })
      toast.success("CV sauvegardé", { duration: 2000 })
    } catch (error) {
      console.error("Error saving CV:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }, [cv, cvData])

  // Handle section click
  const handleSectionClick = (section: EditableSection, index?: number) => {
    setEditState({ section, index })
  }

  // Handle photo click
  const handlePhotoClick = () => {
    setPhotoModalOpen(true)
  }

  // Handle data updates
  const handleDataUpdate = (updates: Partial<EditableCVData>) => {
    if (!cvData) return
    setCvData({ ...cvData, ...updates })
  }

  // Handle photo update
  const handlePhotoUpdate = (photo: EditableCVData["photo"]) => {
    if (!cvData) return
    setCvData({ ...cvData, photo })
  }

  // Export PDF
  const handleExportPDF = async () => {
    const wrapper = document.getElementById('cv-content-wrapper')
    const content = document.getElementById('cv-content')
    if (!content || !wrapper) {
      window.print()
      return
    }

    // Remove any previous zoom
    wrapper.style.removeProperty('zoom')
    content.style.removeProperty('--print-zoom')
    
    // Force layout recalculation
    content.offsetHeight
    
    // A4 height at 96dpi: 1123px (297mm), but leave some margin for safety
    const A4_HEIGHT_PX = 1100
    const contentHeight = content.scrollHeight
    
    console.log('Content height:', contentHeight, 'Target A4 height:', A4_HEIGHT_PX)
    
    if (contentHeight > A4_HEIGHT_PX) {
      // Calculate the zoom needed (zoom is better than scale for print)
      const zoom = A4_HEIGHT_PX / contentHeight
      console.log('Zoom needed:', zoom)
      
      // Set zoom via CSS variable for print media
      content.style.setProperty('--print-zoom', zoom.toString())
    } else {
      content.style.setProperty('--print-zoom', '1')
    }

    // Small delay to ensure CSS variable is set before print dialog
    setTimeout(() => {
      window.print()
      // Clean up after print
      setTimeout(() => {
        content.style.removeProperty('--print-zoom')
      }, 100)
    }, 50)
  }

  const handleCopyJson = async () => {
    if (!cvData) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(cvData, null, 2))
      toast.success("JSON copié dans le presse-papier")
    } catch (err) {
      toast.error("Erreur lors de la copie")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
          <p className="text-zinc-600">Chargement du CV...</p>
        </div>
      </div>
    )
  }

  if (!cvData) {
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Éditeur de CV</h1>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {cv?.jobTitle} - {cv?.company}
                  </p>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs text-purple-600 dark:text-purple-400"
                    onClick={() => setDetailsDialogOpen(true)}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Voir le rapport complet
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select value={template} onValueChange={(value) => setTemplate(value as CVTemplate)}>
                <SelectTrigger className="w-[180px] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700">
                  <SelectValue placeholder="Sélectionner un template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={saveCV}
                disabled={saving}
                className="dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>

              <Button onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Exporter PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto p-8">
        <div className="grid grid-cols-[300px_1fr] gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setPhotoModalOpen(true)}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Gérer la photo
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setEditState({ section: "personal" })}
                >
                  <User className="h-3.5 w-3.5 mr-2" />
                  <span className="text-xs">Infos personnelles</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setEditState({ section: "about" })}
                >
                  <FileText className="h-3.5 w-3.5 mr-2" />
                  <span className="text-xs">Profil</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setEditState({ section: "experience" })}
                >
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  <span className="text-xs">Ajouter expérience</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setEditState({ section: "education" })}
                >
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  <span className="text-xs">Ajouter formation</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setEditState({ section: "skills" })}
                >
                  <Wrench className="h-3.5 w-3.5 mr-2" />
                  <span className="text-xs text-zinc-700 dark:text-zinc-200">Compétences</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setEditState({ section: "languages" })}
                >
                  <Languages className="h-3.5 w-3.5 mr-2" />
                  <span className="text-xs text-zinc-700 dark:text-zinc-200">Langues</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setEditState({ section: "certifications" })}
                >
                  <Award className="h-3.5 w-3.5 mr-2" />
                  <span className="text-xs">Certifications</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setEditState({ section: "hobbies" })}
                >
                  <Heart className="h-3.5 w-3.5 mr-2" />
                  <span className="text-xs">Centres d'intérêt</span>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimisation IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Changes (Collapsible) */}
                <Collapsible open={changesOpen} onOpenChange={setChangesOpen}>
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
                            {cv?.changes?.length || 0}
                          </div>
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Changements</span>
                        </div>
                        {changesOpen ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-3 pb-3 space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-2 max-h-[200px] overflow-y-auto">
                        {cv?.changes && cv.changes.length > 0 ? (
                          cv.changes.map((change, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-2 rounded"
                            >
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>{change}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-muted-foreground p-2">Aucun changement</div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                {/* Suggestions (Collapsible) */}
                <Collapsible open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
                            {cv?.suggestions?.length || 0}
                          </div>
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Suggestions</span>
                        </div>
                        {suggestionsOpen ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-3 pb-3 space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-2 max-h-[200px] overflow-y-auto">
                        {cv?.suggestions && cv.suggestions.length > 0 ? (
                          cv.suggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-2 rounded"
                            >
                              <span className="text-amber-500 mt-0.5">•</span>
                              <span>{suggestion}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-muted-foreground p-2">Aucune suggestion</div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Données (JSON)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setEditJsonModalOpen(true)}
                >
                  <Code className="h-4 w-4 mr-2" />
                  Éditer le JSON
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleCopyJson}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copier le JSON
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <Card className="h-fit">
            <CardContent className="p-0">
              <CVPreview
                data={cvData}
                template={template}
                onSectionClick={handleSectionClick}
                onPhotoClick={handlePhotoClick}
                onDataUpdate={handleDataUpdate}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modals */}
      <EditPersonalModal
        open={editState?.section === "personal" && editState.index === undefined}
        onOpenChange={(open) => !open && setEditState(null)}
        data={cvData}
        onSave={handleDataUpdate}
      />

      <EditAboutModal
        open={editState?.section === "about"}
        onOpenChange={(open) => !open && setEditState(null)}
        data={cvData}
        onSave={handleDataUpdate}
      />

      <EditExperienceModalV2
        open={editState?.section === "experience"}
        onOpenChange={(open) => !open && setEditState(null)}
        data={cvData}
        index={editState?.index}
        onSave={handleDataUpdate}
      />

      <EditEducationModal
        open={editState?.section === "education"}
        onOpenChange={(open) => !open && setEditState(null)}
        data={cvData}
        index={editState?.index}
        onSave={handleDataUpdate}
      />

      <EditSkillsModal
        open={editState?.section === "skills"}
        onOpenChange={(open) => !open && setEditState(null)}
        data={cvData}
        onSave={handleDataUpdate}
      />

      <EditLanguagesModal
        open={editState?.section === "languages"}
        onOpenChange={(open) => !open && setEditState(null)}
        data={cvData}
        onSave={handleDataUpdate}
      />

      <EditCertificationsModal
        open={editState?.section === "certifications"}
        onOpenChange={(open) => !open && setEditState(null)}
        data={cvData}
        onSave={handleDataUpdate}
      />

      <EditHobbiesModal
        open={editState?.section === "hobbies"}
        onOpenChange={(open) => !open && setEditState(null)}
        data={cvData}
        onSave={handleDataUpdate}
      />

      <PhotoUploadModal
        open={photoModalOpen}
        onOpenChange={setPhotoModalOpen}
        currentPhoto={cvData.photo}
        onSave={handlePhotoUpdate}
      />

      {cv && (
        <JobDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          optimizedCV={cv}
        />
      )}

      <EditJsonModal
        open={editJsonModalOpen}
        onOpenChange={setEditJsonModalOpen}
        data={cvData}
        onSave={handleDataUpdate}
      />
    </div>
  )
}

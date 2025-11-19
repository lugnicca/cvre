"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Plus, GripVertical } from "lucide-react"
import type { EditableCVData } from "@/lib/types/cv-editor"

interface EditExperienceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: EditableCVData
  index?: number
  onSave: (data: Partial<EditableCVData>) => void
}

export function EditExperienceModalV2({
  open,
  onOpenChange,
  data,
  index,
  onSave,
}: EditExperienceModalProps) {
  const experience = index !== undefined ? data.experience[index] : null

  const [formData, setFormData] = useState({
    title: experience?.title || "",
    company: experience?.company || "",
    period: experience?.period || "",
    description: "",
  })

  useEffect(() => {
    if (open) {
      const experience = index !== undefined ? data.experience[index] : null
      
      // Handle description which can be string or array
      let description = ""
      if (experience?.description) {
        if (Array.isArray(experience.description)) {
          description = experience.description.join("\n")
        } else {
          description = experience.description
        }
      }

      setFormData({
        title: experience?.title || "",
        company: experience?.company || "",
        period: experience?.period || "",
        description: description,
      })
    }
  }, [open, data, index])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newExperience = [...(data.experience || [])]
    const expData = {
      ...formData,
      description: formData.description, // Save as string
    }

    if (index !== undefined) {
      newExperience[index] = expData
    } else {
      newExperience.push(expData)
    }

    onSave({ experience: newExperience })
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (index !== undefined) {
      const newExperience = data.experience.filter((_, i) => i !== index)
      onSave({ experience: newExperience })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {index !== undefined ? "Modifier l'expérience" : "Ajouter une expérience"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Titre du poste</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Développeur Full-Stack"
                required
              />
            </div>

            <div>
              <Label htmlFor="company">Entreprise</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Inc."
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="period">Période</Label>
            <Input
              id="period"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              placeholder="Jan 2020 - Déc 2023"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez vos réalisations et responsabilités..."
              className="min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Utilisez des retours à la ligne pour structurer votre description.
            </p>
          </div>

          <div className="flex justify-between pt-4">
            {index !== undefined && (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                Supprimer
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

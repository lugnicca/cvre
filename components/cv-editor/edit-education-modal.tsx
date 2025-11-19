"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { EditableCVData } from "@/lib/types/cv-editor"

interface EditEducationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: EditableCVData
  index?: number
  onSave: (data: Partial<EditableCVData>) => void
}

export function EditEducationModal({
  open,
  onOpenChange,
  data,
  index,
  onSave,
}: EditEducationModalProps) {
  const education = index !== undefined ? data.education[index] : null

  const [formData, setFormData] = useState({
    degree: education?.degree || "",
    institution: education?.institution || "",
    period: education?.period || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newEducation = [...(data.education || [])]

    if (index !== undefined) {
      newEducation[index] = formData
    } else {
      newEducation.push(formData)
    }

    onSave({ education: newEducation })
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (index !== undefined) {
      const newEducation = data.education.filter((_, i) => i !== index)
      onSave({ education: newEducation })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {index !== undefined ? "Modifier la formation" : "Ajouter une formation"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="degree">Diplôme</Label>
            <Input
              id="degree"
              value={formData.degree}
              onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              placeholder="Master en Informatique"
              required
            />
          </div>

          <div>
            <Label htmlFor="institution">Établissement</Label>
            <Input
              id="institution"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              placeholder="Université de Paris"
              required
            />
          </div>

          <div>
            <Label htmlFor="period">Période</Label>
            <Input
              id="period"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              placeholder="2018 - 2020"
              required
            />
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

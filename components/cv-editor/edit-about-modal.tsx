"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { EditableCVData } from "@/lib/types/cv-editor"

interface EditAboutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: EditableCVData
  onSave: (data: Partial<EditableCVData>) => void
}

export function EditAboutModal({
  open,
  onOpenChange,
  data,
  onSave,
}: EditAboutModalProps) {
  const [about, setAbout] = useState(data.about)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ about })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier le profil</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="about">Profil professionnel</Label>
            <Textarea
              id="about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Décrivez votre profil professionnel..."
              rows={6}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

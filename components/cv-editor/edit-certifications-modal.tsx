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
import { X } from "lucide-react"
import type { EditableCVData } from "@/lib/types/cv-editor"

interface EditCertificationsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: EditableCVData
  onSave: (data: Partial<EditableCVData>) => void
}

export function EditCertificationsModal({
  open,
  onOpenChange,
  data,
  onSave,
}: EditCertificationsModalProps) {
  const [certifications, setCertifications] = useState<string[]>(data.certifications || [])
  const [newCertification, setNewCertification] = useState("")

  const handleAddCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications([...certifications, newCertification.trim()])
      setNewCertification("")
    }
  }

  const handleRemoveCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ certifications })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier les certifications</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="new-certification">Ajouter une certification</Label>
            <div className="flex gap-2">
              <Input
                id="new-certification"
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                placeholder="AWS Certified Solutions Architect, etc."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddCertification()
                  }
                }}
              />
              <Button type="button" onClick={handleAddCertification}>
                Ajouter
              </Button>
            </div>
          </div>

          <div>
            <Label>Certifications actuelles</Label>
            <div className="space-y-2 mt-2 p-4 border border-zinc-200 rounded-lg min-h-[100px]">
              {certifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune certification ajoutée</p>
              ) : (
                certifications.map((cert, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded"
                  >
                    <span className="dark:text-zinc-100">{cert}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCertification(index)}
                      className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
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

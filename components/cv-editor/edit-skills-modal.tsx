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

interface EditSkillsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: EditableCVData
  onSave: (data: Partial<EditableCVData>) => void
}

export function EditSkillsModal({
  open,
  onOpenChange,
  data,
  onSave,
}: EditSkillsModalProps) {
  const [skills, setSkills] = useState<string[]>(data.skills || [])
  const [newSkill, setNewSkill] = useState("")

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ skills })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier les compétences</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="new-skill">Ajouter une compétence</Label>
            <div className="flex gap-2">
              <Input
                id="new-skill"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="React, TypeScript, etc."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddSkill()
                  }
                }}
              />
              <Button type="button" onClick={handleAddSkill}>
                Ajouter
              </Button>
            </div>
          </div>

          <div>
            <Label>Compétences actuelles</Label>
            <div className="flex flex-wrap gap-2 mt-2 p-4 border border-zinc-200 rounded-lg min-h-[100px]">
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune compétence ajoutée</p>
              ) : (
                skills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full"
                  >
                    <span className="text-sm dark:text-zinc-100">{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                      <X className="h-3 w-3" />
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

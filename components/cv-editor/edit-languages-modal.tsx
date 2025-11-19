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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"
import type { EditableCVData } from "@/lib/types/cv-editor"

interface EditLanguagesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: EditableCVData
  onSave: (data: Partial<EditableCVData>) => void
}

const LANGUAGE_LEVELS = [
  "Débutant",
  "Élémentaire",
  "Intermédiaire",
  "Avancé",
  "Courant",
  "Bilingue",
  "Langue maternelle",
]

export function EditLanguagesModal({
  open,
  onOpenChange,
  data,
  onSave,
}: EditLanguagesModalProps) {
  const [languages, setLanguages] = useState<Array<{ name: string; level: string }>>(
    data.languages || []
  )
  const [newLanguage, setNewLanguage] = useState({ name: "", level: "Intermédiaire" })

  const handleAddLanguage = () => {
    if (newLanguage.name.trim() && !languages.find((l) => l.name === newLanguage.name.trim())) {
      setLanguages([...languages, { name: newLanguage.name.trim(), level: newLanguage.level }])
      setNewLanguage({ name: "", level: "Intermédiaire" })
    }
  }

  const handleRemoveLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ languages })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier les langues</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
            <div>
              <Label htmlFor="language-name">Langue</Label>
              <Input
                id="language-name"
                value={newLanguage.name}
                onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                placeholder="Français, Anglais, etc."
              />
            </div>

            <div>
              <Label htmlFor="language-level">Niveau</Label>
              <Select
                value={newLanguage.level}
                onValueChange={(value) => setNewLanguage({ ...newLanguage, level: value })}
              >
                <SelectTrigger id="language-level" className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button type="button" onClick={handleAddLanguage}>
                Ajouter
              </Button>
            </div>
          </div>

          <div>
            <Label>Langues actuelles</Label>
            <div className="space-y-2 mt-2 p-4 border border-zinc-200 rounded-lg min-h-[100px]">
              {languages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune langue ajoutée</p>
              ) : (
                languages.map((lang, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded"
                  >
                    <div>
                      <span className="font-medium dark:text-zinc-100">{lang.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">- {lang.level}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(index)}
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

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

interface EditHobbiesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: EditableCVData
  onSave: (data: Partial<EditableCVData>) => void
}

export function EditHobbiesModal({
  open,
  onOpenChange,
  data,
  onSave,
}: EditHobbiesModalProps) {
  const [hobbies, setHobbies] = useState<string[]>(data.hobbies || [])
  const [newHobby, setNewHobby] = useState("")

  const handleAddHobby = () => {
    if (newHobby.trim() && !hobbies.includes(newHobby.trim())) {
      setHobbies([...hobbies, newHobby.trim()])
      setNewHobby("")
    }
  }

  const handleRemoveHobby = (index: number) => {
    setHobbies(hobbies.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ hobbies })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier les centres d'intérêt</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="new-hobby">Ajouter un centre d'intérêt</Label>
            <div className="flex gap-2">
              <Input
                id="new-hobby"
                value={newHobby}
                onChange={(e) => setNewHobby(e.target.value)}
                placeholder="Photographie, Voyages, etc."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddHobby()
                  }
                }}
              />
              <Button type="button" onClick={handleAddHobby}>
                Ajouter
              </Button>
            </div>
          </div>

          <div>
            <Label>Centres d'intérêt actuels</Label>
            <div className="flex flex-wrap gap-2 mt-2 p-4 border border-zinc-200 rounded-lg min-h-[100px]">
              {hobbies.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun centre d'intérêt ajouté</p>
              ) : (
                hobbies.map((hobby, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full"
                  >
                    <span className="text-sm dark:text-zinc-100">{hobby}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHobby(index)}
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

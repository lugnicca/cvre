"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Check, Copy, RotateCcw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import type { EditableCVData } from "@/lib/types/cv-editor"

interface EditJsonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: EditableCVData | null
  onSave: (data: EditableCVData) => void
}

export function EditJsonModal({
  open,
  onOpenChange,
  data,
  onSave,
}: EditJsonModalProps) {
  const [jsonString, setJsonString] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (data && open) {
      setJsonString(JSON.stringify(data, null, 2))
      setError(null)
    }
  }, [data, open])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString)
      toast.success("JSON copié dans le presse-papier")
    } catch (err) {
      toast.error("Erreur lors de la copie")
    }
  }

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonString)
      // Basic validation to ensure it's at least somewhat correct structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error("Le JSON doit être un objet")
      }
      
      onSave(parsed as EditableCVData)
      onOpenChange(false)
      toast.success("JSON mis à jour")
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const handleReset = () => {
    if (data) {
      setJsonString(JSON.stringify(data, null, 2))
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Éditer le JSON du CV</DialogTitle>
          <DialogDescription>
            Modifiez directement la structure de données du CV. Attention, une structure invalide peut causer des erreurs d'affichage.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 relative overflow-hidden">
          <Textarea
            value={jsonString}
            onChange={(e) => {
              setJsonString(e.target.value)
              setError(null)
            }}
            className="w-full h-full font-mono text-sm resize-none p-4 absolute inset-0"
            spellCheck={false}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de syntaxe</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copier
          </Button>
          <Button onClick={handleSave}>
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


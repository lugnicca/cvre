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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Linkedin, Github, Globe, Link as LinkIcon, Twitter } from "lucide-react"
import type { EditableCVData } from "@/lib/types/cv-editor"

interface EditPersonalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: EditableCVData
  onSave: (data: Partial<EditableCVData>) => void
}

const AVAILABLE_ICONS = [
  { value: "link", label: "Lien", icon: LinkIcon },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "github", label: "GitHub", icon: Github },
  { value: "globe", label: "Portfolio", icon: Globe },
  { value: "twitter", label: "Twitter/X", icon: Twitter },
]

export function EditPersonalModal({
  open,
  onOpenChange,
  data,
  onSave,
}: EditPersonalModalProps) {
  const [formData, setFormData] = useState({
    name: data.name,
    email: data.email,
    phone: data.phone,
    links: data.links || [],
  })

  useEffect(() => {
    if (open) {
      setFormData({
        name: data.name,
        email: data.email,
        phone: data.phone,
        links: data.links || [],
      })
    }
  }, [open, data])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onOpenChange(false)
  }

  const addLink = () => {
    setFormData({
      ...formData,
      links: [...formData.links, { name: "", url: "", icon: "link" }],
    })
  }

  const removeLink = (index: number) => {
    const newLinks = formData.links.filter((_, i) => i !== index)
    setFormData({ ...formData, links: newLinks })
  }

  const updateLink = (index: number, field: "name" | "url" | "icon", value: string) => {
    const newLinks = [...formData.links]
    newLinks[index] = { ...newLinks[index], [field]: value }
    setFormData({ ...formData, links: newLinks })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier les informations personnelles</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john.doe@example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+33 6 12 34 56 78"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Liens (LinkedIn, Portfolio, etc.)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLink}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
            {formData.links.map((link, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="w-[140px]">
                   <Select
                    value={link.icon || "link"}
                    onValueChange={(value) => updateLink(index, "icon", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ICONS.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            <icon.icon className="h-4 w-4" />
                            <span>{icon.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Nom (ex: LinkedIn)"
                    value={link.name}
                    onChange={(e) => updateLink(index, "name", e.target.value)}
                  />
                  <Input
                    placeholder="URL (ex: https://linkedin.com/in/...)"
                    value={link.url}
                    onChange={(e) => updateLink(index, "url", e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive mt-1"
                  onClick={() => removeLink(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
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

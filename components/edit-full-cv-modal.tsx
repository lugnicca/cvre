"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/base-scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { ParsedCVData } from "@/lib/db"
import { db } from "@/lib/db"

interface EditFullCVModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ParsedCVData
  onSave?: () => void
}

export function EditFullCVModal({
  open,
  onOpenChange,
  data,
  onSave,
}: EditFullCVModalProps) {
  const [formData, setFormData] = useState<ParsedCVData>(data)
  const [skillsInput, setSkillsInput] = useState(data.skills.join(', '))
  const [hobbiesInput, setHobbiesInput] = useState(data.hobbies.join(', '))
  const [certificationsInput, setCertificationsInput] = useState(data.certifications.join(', '))
  const [isSaving, setIsSaving] = useState(false)

  // Synchronize formData when data prop changes (e.g., new CV analyzed)
  useEffect(() => {
    setFormData(data)
    setSkillsInput(data.skills.join(', '))
    setHobbiesInput(data.hobbies.join(', '))
    setCertificationsInput(data.certifications.join(', '))
  }, [data])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Sauvegarder dans IndexedDB
      await db.settings.put({
        key: 'cv_parsed_data',
        value: formData
      })

      toast.success("CV mis à jour", {
        description: "Vos modifications ont été enregistrées avec succès.",
        duration: 4000,
      })

      onSave?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving CV data:', error)
      toast.error("Erreur de sauvegarde", {
        description: error instanceof Error ? error.message : "Impossible de sauvegarder les modifications.",
        duration: 5000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handlers for basic fields
  const updateField = (field: keyof ParsedCVData, value: string | string[]) => {
    setFormData({ ...formData, [field]: value })
  }

  // Handlers for experience
  const addExperience = () => {
    setFormData({
      ...formData,
      experience: [...formData.experience, { title: '', company: '', period: '', description: '' }]
    })
  }

  const updateExperience = (index: number, field: string, value: string) => {
    const newExperience = [...formData.experience]
    newExperience[index] = { ...newExperience[index], [field]: value }
    setFormData({ ...formData, experience: newExperience })
  }

  const removeExperience = (index: number) => {
    setFormData({
      ...formData,
      experience: formData.experience.filter((_, i) => i !== index)
    })
  }

  // Handlers for education
  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...formData.education, { degree: '', institution: '', period: '', description: '' }]
    })
  }

  const updateEducation = (index: number, field: string, value: string) => {
    const newEducation = [...formData.education]
    newEducation[index] = { ...newEducation[index], [field]: value }
    setFormData({ ...formData, education: newEducation })
  }

  const removeEducation = (index: number) => {
    setFormData({
      ...formData,
      education: formData.education.filter((_, i) => i !== index)
    })
  }

  // Handlers for languages
  const addLanguage = () => {
    setFormData({
      ...formData,
      languages: [...formData.languages, { name: '', level: '' }]
    })
  }

  const updateLanguage = (index: number, field: string, value: string) => {
    const newLanguages = [...formData.languages]
    newLanguages[index] = { ...newLanguages[index], [field]: value }
    setFormData({ ...formData, languages: newLanguages })
  }

  const removeLanguage = (index: number) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter((_, i) => i !== index)
    })
  }

  // Handlers for skills (array of strings)
  const updateSkills = (value: string) => {
    setSkillsInput(value)
    setFormData(prev => ({ ...prev, skills: value.split(',').map(s => s.trim()).filter(Boolean) }))
  }

  // Handlers for hobbies (array of strings)
  const updateHobbies = (value: string) => {
    setHobbiesInput(value)
    setFormData(prev => ({ ...prev, hobbies: value.split(',').map(s => s.trim()).filter(Boolean) }))
  }

  // Handlers for certifications (array of strings)
  const updateCertifications = (value: string) => {
    setCertificationsInput(value)
    setFormData(prev => ({ ...prev, certifications: value.split(',').map(s => s.trim()).filter(Boolean) }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Modifier le CV complet</DialogTitle>
          <DialogDescription>
            Modifiez tous les champs de votre CV. Les modifications seront sauvegardées dans votre navigateur.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personnel</TabsTrigger>
              <TabsTrigger value="experience">Expérience</TabsTrigger>
              <TabsTrigger value="education">Formation</TabsTrigger>
              <TabsTrigger value="skills">Compétences</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[60vh] mt-4">
              {/* Personal Info Tab */}
              <TabsContent value="personal" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations personnelles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nom complet *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Jean Dupont"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="jean.dupont@example.com"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Téléphone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="+33 6 12 34 56 78"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="about">À propos</Label>
                      <Textarea
                        id="about"
                        value={formData.about}
                        onChange={(e) => updateField('about', e.target.value)}
                        placeholder="Décrivez votre profil professionnel..."
                        rows={5}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Experience Tab */}
              <TabsContent value="experience" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Expériences professionnelles</CardTitle>
                    <CardDescription>
                      Ajoutez ou modifiez vos expériences professionnelles
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.experience.map((exp, index) => (
                      <Card key={index} className="p-4 relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeExperience(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <div className="space-y-3 pr-8">
                          <div>
                            <Label htmlFor={`exp-title-${index}`}>Poste</Label>
                            <Input
                              id={`exp-title-${index}`}
                              value={exp.title}
                              onChange={(e) => updateExperience(index, 'title', e.target.value)}
                              placeholder="Développeur Full-Stack"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`exp-company-${index}`}>Entreprise</Label>
                            <Input
                              id={`exp-company-${index}`}
                              value={exp.company}
                              onChange={(e) => updateExperience(index, 'company', e.target.value)}
                              placeholder="Acme Corp"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`exp-period-${index}`}>Période</Label>
                            <Input
                              id={`exp-period-${index}`}
                              value={exp.period}
                              onChange={(e) => updateExperience(index, 'period', e.target.value)}
                              placeholder="Jan 2020 - Déc 2023"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`exp-description-${index}`}>Description</Label>
                            <Textarea
                              id={`exp-description-${index}`}
                              value={typeof exp.description === 'string' ? exp.description : exp.description.join('\n')}
                              onChange={(e) => updateExperience(index, 'description', e.target.value)}
                              placeholder="Décrivez vos missions et réalisations..."
                              rows={4}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addExperience}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter une expérience
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Education Tab */}
              <TabsContent value="education" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Formation</CardTitle>
                    <CardDescription>
                      Ajoutez ou modifiez votre parcours éducatif
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.education.map((edu, index) => (
                      <Card key={index} className="p-4 relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeEducation(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <div className="space-y-3 pr-8">
                          <div>
                            <Label htmlFor={`edu-degree-${index}`}>Diplôme</Label>
                            <Input
                              id={`edu-degree-${index}`}
                              value={edu.degree}
                              onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                              placeholder="Master en Informatique"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`edu-institution-${index}`}>Établissement</Label>
                            <Input
                              id={`edu-institution-${index}`}
                              value={edu.institution}
                              onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                              placeholder="Université de Paris"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`edu-period-${index}`}>Période</Label>
                            <Input
                              id={`edu-period-${index}`}
                              value={edu.period}
                              onChange={(e) => updateEducation(index, 'period', e.target.value)}
                              placeholder="2015 - 2017"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`edu-description-${index}`}>Description</Label>
                            <Textarea
                              id={`edu-description-${index}`}
                              value={edu.description || ''}
                              onChange={(e) => updateEducation(index, 'description', e.target.value)}
                              placeholder="Description de la formation (optionnel)..."
                              rows={3}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addEducation}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter une formation
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Langues</CardTitle>
                    <CardDescription>
                      Ajoutez ou modifiez vos compétences linguistiques
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.languages.map((lang, index) => (
                      <Card key={index} className="p-4 relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeLanguage(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <div className="space-y-3 pr-8 grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`lang-name-${index}`}>Langue</Label>
                            <Input
                              id={`lang-name-${index}`}
                              value={lang.name}
                              onChange={(e) => updateLanguage(index, 'name', e.target.value)}
                              placeholder="Français"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`lang-level-${index}`}>Niveau</Label>
                            <Input
                              id={`lang-level-${index}`}
                              value={lang.level}
                              onChange={(e) => updateLanguage(index, 'level', e.target.value)}
                              placeholder="Natif"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addLanguage}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter une langue
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Skills Tab */}
              <TabsContent value="skills" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Compétences</CardTitle>
                    <CardDescription>
                      Listez vos compétences techniques et professionnelles (séparées par des virgules)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label htmlFor="skills">Compétences</Label>
                      <Textarea
                        id="skills"
                        value={skillsInput}
                        onChange={(e) => updateSkills(e.target.value)}
                        placeholder="React, TypeScript, Node.js, Python..."
                        rows={5}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Séparez chaque compétence par une virgule
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Certifications</CardTitle>
                    <CardDescription>
                      Listez vos certifications professionnelles (séparées par des virgules)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label htmlFor="certifications">Certifications</Label>
                      <Textarea
                        id="certifications"
                        value={certificationsInput}
                        onChange={(e) => updateCertifications(e.target.value)}
                        placeholder="AWS Certified Developer, Scrum Master..."
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Séparez chaque certification par une virgule
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Loisirs</CardTitle>
                    <CardDescription>
                      Listez vos centres d'intérêt et loisirs (séparés par des virgules)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label htmlFor="hobbies">Loisirs</Label>
                      <Textarea
                        id="hobbies"
                        value={hobbiesInput}
                        onChange={(e) => updateHobbies(e.target.value)}
                        placeholder="Photographie, Randonnée, Lecture..."
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Séparez chaque loisir par une virgule
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

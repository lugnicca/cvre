"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/db"
import { toast } from "sonner"
import {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_INSTRUCTION_LIGHT,
  DEFAULT_INSTRUCTION_NORMAL,
  DEFAULT_INSTRUCTION_AGGRESSIVE,
  DEFAULT_STRUCTURE_PROMPT
} from "@/lib/ai/default-prompts"
import { RotateCcw, Save } from "lucide-react"

export function PromptSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [settings, setSettings] = useState({
    retryCount: 3,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    instructionLight: DEFAULT_INSTRUCTION_LIGHT,
    instructionNormal: DEFAULT_INSTRUCTION_NORMAL,
    instructionAggressive: DEFAULT_INSTRUCTION_AGGRESSIVE
  })

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [
          retryCount,
          systemPrompt,
          instructionLight,
          instructionNormal,
          instructionAggressive
        ] = await Promise.all([
          db.settings.get('retry_count'),
          db.settings.get('prompt_system'),
          db.settings.get('prompt_instruction_light'),
          db.settings.get('prompt_instruction_normal'),
          db.settings.get('prompt_instruction_aggressive')
        ])

        setSettings({
          retryCount: retryCount?.value ? Number(retryCount.value) : 3,
          systemPrompt: (systemPrompt?.value as string) || DEFAULT_SYSTEM_PROMPT,
          instructionLight: (instructionLight?.value as string) || DEFAULT_INSTRUCTION_LIGHT,
          instructionNormal: (instructionNormal?.value as string) || DEFAULT_INSTRUCTION_NORMAL,
          instructionAggressive: (instructionAggressive?.value as string) || DEFAULT_INSTRUCTION_AGGRESSIVE
        })
      } catch (error) {
        console.error("Failed to load prompt settings:", error)
        toast.error("Erreur lors du chargement des paramètres de prompts")
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all([
        db.settings.put({ key: 'retry_count', value: settings.retryCount }),
        db.settings.put({ key: 'prompt_system', value: settings.systemPrompt }),
        db.settings.put({ key: 'prompt_instruction_light', value: settings.instructionLight }),
        db.settings.put({ key: 'prompt_instruction_normal', value: settings.instructionNormal }),
        db.settings.put({ key: 'prompt_instruction_aggressive', value: settings.instructionAggressive })
      ])
      toast.success("Paramètres sauvegardés")
    } catch (error) {
      console.error("Failed to save prompt settings:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm("Êtes-vous sûr de vouloir réinitialiser tous les prompts aux valeurs par défaut ?")) return

    setSaving(true)
    try {
      // Delete from DB to revert to defaults (or update with default values)
      await Promise.all([
        db.settings.delete('retry_count'),
        db.settings.delete('prompt_system'),
        db.settings.delete('prompt_instruction_light'),
        db.settings.delete('prompt_instruction_normal'),
        db.settings.delete('prompt_instruction_aggressive')
      ])

      setSettings({
        retryCount: 3,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        instructionLight: DEFAULT_INSTRUCTION_LIGHT,
        instructionNormal: DEFAULT_INSTRUCTION_NORMAL,
        instructionAggressive: DEFAULT_INSTRUCTION_AGGRESSIVE
      })

      toast.success("Paramètres réinitialisés")
    } catch (error) {
      console.error("Failed to reset prompt settings:", error)
      toast.error("Erreur lors de la réinitialisation")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Chargement des paramètres...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium">Prompts & IA</h2>
          <p className="text-sm text-zinc-500">
            Personnalisez les instructions données à l'IA et le comportement du système.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="instructions" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="instructions">Instructions de Mode</TabsTrigger>
          <TabsTrigger value="system">Prompt Système</TabsTrigger>
          <TabsTrigger value="structure">Structure JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="instructions" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Mode Léger (Light)</CardTitle>
              <CardDescription>Optimisation subtile sans changement majeur.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.instructionLight}
                onChange={(e) => setSettings(s => ({ ...s, instructionLight: e.target.value }))}
                className="min-h-[100px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mode Normal</CardTitle>
              <CardDescription>Équilibre entre fidélité et optimisation.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.instructionNormal}
                onChange={(e) => setSettings(s => ({ ...s, instructionNormal: e.target.value }))}
                className="min-h-[100px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mode Agressif (Aggressive)</CardTitle>
              <CardDescription>Optimisation maximale pour le score ATS.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.instructionAggressive}
                onChange={(e) => setSettings(s => ({ ...s, instructionAggressive: e.target.value }))}
                className="min-h-[100px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Système</CardTitle>
              <CardDescription>
                Le prompt principal qui orchestre l'IA. 
                Variables disponibles: {'{jobDescription}'}, {'{cvText}'}, {'{instructions}'}, {'{structure}'}, {'{lang}'}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.systemPrompt}
                onChange={(e) => setSettings(s => ({ ...s, systemPrompt: e.target.value }))}
                className="min-h-[400px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Structure de Sortie (Lecture seule)</CardTitle>
              <CardDescription>
                Le format JSON attendu de l'IA. Ce schéma ne peut pas être modifié pour garantir le fonctionnement de l'application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-950 text-zinc-50 p-4 rounded-md overflow-auto max-h-[500px]">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {DEFAULT_STRUCTURE_PROMPT}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


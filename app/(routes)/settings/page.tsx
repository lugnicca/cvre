'use client'

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"

import {
  OnboardingForm,
  type OnboardingFormData,
  type StoredAiConfig,
  type StoredCvFile,
} from "@/components/onboarding-form"
import { PromptSettings } from "@/components/settings/prompt-settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { toast } from "sonner"
import { db } from "@/lib/db"
import {
  clearEncryptionSecret,
  decryptJson,
  ensureEncryptionSecret,
  type EncryptedPayload,
} from "@/lib/crypto"

import type { Value as PhoneValue } from "react-phone-number-input"

const DEFAULT_FORM_DATA: OnboardingFormData = {
  baseURL: "https://api.openai.com/v1",
  model: "",
  apiKey: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "" as PhoneValue,
}

export default function SettingsPage() {
  const router = useRouter()

  const [initialData, setInitialData] = useState<OnboardingFormData | null>(null)
  const [initialCvFile, setInitialCvFile] = useState<StoredCvFile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const fetchSettingsPayload = useCallback(async () => {
    const [aiConfigEntry, userInfoEntry, cvDataEntry] = await Promise.all([
      db.settings.get('ai_config'),
      db.settings.get('user_info'),
      db.settings.get('cv_data'),
    ])

    const aiConfig = aiConfigEntry?.value as StoredAiConfig | undefined
    const userInfo = userInfoEntry?.value as Partial<OnboardingFormData> | undefined
    const cvFile = cvDataEntry?.value as StoredCvFile | undefined

    let warning: string | null = null
    let decryptedApiKey = ''

    let encryptionSecret: string | null = null
    try {
      encryptionSecret = ensureEncryptionSecret()
    } catch (error) {
      console.error('Error ensuring encryption secret:', error)
      warning =
        "Impossible de retrouver la clé d'encryption locale. Votre clé API devra être ressaisie."
    }

    if (aiConfig?.apiKey) {
      if (typeof aiConfig.apiKey === 'string') {
        decryptedApiKey = aiConfig.apiKey
      } else if (encryptionSecret) {
        try {
          const decrypted = await decryptJson<{ apiKey: string }>(
            aiConfig.apiKey as EncryptedPayload,
            encryptionSecret,
          )
          decryptedApiKey = decrypted.apiKey
        } catch (error) {
          console.error('Error decrypting API key from IndexedDB:', error)
          warning =
            "Impossible de décrypter la clé API enregistrée. Veuillez la renseigner de nouveau."
          decryptedApiKey = ''
        }
      }
    }

    const data: OnboardingFormData = {
      baseURL: aiConfig?.baseURL ?? DEFAULT_FORM_DATA.baseURL,
      model: aiConfig?.model ?? DEFAULT_FORM_DATA.model,
      apiKey: decryptedApiKey,
      firstName: userInfo?.firstName ?? DEFAULT_FORM_DATA.firstName,
      lastName: userInfo?.lastName ?? DEFAULT_FORM_DATA.lastName,
      email: userInfo?.email ?? DEFAULT_FORM_DATA.email,
      phone: (userInfo?.phone ?? DEFAULT_FORM_DATA.phone) as PhoneValue,
    }

    // Show warning toast if there was an issue
    if (warning) {
      toast.warning("Attention", {
        description: warning,
        duration: 5000,
      })
    }

    return {
      data,
      cvFile: cvFile ?? null,
    }
  }, [])

  useEffect(() => {
    let isActive = true

    const load = async () => {
      setIsLoading(true)
      try {
        const result = await fetchSettingsPayload()
        if (!isActive) return
        setInitialData(result.data)
        setInitialCvFile(result.cvFile)
      } catch (error) {
        console.error('Error loading settings data from IndexedDB:', error)
        if (isActive) {
          setInitialData(DEFAULT_FORM_DATA)
          setInitialCvFile(null)
          toast.error("Erreur de chargement", {
            description: "Impossible de charger les données existantes. Merci de reconfigurer vos paramètres.",
            duration: 5000,
          })
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [fetchSettingsPayload])

  const reloadData = useCallback(async () => {
    try {
      const result = await fetchSettingsPayload()
      setInitialData(result.data)
      setInitialCvFile(result.cvFile)
    } catch (error) {
      console.error('Error refreshing settings data from IndexedDB:', error)
    }
  }, [fetchSettingsPayload])

  const handleResetData = async () => {
    setIsClearing(true)
    try {
      await db.transaction('rw', db.settings, async () => {
        await db.settings.delete('onboarding_completed')
        await db.settings.delete('ai_config')
        await db.settings.delete('user_info')
        await db.settings.delete('cv_data')
      })
      clearEncryptionSecret()
      setShowConfirm(false)
      toast.success("Données locales supprimées", {
        description: "La configuration sera relancée. Redirection en cours...",
        duration: 3000,
      })
      router.replace('/onboarding')
    } catch (error) {
      console.error('Error clearing local onboarding data:', error)
      toast.error("Suppression impossible", {
        description: error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la réinitialisation.",
        duration: 5000,
      })
    } finally {
      setIsClearing(false)
    }
  }

  if (isLoading || !initialData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <Navbar />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-12 px-6">
        {/* Header Section */}
        <section className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Paramètres
          </h1>
          <p className="text-muted-foreground text-lg">
            Gérez votre configuration IA et vos informations personnelles.
          </p>
        </section>

        {/* Unified Card */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Configuration IA & Informations</CardTitle>
            <CardDescription>Gérez votre clé API et vos informations de base</CardDescription>
          </CardHeader>
          {/* Settings Form */}
          <div className="p-6 pt-0">
            <OnboardingForm
              key={initialCvFile ? `${initialCvFile.name}-${initialCvFile.size}` : 'no-cv'}
              mode="settings"
              initialData={initialData}
              initialCvFile={initialCvFile}
              onSuccess={reloadData}
            />
          </div>
        </Card>

        {/* Prompts Settings */}
        <Card className="overflow-hidden">
          <div className="p-6">
            <PromptSettings />
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="overflow-hidden border-red-200 dark:border-red-800">
          <div className="bg-red-50/30 dark:bg-red-900/10">
            <div className="px-6 py-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                  Zone dangereuse
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Actions irréversibles qui suppriment toutes vos données locales.
                </p>
              </div>

              <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      Réinitialiser toutes les données
                    </p>
                    <p className="text-xs text-red-800 dark:text-red-200">
                      Cette action supprimera définitivement :
                    </p>
                    <ul className="text-xs text-red-800 dark:text-red-200 list-disc list-inside space-y-1 ml-2">
                      <li>Configuration de l&apos;API IA</li>
                      <li>Informations personnelles</li>
                      <li>CV téléchargés et analysés</li>
                      <li>Historique des optimisations</li>
                      <li>Prompts personnalisés</li>
                    </ul>
                    <p className="text-xs text-red-800 dark:text-red-200 font-medium pt-2">
                      Vous devrez repasser par l&apos;onboarding complet.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={() => setShowConfirm(true)}
                className="w-full sm:w-auto"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Supprimer toutes les données
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Confirmer la réinitialisation</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cette opération supprimera définitivement toutes les données enregistrées localement et relancera la configuration.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={isClearing}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetData}
                disabled={isClearing}
              >
                {isClearing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  "Supprimer"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


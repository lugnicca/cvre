'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxEmpty,
  ComboboxIcon,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
} from '@/components/ui/base-combobox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/base-input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/base-phone-input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useFileUpload, type FileMetadata } from '@/hooks/use-file-upload'
import { Loader2, CheckCircle2, AlertCircle, Upload, X } from 'lucide-react'
import type { Value as PhoneValue } from 'react-phone-number-input'

import { encryptJson, ensureEncryptionSecret, type EncryptedPayload } from '@/lib/crypto'
import { db, type CVAnalysisStatus, type ParsedCVData } from '@/lib/db'
import { analyzeCVFile, getCVAnalysisStatus, type UserInfo } from '@/lib/cv-analysis'
import { EditFullCVModal } from '@/components/edit-full-cv-modal'

interface Model {
  id: string
  created: number
  owned_by: string
}

const ANTHROPIC_MODELS: Model[] = [
  { id: 'claude-3-5-sonnet-20241022', created: 1729728000, owned_by: 'anthropic' },
  { id: 'claude-3-5-sonnet-20240620', created: 1718841600, owned_by: 'anthropic' },
  { id: 'claude-3-opus-20240229', created: 1709251200, owned_by: 'anthropic' },
  { id: 'claude-3-sonnet-20240229', created: 1709251200, owned_by: 'anthropic' },
  { id: 'claude-3-haiku-20240307', created: 1709856000, owned_by: 'anthropic' },
]

type RawModel = {
  id?: string
  name?: string
  created?: number
  created_at?: number
  owned_by?: string
  organization?: string
  provider?: string
  [key: string]: unknown
}

const isRawModel = (value: unknown): value is RawModel =>
  typeof value === 'object' && value !== null

const extractModelsFromPayload = (payload: unknown): RawModel[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isRawModel)
  }

  if (typeof payload === 'object' && payload !== null) {
    const record = payload as Record<string, unknown>

    const directData = record.data
    if (Array.isArray(directData)) {
      return directData.filter(isRawModel)
    }

    const directModels = record.models
    if (Array.isArray(directModels)) {
      return directModels.filter(isRawModel)
    }

    if (directData && typeof directData === 'object') {
      const nestedRecord = directData as Record<string, unknown>
      const nestedModels = nestedRecord.models
      if (Array.isArray(nestedModels)) {
        return nestedModels.filter(isRawModel)
      }
    }
  }

  return []
}

export interface StoredCvFile {
  name: string
  size: number
  type: string
  dataUrl: string
}

export interface StoredAiConfig {
  baseURL: string
  model: string
  apiKey: EncryptedPayload | string
}

export interface OnboardingFormData {
  baseURL: string
  model: string
  apiKey: string

  firstName: string
  lastName: string
  email: string
  phone: PhoneValue
}

export type OnboardingFormMode = 'onboarding' | 'settings'

export interface OnboardingFormProps {
  mode: OnboardingFormMode
  initialData?: Partial<OnboardingFormData>
  initialCvFile?: StoredCvFile | null
  onSuccess?: () => void
}

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string) ?? '')
    reader.onerror = () => reject(reader.error ?? new Error('Échec de la lecture du fichier.'))
    reader.onabort = () => reject(new Error('La lecture du fichier a été annulée.'))
    reader.readAsDataURL(file)
  })
}

export function OnboardingForm({
  mode,
  initialData,
  initialCvFile,
  onSuccess,
}: OnboardingFormProps) {
  const [formData, setFormData] = useState<OnboardingFormData>({
    baseURL: 'https://api.openai.com/v1',
    model: '',
    apiKey: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '' as PhoneValue,
  })

  const [availableModels, setAvailableModels] = useState<Model[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [retryCount, setRetryCount] = useState(3)
  // Local query for the model search input
  const [modelQuery, setModelQuery] = useState('')
  const [isModelFocused, setIsModelFocused] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isSaving, setIsSaving] = useState(false)
  const [cvAnalysisStatus, setCvAnalysisStatus] = useState<CVAnalysisStatus | null>(null)
  const [isAnalyzingCV, setIsAnalyzingCV] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [parsedCVData, setParsedCVData] = useState<ParsedCVData | null>(null)

  const initialFileMetadata: FileMetadata[] = useMemo(
    () =>
      initialCvFile && initialCvFile.dataUrl
        ? [
            {
              id: `stored-cv-${initialCvFile.name}`,
              name: initialCvFile.name,
              size: initialCvFile.size,
              type: initialCvFile.type || 'application/pdf',
              url: initialCvFile.dataUrl,
            },
          ]
        : [],
    [initialCvFile]
  )

  const [{ files, errors: fileErrors }, { removeFile, openFileDialog, getInputProps }] = useFileUpload({
    accept: '.pdf,application/pdf',
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    initialFiles: initialFileMetadata,
    onFilesAdded: () => {
      // Reset analysis status and parsed data when a new file is uploaded
      setCvAnalysisStatus(null)
      setParsedCVData(null)
    },
  })

  useEffect(() => {
    const loadRetryCount = async () => {
      const retry = await db.settings.get('retry_count')
      if (retry?.value) {
        setRetryCount(Number(retry.value))
      }
    }
    loadRetryCount()
  }, [])

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        baseURL: initialData.baseURL ?? prev.baseURL,
        model: initialData.model ?? prev.model,
        apiKey: initialData.apiKey ?? prev.apiKey,
        firstName: initialData.firstName ?? prev.firstName,
        lastName: initialData.lastName ?? prev.lastName,
        email: initialData.email ?? prev.email,
        phone: (initialData.phone ?? prev.phone) as PhoneValue,
      }))
    }
  }, [initialData])

  // Load CV analysis status and parsed data on mount
  useEffect(() => {
    const loadAnalysisStatus = async () => {
      const status = await getCVAnalysisStatus()
      setCvAnalysisStatus(status)

      // Load parsed CV data if available
      const parsed = await db.settings.get('cv_parsed_data')
      if (parsed?.value) {
        setParsedCVData(parsed.value as ParsedCVData)
      }
    }
    void loadAnalysisStatus()
  }, [])

  const fetchModels = useCallback(
    async (apiKey: string, baseURL: string) => {
      if (!apiKey || apiKey.trim().length === 0) {
        setAvailableModels([])
        setModelsError(null)
        return
      }

      setIsLoadingModels(true)
      setModelsError(null)
      try {
        const trimmedBaseURL = baseURL?.trim() || 'https://api.openai.com/v1'
        const normalizedBaseURL = trimmedBaseURL.endsWith('/') ? trimmedBaseURL.slice(0, -1) : trimmedBaseURL
        const modelsEndpoint = `${normalizedBaseURL}/models`
        const isAnthropic = normalizedBaseURL.includes('anthropic.com')
        const isOpenRouter = normalizedBaseURL.includes('openrouter.ai')

        if (isAnthropic) {
          setAvailableModels(ANTHROPIC_MODELS)
          setFormData((prev) => {
            if (!prev.model && ANTHROPIC_MODELS.length > 0) {
              return { ...prev, model: ANTHROPIC_MODELS[0].id }
            }
            return prev
          })
          return
        }

        const headers: Record<string, string> = {
          Authorization: `Bearer ${apiKey}`,
        }

        if (isOpenRouter) {
          headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'https://cvre.app'
          headers['X-Title'] = 'CVre'
        }

        const response = await fetch(modelsEndpoint, {
          headers,
        })

        if (!response.ok) {
          let errorMessage = `Erreur ${response.status}: Échec de la récupération des modèles`
          try {
            const errorData = await response.json()
            errorMessage = errorData.error?.message || errorData.error || errorMessage
          } catch {
            const errorText = await response.text().catch(() => '')
            if (errorText) {
              errorMessage = `Erreur ${response.status}: ${errorText.substring(0, 150)}`
            }
          }
          setModelsError(errorMessage)
          setAvailableModels([])
          return
        }

        const rawResponse = await response.text()
        let parsedData: unknown
        try {
          parsedData = JSON.parse(rawResponse)
        } catch (parseError) {
          console.error('Error parsing models response:', parseError, rawResponse.substring(0, 500))
          setModelsError('Réponse invalide du fournisseur. Impossible de lire la liste des modèles.')
          setAvailableModels([])
          return
        }

        const modelsList = extractModelsFromPayload(parsedData)

        if (modelsList.length === 0) {
          setModelsError('Aucun modèle disponible')
          setAvailableModels([])
          return
        }

        const models = modelsList
          .map((model, index) => {
            const modelId =
              (typeof model.id === 'string' && model.id) ||
              (typeof model.name === 'string' && model.name) ||
              `model-${index}`

            if (!modelId || modelId === 'unknown') {
              console.warn(`Model at index ${index} has no valid ID:`, model)
              return null
            }
            return {
              id: modelId,
              created:
                (typeof model.created === 'number' && model.created) ||
                (typeof model.created_at === 'number' && model.created_at) ||
                0,
              owned_by:
                (typeof model.owned_by === 'string' && model.owned_by) ||
                (typeof model.organization === 'string' && model.organization) ||
                (typeof model.provider === 'string' && model.provider) ||
                'unknown',
            }
          })
          .filter((model: Model | null): model is Model => model !== null && model.id !== 'unknown')
          .sort((a: Model, b: Model) => {
            if (!isOpenRouter) {
              if (a.id.includes('gpt') && !b.id.includes('gpt')) return -1
              if (!a.id.includes('gpt') && b.id.includes('gpt')) return 1
            }
            return b.created - a.created
          })

        setAvailableModels(models)
        setModelsError(null)

        if (models.length > 0) {
          setFormData((prev) => {
            if (!prev.model) {
              return { ...prev, model: models[0].id }
            }
            return prev
          })
        } else {
          setModelsError('Aucun modèle disponible')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des modèles'
        setModelsError(errorMessage)
        setAvailableModels([])
      } finally {
        setIsLoadingModels(false)
      }
    },
    [],
  )

  // Aucun besoin de réinitialiser une valeur de recherche contrôlée

  // Timer for debounced model fetching
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!formData.apiKey || formData.apiKey.trim().length === 0) {
      setAvailableModels([])
      setModelsError(null)
      return
    }

    setModelsError(null)

    debounceTimerRef.current = setTimeout(() => {
      fetchModels(formData.apiKey, formData.baseURL)
    }, 800)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [formData.apiKey, formData.baseURL, fetchModels])

  const handleReloadParsedData = async () => {
    // Reload the parsed CV data from IndexedDB
    const parsed = await db.settings.get('cv_parsed_data')
    if (parsed?.value) {
      setParsedCVData(parsed.value as ParsedCVData)
      toast.success("Données rechargées", {
        description: "Les modifications ont été prises en compte.",
        duration: 3000,
      })
    }
  }

  const handleCVAnalysis = async (file: File) => {
    if (!formData.apiKey || !formData.model) {
      toast.warning("Configuration IA requise", {
        description: "Veuillez d'abord configurer votre API IA pour analyser le CV.",
        duration: 4000,
      })
      return
    }

    setIsAnalyzingCV(true)
    try {
      const aiConfig = {
        baseURL: formData.baseURL,
        model: formData.model,
        apiKey: formData.apiKey,
      }

      // Build user info object from form data
      const userInfo: UserInfo = {
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      }

      await analyzeCVFile(file, aiConfig, (status) => {
        setCvAnalysisStatus(status)
      }, userInfo)

      // Load the parsed CV data after analysis
      const parsed = await db.settings.get('cv_parsed_data')
      if (parsed?.value) {
        setParsedCVData(parsed.value as ParsedCVData)
      }

      toast.success("CV analysé avec succès", {
        description: "Les informations de votre CV ont été extraites et structurées.",
        duration: 4000,
      })
    } catch (error) {
      console.error('Error analyzing CV:', error)
      toast.error("Erreur d'analyse", {
        description: error instanceof Error ? error.message : "Impossible d'analyser le CV.",
        duration: 5000,
      })
    } finally {
      setIsAnalyzingCV(false)
    }
  }

  const testConnection = async () => {
    if (!formData.apiKey) {
      toast.error("Clé API manquante", {
        description: "Veuillez entrer votre clé API.",
        duration: 4000,
      })
      return
    }

    if (!formData.model) {
      toast.error("Modèle manquant", {
        description: "Veuillez sélectionner un modèle.",
        duration: 4000,
      })
      return
    }

    setIsTestingConnection(true)
    setConnectionStatus('idle')

    try {
      const trimmedBaseURL = formData.baseURL?.trim() || 'https://api.openai.com/v1'
      const normalizedBaseURL = trimmedBaseURL.endsWith('/') ? trimmedBaseURL.slice(0, -1) : trimmedBaseURL
      const isAnthropic = normalizedBaseURL.includes('anthropic.com')
      const isOpenRouter = normalizedBaseURL.includes('openrouter.ai')

      let response: Response
      let endpointUsed = ''

      if (isAnthropic) {
        endpointUsed = `${normalizedBaseURL}/messages`
        response = await fetch(endpointUsed, {
          method: 'POST',
          headers: {
            'x-api-key': formData.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: formData.model,
            max_tokens: 1,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'ping',
                  },
                ],
              },
            ],
          }),
        })
      } else {
        endpointUsed = `${normalizedBaseURL}/chat/completions`
        const headers: Record<string, string> = {
          Authorization: `Bearer ${formData.apiKey}`,
          'Content-Type': 'application/json',
        }

        if (isOpenRouter) {
          headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'https://cvre.app'
          headers['X-Title'] = 'CVre'
        }

        response = await fetch(endpointUsed, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: formData.model,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5,
          }),
        })
      }

      const responseText = await response.text()

      if (!response.ok) {
        let errorMessage = 'Échec du test de connexion'
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error?.message || errorData.error || errorMessage
        } catch {
          if (responseText) {
            errorMessage = `${response.status} ${response.statusText}: ${responseText.substring(0, 200)}`
          } else if (response.statusText) {
            errorMessage = `${response.status} ${response.statusText}`
          }
        }

        throw new Error(`${errorMessage} (endpoint: ${endpointUsed})`)
      }

      if (responseText) {
        try {
          const parsed = JSON.parse(responseText)
          if (parsed.error) {
            throw new Error(
              typeof parsed.error === 'string' ? parsed.error : parsed.error.message || 'Erreur renvoyée par le fournisseur',
            )
          }
        } catch (parseSuccessError) {
          if (parseSuccessError instanceof Error && parseSuccessError.message.startsWith('Unexpected')) {
            console.warn('Réponse non JSON lors du test de connexion (probablement streaming).', parseSuccessError)
          } else if (parseSuccessError instanceof Error) {
            throw parseSuccessError
          }
        }
      }

      setConnectionStatus('success')
      toast.success("Connexion réussie", {
        description: "Votre configuration IA fonctionne correctement.",
        duration: 4000,
      })
    } catch (error) {
      setConnectionStatus('error')
      toast.error("Échec de la connexion", {
        description: error instanceof Error ? error.message : "Impossible de se connecter au fournisseur IA.",
        duration: 5000,
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSaving) {
      return
    }

    if (!formData.apiKey || !formData.model) {
      toast.error("Configuration IA incomplète", {
        description: "Veuillez remplir tous les champs de configuration IA.",
        duration: 4000,
      })
      return
    }

    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Informations personnelles incomplètes", {
        description: "Veuillez remplir tous les champs obligatoires.",
        duration: 4000,
      })
      return
    }

    if (files.length === 0) {
      toast.error("CV manquant", {
        description: "Veuillez uploader votre CV.",
        duration: 4000,
      })
      return
    }

    // Check if CV analysis is completed
    if (!cvAnalysisStatus || cvAnalysisStatus.status !== 'completed') {
      toast.warning("Analyse du CV requise", {
        description: "Veuillez attendre que l'analyse de votre CV soit terminée.",
        duration: 4000,
      })
      return
    }

    const fileEntry = files[0]?.file
    let cvFileData: StoredCvFile | null = null

    if (fileEntry instanceof File) {
      const dataUrl = await readFileAsDataURL(fileEntry)
      cvFileData = {
        name: fileEntry.name,
        size: Number(fileEntry.size),
        type: fileEntry.type || 'application/pdf',
        dataUrl,
      }
    } else if (fileEntry && typeof fileEntry === 'object') {
      const metadata = fileEntry as FileMetadata
      if (!metadata.url) {
        toast.error("CV invalide", {
          description: "Impossible de lire le fichier sélectionné. Veuillez réessayer.",
          duration: 5000,
        })
        return
      }
      cvFileData = {
        name: metadata.name,
        size: Number(metadata.size),
        type: metadata.type || 'application/pdf',
        dataUrl: metadata.url,
      }
    }

    if (!cvFileData) {
      toast.error("CV invalide", {
        description: "Impossible de lire le fichier sélectionné. Veuillez réessayer.",
        duration: 5000,
      })
      return
    }

    setIsSaving(true)

    try {
      const encryptionSecret = ensureEncryptionSecret()
      const encryptedApiKey = await encryptJson(
        {
          apiKey: formData.apiKey,
        },
        encryptionSecret,
      )

      await db.transaction('rw', db.settings, async () => {
        await db.settings.put({
          key: 'onboarding_completed',
          value: true,
        })

        await db.settings.put({
          key: 'ai_config',
          value: {
            baseURL: formData.baseURL,
            model: formData.model,
            apiKey: encryptedApiKey,
          } satisfies StoredAiConfig,
        })

          await db.settings.put({
          key: 'user_info',
          value: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone ?? null,
          },
        })

        await db.settings.put({
          key: 'retry_count',
          value: retryCount
        })

        await db.settings.put({
          key: 'cv_data',
          value: cvFileData,
        })
      })

      toast.success(
        mode === 'onboarding' ? "Configuration terminée" : "Paramètres mis à jour",
        {
          description:
            mode === 'onboarding'
              ? "Bienvenue ! Redirection vers le dashboard..."
              : "Vos informations ont été enregistrées avec succès.",
          duration: 4000,
        }
      )

      onSuccess?.()
    } catch (error) {
      console.error('Error saving onboarding data to IndexedDB:', error)
      const defaultMessage = "Impossible d'enregistrer vos informations. Veuillez réessayer."
      const description =
        error instanceof Error && error.message ? error.message : defaultMessage
      toast.error("Enregistrement impossible", {
        description,
        duration: 5000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const filteredModels = modelQuery
    ? availableModels.filter((m) => m.id.toLowerCase().includes(modelQuery.toLowerCase()))
    : availableModels

  const submitLabel = mode === 'onboarding' ? 'Terminer la configuration' : 'Enregistrer les paramètres'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">1</Badge>
            Configuration IA
          </CardTitle>
          <CardDescription>
            Configurez votre accès à l&apos;API de votre choix
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="baseURL">Base URL *</Label>
            <Input
              id="baseURL"
              type="url"
              placeholder="Exemples : https://api.openai.com/v1, https://openrouter.ai/api/v1"
              value={formData.baseURL}
              onChange={(e) => {
                const newUrl = e.target.value
                setFormData((prev) => ({ ...prev, baseURL: newUrl }))
              }}
            />
            <p className="text-xs text-muted-foreground">
              Défaut : https://api.openai.com/v1. Pour OpenRouter, utilisez https://openrouter.ai/api/v1.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">Clé API *</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={formData.apiKey}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
                setConnectionStatus('idle')
              }}
            />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Votre clé API n&apos;est pas partagée et reste stockée localement sur votre appareil.
              </p>
              <p className="text-xs text-muted-foreground">
                Les modèles se chargeront automatiquement une fois votre clé API saisie.
              </p>
              {isLoadingModels && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Chargement des modèles...
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modèle *</Label>
            <Combobox
              items={filteredModels.map((model) => ({
                value: model.id,
                label: model.id,
              }))}
              value={formData.model}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, model: String(value) }))
                setModelQuery('')
                setIsModelFocused(false)
              }}
            >
              <ComboboxControl>
                <ComboboxInput
                  placeholder="Rechercher un modèle"
                  value={isModelFocused ? modelQuery : (formData.model || '')}
                  onChange={(e) => setModelQuery(e.target.value)}
                  onFocus={() => setIsModelFocused(true)}
                  onBlur={() => {
                    // On blur, show selected value
                    setIsModelFocused(false)
                    setModelQuery('')
                  }}
                />
                <ComboboxIcon />
              </ComboboxControl>
              <ComboboxContent>
                <ComboboxEmpty>
                  {modelsError
                    ? modelsError
                    : formData.apiKey
                      ? "Aucun modèle trouvé pour cette recherche."
                      : "Entrez une clé API valide pour charger les modèles."}
                </ComboboxEmpty>
                <ComboboxList>
                  {filteredModels.map((model) => (
                    <ComboboxItem key={model.id} value={model.id}>
                      {model.id}
                      <ComboboxItemIndicator>
                        <CheckCircle2 className="h-3 w-3" />
                      </ComboboxItemIndicator>
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {!modelsError && formData.apiKey && filteredModels.length === 0 && !isLoadingModels && (
              <p className="text-xs text-muted-foreground">
                Aucun modèle disponible pour cette clé API.
              </p>
            )}
            {modelsError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {modelsError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="retryCount">Tentatives de régénération (Retry)</Label>
            <Input
              id="retryCount"
              type="number"
              min="0"
              max="5"
              value={retryCount}
              onChange={(e) => setRetryCount(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Nombre de tentatives automatiques en cas d'échec de la réponse IA (Défaut : 3)
            </p>
          </div>

          <Button
            type="button"
            onClick={testConnection}
            disabled={isTestingConnection || !formData.apiKey || !formData.model}
            className="w-full"
          >
            {isTestingConnection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {connectionStatus === 'success' && <CheckCircle2 className="mr-2 h-4 w-4" />}
            {connectionStatus === 'error' && <AlertCircle className="mr-2 h-4 w-4" />}
            Tester la connexion
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">2</Badge>
            Informations personnelles
          </CardTitle>
          <CardDescription>
            Renseignez vos coordonnées pour personnaliser votre CV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                placeholder="Jean"
                value={formData.firstName}
                onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                placeholder="Dupont"
                value={formData.lastName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="jean.dupont@example.com"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <PhoneInput
              id="phone"
              value={formData.phone}
              onChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
              defaultCountry="FR"
              international
            />
          </div>

          <div className="space-y-2">
            <Label>CV (PDF) *</Label>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={openFileDialog}
                className="w-full"
                disabled={isAnalyzingCV}
              >
                <Upload className="mr-2 h-4 w-4" />
                {files.length > 0 ? 'Changer le CV' : 'Uploader votre CV'}
              </Button>
              <input {...getInputProps()} className="sr-only" />

              {/* Bouton d'état qui remplace le badge */}
              {files.length > 0 && (
                <>
                  {/* État : Analyse en cours */}
                  {isAnalyzingCV && (
                    <Button
                      type="button"
                      disabled
                      className="w-full"
                      variant="outline"
                    >
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {cvAnalysisStatus?.status === 'extracting' && `Extraction du PDF... ${cvAnalysisStatus.progress}%`}
                      {cvAnalysisStatus?.status === 'analyzing' && cvAnalysisStatus.progress < 50 && `Validation du document... ${cvAnalysisStatus.progress}%`}
                      {cvAnalysisStatus?.status === 'analyzing' && cvAnalysisStatus.progress >= 50 && `Analyse IA en cours... ${cvAnalysisStatus.progress}%`}
                      {!cvAnalysisStatus && 'Analyse en cours...'}
                    </Button>
                  )}

                  {/* État : Non analysé - Bouton pour lancer l'analyse */}
                  {!isAnalyzingCV && cvAnalysisStatus?.status !== 'completed' && cvAnalysisStatus?.status !== 'error' && (
                    <Button
                      type="button"
                      onClick={() => {
                        const file = files[0]?.file
                        if (file instanceof File) {
                          void handleCVAnalysis(file)
                        }
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Loader2 className="mr-2 h-4 w-4" />
                      Analyser le CV avec l&apos;IA
                    </Button>
                  )}

                  {/* État : Erreur - Bouton pour réessayer */}
                  {cvAnalysisStatus?.status === 'error' && !isAnalyzingCV && (
                    <div className="space-y-2">
                      <div className="text-xs text-destructive p-2 bg-destructive/10 rounded">
                        <p className="font-medium flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Erreur d&apos;analyse
                        </p>
                        <p className="mt-1">{cvAnalysisStatus.error || "Erreur lors de l'analyse du CV"}</p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          const file = files[0]?.file
                          if (file instanceof File) {
                            void handleCVAnalysis(file)
                          }
                        }}
                        className="w-full"
                        variant="outline"
                      >
                        <Loader2 className="mr-2 h-4 w-4" />
                        Réessayer l&apos;analyse
                      </Button>
                    </div>
                  )}

                  {/* État : Complété */}
                  {cvAnalysisStatus?.status === 'completed' && !isAnalyzingCV && (
                    <>
                      <Button
                        type="button"
                        disabled
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        CV analysé et structuré ✓
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditModalOpen(true)}
                        className="w-full"
                      >
                        Modifier les champs du CV
                      </Button>
                    </>
                  )}
                </>
              )}

              {files.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {files[0].file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(Number(files[0].file.size) / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(files[0].id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {fileErrors.length > 0 && (
                <div className="text-sm text-destructive">
                  {fileErrors.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              )}

              {files.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Format accepté : PDF (max 10MB)
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSaving || isAnalyzingCV || cvAnalysisStatus?.status !== 'completed'}
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enregistrement...
          </>
        ) : isAnalyzingCV ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyse du CV en cours...
          </>
        ) : cvAnalysisStatus?.status !== 'completed' && files.length > 0 ? (
          <>
            <AlertCircle className="mr-2 h-4 w-4" />
            Analyse du CV requise
          </>
        ) : (
          submitLabel
        )}
      </Button>

      {/* Modal d'édition complète du CV */}
      {parsedCVData && (
        <EditFullCVModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          data={parsedCVData}
          onSave={handleReloadParsedData}
        />
      )}
    </form>
  )
}

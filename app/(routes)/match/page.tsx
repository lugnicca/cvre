'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { toast } from "sonner"
import { Loader2, Globe, FileText, CheckCircle2, Sparkles, AlertCircle, Trash2 } from "lucide-react"
import { db } from "@/lib/db"
import { decryptJson, ensureEncryptionSecret, type EncryptedPayload } from "@/lib/crypto"
import type { StoredAiConfig } from "@/components/onboarding-form"
import { useUIStore } from "@/lib/store"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Language = 'fr' | 'en'
type MatchMode = 'light' | 'normal' | 'aggressive'

export default function MatchPage() {
  const [jobDescription, setJobDescription] = useState('')
  const [url, setUrl] = useState('')
  const [isScraping, setIsScraping] = useState(false)
  const [language, setLanguage] = useState<Language>('fr')
  const [matchMode, setMatchMode] = useState<MatchMode>('normal')
  const [aiConfig, setAiConfig] = useState<{ baseURL: string; model: string; apiKey: string } | null>(null)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)

  // Load saved form data from localStorage on mount
  useEffect(() => {
    try {
      const savedUrl = localStorage.getItem('match_page_url')
      const savedJobDescription = localStorage.getItem('match_page_job_description')

      if (savedUrl) {
        setUrl(savedUrl)
      }
      if (savedJobDescription) {
        setJobDescription(savedJobDescription)
      }
    } catch (error) {
      console.error('Error loading saved form data:', error)
    }
  }, [])

  // Save URL to localStorage when it changes
  useEffect(() => {
    try {
      if (url) {
        localStorage.setItem('match_page_url', url)
      } else {
        localStorage.removeItem('match_page_url')
      }
    } catch (error) {
      console.error('Error saving URL to localStorage:', error)
    }
  }, [url])

  // Save job description to localStorage when it changes
  useEffect(() => {
    try {
      if (jobDescription) {
        localStorage.setItem('match_page_job_description', jobDescription)
      } else {
        localStorage.removeItem('match_page_job_description')
      }
    } catch (error) {
      console.error('Error saving job description to localStorage:', error)
    }
  }, [jobDescription])

  // Load AI config from IndexedDB
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const aiConfigEntry = await db.settings.get('ai_config')
        const storedConfig = aiConfigEntry?.value as StoredAiConfig | undefined

        if (!storedConfig) {
          setIsLoadingConfig(false)
          return
        }

        let decryptedApiKey = ''
        if (typeof storedConfig.apiKey === 'string') {
          decryptedApiKey = storedConfig.apiKey
        } else {
          try {
            const encryptionSecret = ensureEncryptionSecret()
            const decrypted = await decryptJson<{ apiKey: string }>(
              storedConfig.apiKey as EncryptedPayload,
              encryptionSecret
            )
            decryptedApiKey = decrypted.apiKey
          } catch (error) {
            console.error('Error decrypting API key:', error)
          }
        }

        setAiConfig({
          baseURL: storedConfig.baseURL,
          model: storedConfig.model,
          apiKey: decryptedApiKey,
        })
      } catch (error) {
        console.error('Error loading AI config:', error)
      } finally {
        setIsLoadingConfig(false)
      }
    }

    void loadConfig()
  }, [])

  const handleClearForm = useCallback(() => {
    setUrl('')
    setJobDescription('')
    localStorage.removeItem('match_page_url')
    localStorage.removeItem('match_page_job_description')
    toast.success("Formulaire effacé", {
      description: "Vous pouvez commencer une nouvelle candidature.",
      duration: 3000,
    })
  }, [])

  const handleScrapeUrl = useCallback(async () => {
    if (!url.trim()) {
      toast.error("URL manquante", {
        description: "Veuillez entrer une URL à analyser.",
        duration: 4000,
      })
      return
    }

    if (!aiConfig) {
      toast.error("Configuration manquante", {
        description: "Veuillez configurer votre API IA dans les paramètres.",
        duration: 4000,
      })
      return
    }

    setIsScraping(true)
    try {
      // Step 1: Scrape the URL directly from client
      let scrapedText = ''
      
      try {
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const html = await response.text()
        
        // Import cleaner dynamically
        const { cleanAndFormatHtml } = await import('@/lib/client-scraper')
        scrapedText = cleanAndFormatHtml(html)
        
      } catch (fetchError) {
        // Check if it's likely a CORS error (TypeError: Failed to fetch)
        const isCorsError = fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')
        
        if (isCorsError) {
          toast.error("Accès bloqué par le site (CORS)", {
            description: "Ce site empêche la lecture automatique. Installez une extension 'CORS Unblock' ou copiez le texte manuellement.",
            duration: 8000,
            action: {
              label: "Compris",
              onClick: () => console.log("User acknowledged CORS error")
            }
          })
          throw new Error("Blocage CORS détecté. Essayez de copier-coller le texte.")
        }
        
        throw fetchError
      }

      if (!scrapedText || scrapedText.length < 50) {
        throw new Error('Impossible d\'extraire du contenu de cette URL')
      }

      // Step 2: Analyze with AI locally (client-side)
      const { analyzeJobPosting } = await import('@/lib/ai/analyze')
      
      const analysis = await analyzeJobPosting(
        scrapedText,
        aiConfig.baseURL,
        aiConfig.model,
        aiConfig.apiKey
      )

      if (analysis.isJobPosting && analysis.confidence > 0.6) {
        setJobDescription(analysis.summary || scrapedText)
        toast.success("Offre détectée", {
          description: `Confiance: ${Math.round(analysis.confidence * 100)}%. L'offre a été chargée.`,
          duration: 4000,
        })
      } else {
        toast.warning("Pas une offre d'emploi", {
          description: analysis.summary || "Le contenu ne semble pas être une offre d'emploi.",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Error scraping URL:', error)
      toast.error("Erreur de scraping", {
        description: error instanceof Error ? error.message : "Impossible de récupérer l'offre.",
        duration: 5000,
      })
    } finally {
      setIsScraping(false)
    }
  }, [url, aiConfig])

  const { optimizationStatus, setOptimizationStatus } = useUIStore()

  const handleOptimize = useCallback(async () => {
    if (jobDescription.length < 100) {
      toast.error("Description trop courte", {
        description: "L'offre doit contenir au moins 100 caractères.",
        duration: 4000,
      })
      return
    }

    if (!aiConfig) {
      toast.error("Configuration manquante", {
        description: "Veuillez configurer votre API IA dans les paramètres.",
        duration: 4000,
      })
      return
    }

    setOptimizationStatus('analyzing')
    // Keep toast for page transitions or if user navigates away, but UI will show status on button
    const loadingToast = toast.loading("Démarrage de l'optimisation...", {
      description: "Analyse de l'offre en cours.",
    })

    try {
      // Get user's parsed CV from IndexedDB
      const cvParsedDataEntry = await db.settings.get('cv_parsed_data')
      const parsedCV = cvParsedDataEntry?.value

      if (!parsedCV) {
        toast.error("Aucun CV trouvé", {
          description: "Veuillez d'abord créer ou importer un CV dans les paramètres.",
          duration: 5000,
        })
        setOptimizationStatus('idle')
        return
      }

      // Step 1: Analyze job details
      toast.message("Analyse de l'offre...", { id: loadingToast }) // Update toast

      const { analyzeJobDetails } = await import('@/lib/ai/analyze')
      const jobDetails = await analyzeJobDetails(
        jobDescription,
        aiConfig.baseURL,
        aiConfig.model,
        aiConfig.apiKey
      )

      // Step 2: Optimize CV
      setOptimizationStatus('optimizing')
      toast.message("Optimisation du CV...", { 
        id: loadingToast,
        description: "Rédaction et adaptation du contenu." 
      })

      const { optimizeCV } = await import('@/lib/ai/cv-optimizer')
      const result = await optimizeCV(
        parsedCV,
        jobDescription,
        matchMode,
        language,
        aiConfig.baseURL,
        aiConfig.model,
        aiConfig.apiKey
      )

      // Save to IndexedDB
      setOptimizationStatus('saving')
      toast.message("Sauvegarde...", { id: loadingToast })

      const optimizedCVEntry = {
        id: `opt_${Date.now()}`,
        jobTitle: jobDetails.jobTitle,
        company: jobDetails.company,
        jobSource: url.trim() ? ('url' as const) : ('paste' as const),
        jobUrl: url.trim() || undefined,
        jobDescription,
        jobDetails,
        originalCV: parsedCV,
        optimizedCV: result.optimizedCV,
        matchMode,
        language,
        matchScore: result.matchScore,
        status: 'optimized' as const,
        changes: result.changes,
        suggestions: result.suggestions,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await db.optimizedCVs.add(optimizedCVEntry)

      toast.success("CV optimisé avec succès !", {
        id: loadingToast,
        description: `Score de matching: ${result.matchScore}%.`,
        duration: 5000,
      })

      // Clear saved form data after successful optimization
      localStorage.removeItem('match_page_url')
      localStorage.removeItem('match_page_job_description')

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        // We reset the status here, before redirecting? 
        // Actually if we redirect, the user sees the dashboard. 
        // But if they come back to this page later, it should be idle.
        setOptimizationStatus('idle')
        window.location.href = '/dashboard'
      }, 1000)
    } catch (error) {
      console.error('Error optimizing CV:', error)
      toast.error("Erreur d'optimisation", {
        id: loadingToast,
        description: error instanceof Error ? error.message : "Impossible d'optimiser le CV.",
        duration: 5000,
      })
      setOptimizationStatus('idle')
    }
  }, [jobDescription, aiConfig, matchMode, language, url, setOptimizationStatus])

  const characterCount = jobDescription.length
  const isValidLength = characterCount >= 100

  if (isLoadingConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!aiConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <Navbar />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-12 px-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Configuration requise
              </CardTitle>
              <CardDescription>
                Vous devez d&apos;abord configurer votre accès à l&apos;API IA dans les paramètres.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/settings">Aller aux paramètres</a>
              </Button>
            </CardContent>
          </Card>
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
            Matcher votre CV
          </h1>
          <p className="text-muted-foreground text-lg">
            Analysez une offre d&apos;emploi et optimisez votre CV pour maximiser vos chances de succès.
          </p>
        </section>

        {/* Unified Card */}
        <Card className="overflow-hidden relative">
          {/* Buttons in top-right corner */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {(url || jobDescription) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearForm}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Effacer
              </Button>
            )}
            {isValidLength && (
              <Badge variant="outline" className="gap-1.5 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 px-3 py-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300 font-medium">Prêt</span>
              </Badge>
            )}
          </div>
          
          {/* Header */}
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 pb-6 pt-6 pr-40">
            <div className="space-y-2">
              <CardTitle className="text-2xl">Analyser une offre d&apos;emploi</CardTitle>
              <CardDescription>
                Importez ou collez le contenu d&apos;une offre pour optimiser votre CV
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-6 space-y-8">
            {/* URL Import (Optional) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <Label htmlFor="url" className="text-sm font-medium">
                    Importer depuis une URL <span className="text-muted-foreground font-normal">(optionnel)</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Le contenu sera automatiquement analysé et chargé ci-dessous
                  </p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Nécessite une extension navigateur "CORS Unblock" pour fonctionner sur la plupart des sites (LinkedIn, etc.)
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/job-posting"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isScraping}
                  className="flex-1"
                />
                <Button
                  onClick={handleScrapeUrl}
                  disabled={isScraping || !url.trim()}
                  size="lg"
                >
                  {isScraping ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyse...
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 h-4 w-4" />
                      Scraper
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <Label htmlFor="jobDescription" className="text-sm font-medium">
                    Contenu de l&apos;offre
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Collez ou modifiez le texte (minimum 100 caractères)
                  </p>
                </div>
              </div>
              <textarea
                id="jobDescription"
                className="w-full min-h-[300px] max-h-[600px] resize-y rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:ring-blue-400 focus-visible:ring-offset-2 transition-all"
                placeholder="Collez ici le texte de l'offre d'emploi...

Exemple:
• Titre du poste
• Description des missions
• Compétences requises
• Expérience demandée
• Avantages"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <div className="flex items-center justify-between px-2">
                <p className={`text-xs font-medium ${isValidLength ? 'text-muted-foreground' : 'text-red-600 dark:text-red-400'}`}>
                  {characterCount} / 100 caractères
                </p>
                {isValidLength && (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    Prêt pour l&apos;analyse
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Options d&apos;optimisation</h3>
                  <p className="text-xs text-muted-foreground">
                    Configurez la langue et l&apos;intensité du matching
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm">
                    Langue de rédaction
                  </Label>
                  <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">🇫🇷 Français</SelectItem>
                      <SelectItem value="en">🇬🇧 Anglais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="matchMode" className="text-sm">
                    Mode de matching
                  </Label>
                  <Select value={matchMode} onValueChange={(value) => setMatchMode(value as MatchMode)}>
                    <SelectTrigger id="matchMode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Léger</SelectItem>
                      <SelectItem value="normal">Normal (Recommandé)</SelectItem>
                      <SelectItem value="aggressive">Agressif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Info card */}
              <div className={`rounded-lg px-4 py-3 ${
                matchMode === 'light' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
                matchMode === 'normal' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' :
                'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
              }`}>
                <p className={`text-xs ${
                  matchMode === 'light' ? 'text-green-800 dark:text-green-200' :
                  matchMode === 'normal' ? 'text-blue-800 dark:text-blue-200' :
                  'text-amber-800 dark:text-amber-200'
                }`}>
                  {matchMode === 'light' && 'Optimise les mots-clés tout en conservant l\'authenticité de votre CV. Idéal pour les candidatures ciblées.'}
                  {matchMode === 'normal' && 'Équilibre entre optimisation ATS et préservation de votre profil. Le meilleur compromis pour la plupart des candidatures.'}
                  {matchMode === 'aggressive' && 'Reformule fortement pour maximiser le score de matching. Utilisez avec prudence - peut altérer significativement votre CV.'}
                </p>
              </div>
            </div>
          </CardContent>

          {/* Footer with CTA */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-4">
            <Button
              size="lg"
              className="w-full h-12 text-base font-medium"
              onClick={handleOptimize}
              disabled={!isValidLength || optimizationStatus !== 'idle'}
            >
              {optimizationStatus === 'idle' ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Optimiser mon CV
                </>
              ) : (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {optimizationStatus === 'analyzing' && 'Analyse de l\'offre...'}
                  {optimizationStatus === 'optimizing' && 'Rédaction du CV...'}
                  {optimizationStatus === 'saving' && 'Finalisation...'}
                </>
              )}
            </Button>
            {!isValidLength && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                Veuillez ajouter au moins 100 caractères pour continuer
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}


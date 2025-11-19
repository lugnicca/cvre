'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles } from "lucide-react"

import { OnboardingForm } from "@/components/onboarding-form"
import { db } from "@/lib/db"

export default function OnboardingPage() {
  const router = useRouter()
  const [isCheckingIndexedDb, setIsCheckingIndexedDb] = useState(true)

  useEffect(() => {
    let isActive = true

    const checkExistingOnboarding = async () => {
      let hasRedirected = false
      try {
        const existing = await db.settings.get('onboarding_completed')
        if (existing?.value === true) {
          hasRedirected = true
          router.replace('/dashboard')
        }
      } catch (error) {
        console.error('Error checking onboarding status in IndexedDB:', error)
      } finally {
        if (isActive && !hasRedirected) {
          setIsCheckingIndexedDb(false)
        }
      }
    }

    void checkExistingOnboarding()

    return () => {
      isActive = false
    }
  }, [router])

  if (isCheckingIndexedDb) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/30">
              <Sparkles className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            Bienvenue sur CVre
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Optimisez votre CV avec l&apos;IA en quelques étapes simples
          </p>
        </div>

        {/* Onboarding Form */}
        <div className="relative">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 rounded-3xl blur-3xl -z-10" />

          <OnboardingForm
            mode="onboarding"
            onSuccess={() => {
              router.replace('/dashboard')
            }}
          />
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            🔒 Toutes vos données restent locales et cryptées sur votre appareil
          </p>
        </div>
      </div>
    </div>
  )
}


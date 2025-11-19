'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { StatCard } from "@/components/ui/stat-card"
import { CVTrackingGrid } from "@/components/cv-tracking-grid"
import {
  FileText,
  MessageSquare,
  Briefcase,
  ArrowRight,
  Clock,
  AlertCircle,
  Target
} from "lucide-react"
import { db } from "@/lib/db"
import type { OptimizedCV } from "@/lib/db"
import Link from "next/link"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    activeCVs: 0,
    pendingOptimizations: 0,
    interviews: 0,
    offers: 0
  })

  const [hasConfig, setHasConfig] = useState(false)
  const [optimizedCVs, setOptimizedCVs] = useState<OptimizedCV[]>([])

  const loadData = async () => {
    try {
      // Check if AI config exists
      const aiConfig = await db.settings.get('ai_config')
      setHasConfig(!!aiConfig?.value)

      // Load actual stats from DB
      const cvDocs = await db.cvDocs.toArray()
      const optimizedCVsList = await db.optimizedCVs.toArray()

      setOptimizedCVs(optimizedCVsList)

      setStats({
        activeCVs: optimizedCVsList.length,
        pendingOptimizations: optimizedCVsList.filter(cv => cv.status === 'optimized').length,
        interviews: optimizedCVsList.filter(cv => cv.status === 'interview').length,
        offers: optimizedCVsList.filter(cv => cv.status === 'offer').length
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        {/* Header Section */}
        <section className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Visualisez l&apos;état de vos candidatures et les optimisations en cours.
          </p>
        </section>

        {/* Stats Grid */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="CVs optimisés"
            value={stats.activeCVs}
            description="Total des CVs adaptés"
            icon={FileText}
            variant="primary"
          />
          <StatCard
            title="En attente d'envoi"
            value={stats.pendingOptimizations}
            description="CVs optimisés non envoyés"
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Entretiens"
            value={stats.interviews}
            description="En cours d'entretien"
            icon={MessageSquare}
            variant="default"
          />
          <StatCard
            title="Offres"
            value={stats.offers}
            description="Offres reçues"
            icon={Briefcase}
            variant="success"
          />
        </section>

        {/* CV Tracking Grid */}
        <Card>
          <CardHeader className="pb-4 pt-6 pl-5 pr-5">
            <div className="flex items-start justify-between gap-4 w-full">
              <div className="space-y-1.5 flex-1">
                <CardTitle className="text-xl font-bold">Suivi des candidatures</CardTitle>
                <CardDescription>
                  Gérez tous vos CVs optimisés et suivez l&apos;état de vos candidatures.
                </CardDescription>
              </div>
              {!hasConfig ? (
                <Button asChild variant="outline" size="sm" className="flex-shrink-0">
                  <Link href="/settings">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Configurer
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm" className="flex-shrink-0">
                  <Link href="/match">
                    <Target className="mr-2 h-4 w-4" />
                    Nouveau Match
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {!hasConfig ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium mb-1">Configuration requise</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Configurez votre API IA dans les paramètres pour commencer à utiliser CVre.
                </p>
                <Button asChild>
                  <Link href="/settings">
                    Aller aux paramètres
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <CVTrackingGrid data={optimizedCVs} onDataChange={loadData} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import {
  FileText,
  Download,
  Edit3,
  CheckCircle2,
  Clock,
  Sparkles,
  Upload
} from "lucide-react"
import { db } from "@/lib/db"
import Link from "next/link"

export default function EditorPage() {
  const [cvDocs, setCvDocs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCVs = async () => {
      try {
        const docs = await db.cvDocs.toArray()
        setCvDocs(docs)
      } catch (error) {
        console.error('Error loading CVs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadCVs()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        {/* Header Section */}
        <section className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Éditeur de CV</h1>
          <p className="text-muted-foreground text-lg">
            Visualisez, éditez et exportez vos CV optimisés.
          </p>
        </section>

        {/* Unified Card */}
        <Card className="overflow-hidden">
          {/* Header with Stats */}
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <CardTitle className="text-2xl mb-4">Vos CV</CardTitle>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{cvDocs.length}</p>
                  <p className="text-xs text-muted-foreground">Enregistrés</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">En édition</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{cvDocs.length}</p>
                  <p className="text-xs text-muted-foreground">Complétés</p>
                </div>
              </div>
            </div>
          </CardHeader>

          {/* CV List */}
          <CardContent className="p-6">
            {isLoading ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">Chargement des CV...</p>
              </div>
            ) : cvDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Aucun CV disponible</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Commencez par télécharger un CV dans les paramètres ou créez une optimisation depuis la page Match.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button asChild>
                    <Link href="/settings">
                      <Upload className="mr-2 h-4 w-4" />
                      Télécharger un CV
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/match">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Créer une optimisation
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {cvDocs.map((cv, index) => (
                  <div
                    key={cv.id}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">{cv.title || `CV #${index + 1}`}</h3>
                          <p className="text-xs text-muted-foreground">
                            Créé le {new Date(cv.createdAt).toLocaleDateString('fr-FR')} •
                            Modifié le {new Date(cv.updatedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="gap-1 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span className="text-green-700 dark:text-green-300">Disponible</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" disabled variant="outline">
                        <Edit3 className="mr-2 h-4 w-4" />
                        Éditer
                        <span className="ml-2 text-xs opacity-60">(Bientôt)</span>
                      </Button>
                      <Button size="sm" variant="outline" disabled>
                        <Download className="mr-2 h-4 w-4" />
                        Exporter
                        <span className="ml-2 text-xs opacity-60">(Bientôt)</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {/* Development Notice Footer */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 bg-blue-50/50 dark:bg-blue-900/20 px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex-shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Fonctionnalité en développement
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                  L&apos;éditeur de CV complet arrive bientôt : édition en temps réel, comparaison original/optimisé, export multi-format, historique des versions et suggestions IA.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}

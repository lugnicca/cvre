'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to onboarding page
    router.push('/onboarding')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">CVre</h1>
        <p className="text-muted-foreground">Redirection...</p>
      </div>
    </div>
  )
}

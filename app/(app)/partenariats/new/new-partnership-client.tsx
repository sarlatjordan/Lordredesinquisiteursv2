'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PartnershipForm } from '@/components/partenariats/partnership-form'
import { createPartnership } from '@/actions/partnerships'
import type { PartnershipInput } from '@/types'
import { AlertCircle } from 'lucide-react'

export function NewPartnershipClient() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(data: PartnershipInput) {
    setError(null)
    startTransition(async () => {
      const result = await createPartnership(data)
      if (result.success) router.push(`/partenariats/${result.data.id}`)
      else setError(result.error)
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      <PartnershipForm onSubmit={handleSubmit} isPending={isPending} onCancel={() => router.push('/partenariats')} />
    </div>
  )
}

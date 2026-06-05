'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PartnershipForm } from '@/components/partenariats/partnership-form'
import { updatePartnership } from '@/actions/partnerships'
import type { PartnershipInput } from '@/types'
import { AlertCircle } from 'lucide-react'

interface EditPartnershipClientProps {
  partnershipId: string
  initialData: PartnershipInput
}

export function EditPartnershipClient({ partnershipId, initialData }: EditPartnershipClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(data: PartnershipInput) {
    setError(null)
    startTransition(async () => {
      const result = await updatePartnership(partnershipId, data)
      if (result.success) {
        router.push(`/partenariats/${partnershipId}`)
        router.refresh()
      } else {
        setError(result.error)
      }
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
      <PartnershipForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isPending={isPending}
        onCancel={() => router.push(`/partenariats/${partnershipId}`)}
      />
    </div>
  )
}

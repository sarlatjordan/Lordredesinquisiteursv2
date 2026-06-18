'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { OpForm } from '@/components/operations/op-form'
import { createOperation } from '@/actions/operations'
import { AvailabilityTips } from '@/components/ui/availability-tips'
import type { OperationCreateInput, Profile } from '@/types'
import { AlertCircle } from 'lucide-react'

interface NewOpClientProps {
  members: Pick<Profile, 'id' | 'username' | 'display_name'>[]
}

export function NewOpClient({ members }: NewOpClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(data: OperationCreateInput) {
    setError(null)
    startTransition(async () => {
      const result = await createOperation(data)
      if (result.success) {
        router.push(`/operations/${result.data.id}`)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      <AvailabilityTips open />
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      <OpForm
        members={members}
        onSubmit={handleSubmit}
        isPending={isPending}
        onCancel={() => router.push('/operations')}
      />
    </div>
  )
}

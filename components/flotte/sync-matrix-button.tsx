'use client'

import { useState, useTransition } from 'react'
import { DatabaseZap, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { syncShipMatrix } from '@/actions/ship-matrix'
import { useQueryClient } from '@tanstack/react-query'

export function SyncMatrixButton() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const queryClient = useQueryClient()

  function handleSync() {
    startTransition(async () => {
      setResult(null)
      const res = await syncShipMatrix()
      if (res.success) {
        setResult({ success: true, message: `${res.data.count} modèles synchronisés` })
        // Invalider le cache des modèles pour que le combobox se rafraîchisse
        queryClient.invalidateQueries({ queryKey: ['ship-models'] })
      } else {
        setResult({ success: false, message: res.error })
      }
    })
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isPending}
              className="gap-1.5 text-xs"
            >
              {isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <DatabaseZap className="h-3.5 w-3.5" />}
              {isPending ? 'Sync RSI…' : 'Sync matrice RSI'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Récupère tous les vaisseaux depuis le Ship Matrix RSI officiel</p>
          </TooltipContent>
        </Tooltip>

        {result && (
          <span className={`flex items-center gap-1 text-xs ${result.success ? 'text-green-400' : 'text-destructive'}`}>
            {result.success
              ? <CheckCircle className="h-3.5 w-3.5" />
              : <AlertCircle className="h-3.5 w-3.5" />}
            {result.message}
          </span>
        )}
      </div>
    </TooltipProvider>
  )
}

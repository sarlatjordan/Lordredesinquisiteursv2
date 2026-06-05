import { Skeleton } from '@/components/ui/skeleton'

export default function MessagesLoading() {
  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Liste des canaux */}
      <div className="w-56 shrink-0 rounded-xl border border-border bg-card p-3 space-y-1">
        <Skeleton className="h-4 w-20 mb-3" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg px-2 py-2">
            <Skeleton className="h-4 w-4 rounded shrink-0" />
            <Skeleton className="h-3.5 flex-1" />
          </div>
        ))}
      </div>

      {/* Zone messages */}
      <div className="flex-1 rounded-xl border border-border bg-card flex flex-col">
        <div className="border-b border-border p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48 mt-1" />
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`flex gap-3 ${i % 3 === 2 ? 'flex-row-reverse' : ''}`}>
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-1.5 max-w-xs">
                <Skeleton className="h-3 w-20" />
                <Skeleton className={`h-10 rounded-xl ${i % 3 === 2 ? 'w-40' : 'w-52'}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border p-3 flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

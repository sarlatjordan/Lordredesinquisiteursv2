'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Owner {
  username: string
  displayName: string
}

interface FlotteOwnerFilterProps {
  owners: Owner[]
  hasOrgShips: boolean
}

export function FlotteOwnerFilter({ owners, hasOrgShips }: FlotteOwnerFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentOwner = searchParams.get('owner') ?? '__all__'

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === '__all__') params.delete('owner')
    else params.set('owner', value)
    router.push(`/flotte?${params.toString()}`)
  }

  return (
    <Select value={currentOwner} onValueChange={handleChange}>
      <SelectTrigger className="w-48 h-8 text-xs">
        <SelectValue placeholder="Tous les pilotes" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">Tous les pilotes</SelectItem>
        {hasOrgShips && (
          <SelectItem value="org">Vaisseaux de la corpo</SelectItem>
        )}
        {owners.map((o) => (
          <SelectItem key={o.username} value={o.username}>
            {o.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

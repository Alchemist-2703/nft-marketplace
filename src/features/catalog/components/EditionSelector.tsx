import { cn } from "@/lib/utils"
import type { NftEdition } from "@/types/nft"

interface EditionSelectorProps {
  editions: NftEdition[]
  selectedId: string
  onChange: (id: string) => void
}

export function EditionSelector({ editions, selectedId, onChange }: EditionSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium">Edição:</legend>
      <div className="flex flex-wrap gap-3">
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          const selected = edition.id === selectedId

          return (
            <label
              key={edition.id}
              className={cn("relative", soldOut ? "cursor-not-allowed opacity-50" : "cursor-pointer")}
            >
              <input
                type="radio"
                name="edition"
                value={edition.id}
                checked={selected}
                disabled={soldOut}
                onChange={() => onChange(edition.id)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex flex-col rounded-md border px-4 py-2 text-sm",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                  selected ? "border-primary bg-secondary" : "border-input",
                )}
              >
                <span className="font-bold">
                  {selected ? "✓ " : ""}
                  {edition.label}
                </span>
                <span className="text-muted-foreground">
                  {edition.priceEth} ETH · {soldOut ? "Esgotada" : `${edition.available} disponíveis`}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
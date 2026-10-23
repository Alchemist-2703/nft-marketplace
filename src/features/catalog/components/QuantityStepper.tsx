import { Button } from "@/components/ui/button"

interface QuantityStepperProps {
  value: number
  max: number
  onChange: (value: number) => void
}

export function QuantityStepper({ value, max, onChange }: QuantityStepperProps) {
  return (
    <div role="group" aria-label="Quantidade" className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Diminuir quantidade"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        −
      </Button>
      <span aria-live="polite" className="min-w-8 text-center text-lg font-bold">
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Aumentar quantidade"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </Button>
    </div>
  )
}
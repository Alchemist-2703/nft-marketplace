import { useEffect, useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  side?: "left" | "right"
  children: ReactNode
}

export function Drawer({ open, onClose, title, side = "left", children }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) {
      return
    }
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
      className={cn(
        "fixed inset-y-0 m-0 h-full max-h-none w-[min(340px,90vw)] max-w-none border-border bg-background p-0 text-foreground backdrop:bg-black/60",
        side === "left" ? "left-0 border-r" : "left-auto right-0 border-l",
      )}
    >
      <div className="flex h-full flex-col overflow-y-auto p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Fechar ${title}`}
            className="rounded-md border border-border px-3 py-1"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

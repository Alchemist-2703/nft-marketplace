import { useStore } from "@/lib/store"
import { dismissNotice, noticesStore } from "./notices-store"
import { realtimeStatusStore } from "./status-store"

export function RealtimeNotices() {
  const notices = useStore(noticesStore, (value) => value)
  const status = useStore(realtimeStatusStore, (value) => value)

  return (
    <div className="mx-auto max-w-7xl px-6">
      <div role="status" aria-live="polite" className="space-y-2 pt-3">
        {status === "offline" && (
          <p className="rounded-md border border-border bg-secondary px-4 py-2 text-sm">
            Atualizações em tempo real indisponíveis. Reconectando… Os dados seguem sendo buscados pela API.
          </p>
        )}
        {notices.map((notice) => (
          <p
            key={notice.id}
            className="flex items-start justify-between gap-4 rounded-md border border-border bg-secondary px-4 py-2 text-sm"
          >
            <span>
              <span aria-hidden="true">{notice.tone === "warning" ? "⚠ " : "ℹ "}</span>
              {notice.text}
            </span>
            <button
              type="button"
              className="underline"
              aria-label={`Dispensar aviso: ${notice.text}`}
              onClick={() => dismissNotice(notice.id)}
            >
              Dispensar
            </button>
          </p>
        ))}
      </div>
    </div>
  )
}

import { Link } from "@tanstack/react-router"
import { buttonVariants } from "@/components/ui/button"

interface PaginationProps {
  page: number
  totalPages: number
}

function visiblePages(page: number, totalPages: number): number[] {
  const start = Math.max(1, Math.min(page - 1, totalPages - 3))
  const end = Math.min(totalPages, start + 3)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

export function Pagination({ page, totalPages }: PaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <nav aria-label="Paginação" className="mt-10 flex flex-wrap items-center justify-end gap-2">
      {page > 1 && (
        <Link
          to="/"
          search={(prev) => ({ ...prev, page: page - 1 === 1 ? undefined : page - 1 })}
          className={buttonVariants({ variant: "outline" })}
        >
          Anterior
        </Link>
      )}
      {visiblePages(page, totalPages).map((target) => (
        <Link
          key={target}
          to="/"
          search={(prev) => ({ ...prev, page: target === 1 ? undefined : target })}
          aria-label={`Página ${target}`}
          aria-current={target === page ? "page" : undefined}
          className={buttonVariants({
            variant: target === page ? "default" : "outline",
            size: "icon",
          })}
        >
          {target}
        </Link>
      ))}
      {page < totalPages && (
        <Link
          to="/"
          search={(prev) => ({ ...prev, page: page + 1 })}
          className={buttonVariants({ variant: "outline" })}
        >
          Próxima
        </Link>
      )}
    </nav>
  )
}

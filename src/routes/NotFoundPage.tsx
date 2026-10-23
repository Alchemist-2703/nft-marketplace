import { Link } from "@tanstack/react-router"

export function NotFoundPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <Link to="/">Voltar ao início</Link>
    </div>
  )
}
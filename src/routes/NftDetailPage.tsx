import { useQuery } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import { nftDetailQuery } from "@/features/catalog/queries"

export function NftDetailPage() {
  const { nftId } = useParams({ from: "/nfts/$nftId" })
  const { data, isPending, isError } = useQuery(nftDetailQuery(nftId))

  if (isPending) {
    return <p>Carregando...</p>
  }
  if (isError) {
    return <p>NFT não encontrado.</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{data.name}</h1>
      <p>{data.description}</p>
    </div>
  )
}
import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "@tanstack/react-router"
import { isAxiosError } from "axios"
import { Button } from "@/components/ui/button"
import { NftDetail } from "@/features/catalog/components/NftDetail"
import { NftDetailSkeleton } from "@/features/catalog/components/NftDetailSkeleton"
import { nftDetailQuery } from "@/features/catalog/queries"

export function NftDetailPage() {
  const { nftId } = useParams({ from: "/nfts/$nftId" })
  const { data, isPending, isError, error, refetch } = useQuery(nftDetailQuery(nftId))

  if (isPending) {
    return <NftDetailSkeleton />
  }

  if (isError) {
    const notFound = isAxiosError(error) && error.response?.status === 404

    if (notFound) {
      return (
        <div role="alert" className="py-16 text-center">
          <h1 className="mb-4 text-2xl font-bold">NFT não encontrado</h1>
          <p className="mb-6 text-muted-foreground">Esse NFT não existe ou foi removido.</p>
          <Link to="/" className="underline">
            Voltar ao catálogo
          </Link>
        </div>
      )
    }

    return (
      <div role="alert" className="py-16 text-center">
        <p className="mb-4">Não foi possível carregar este NFT. Tente de novo.</p>
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    )
  }

  return <NftDetail key={data.id} nft={data} />
}
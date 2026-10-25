import { buttonVariants } from "@/components/ui/button"

const PROMOS = [
  {
    image: "/art/nft-1.png",
    alt: "Macaco de óculos e jaqueta verde",
    title: "Lançamentos gênesis de edição limitada",
    text: "Colecione edições escassas diretamente dos criadores antes da revelação pública.",
  },
  {
    image: "/art/nft-3.png",
    alt: "Macaco escuro de terno claro",
    title: "Arte digital selecionada e muito mais",
    text: "Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.",
  },
]

export function PromoCards() {
  return (
    <section aria-label="Destaques" className="mt-24 grid gap-6 lg:grid-cols-2">
      {PROMOS.map((promo) => (
        <article key={promo.title} className="grid grid-cols-[1fr_1.4fr] items-center overflow-hidden rounded-lg bg-card">
          <img src={promo.image} alt={promo.alt} width={290} height={250} loading="lazy" className="h-[250px] w-full object-cover" />
          <div className="space-y-3 p-5 text-right">
            <h2 className="text-lg font-bold leading-6">{promo.title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{promo.text}</p>
            <a href="#catalogo" className={buttonVariants({ size: "sm" })}>
              Explorar →
            </a>
          </div>
        </article>
      ))}
    </section>
  )
}
import { buttonVariants } from "@/components/ui/button"

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="mb-16 overflow-hidden rounded-lg bg-[linear-gradient(90deg,#241612,#140d0a)] px-6 py-10 sm:px-10"
    >
      <div className="flex flex-col items-center justify-between gap-10 md:flex-row">
        <div className="max-w-[600px] space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-medium tracking-[0.1em]">Bem-vindo à Kurio</p>
            <h1 id="hero-title" className="text-3xl font-bold leading-tight sm:text-[43px] sm:leading-[70px]">
              SEJA DONO DO FUTURO DA ARTE DIGITAL
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara,
              apoie artistas e tenha uma parte da cultura da internet.
            </p>
          </div>
          <a href="#catalogo" className={buttonVariants({ size: "lg" })}>
            EXPLORAR
          </a>
        </div>
        <img
          src="/art/nft-1.png"
          alt="Macaco de óculos e jaqueta verde, arte em destaque"
          width={450}
          height={450}
          fetchPriority="high"
          className="aspect-square w-full max-w-[450px] rounded-3xl object-cover"
        />
      </div>
    </section>
  )
}
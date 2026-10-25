const POSTS = [
  { image: "/art/nft-3.png", meta: "12 de setembro  |  Leitura de 6 min", title: "Como funciona a propriedade de NFTs", text: "Aprenda a colecionar, negociar e verificar ativos digitais." },
  { image: "/art/nft-1.png", meta: "13 de setembro  |  Leitura de 2 min", title: "10 artistas digitais para acompanhar", text: "Conheça criadores que moldam a cultura digital." },
  { image: "/art/nft-2.png", meta: "15 de setembro  |  Leitura de 3 min", title: "Raridade, atributos e procedência", text: "Entenda raridade, procedência, direitos autorais e utilidade." },
  { image: "/art/nft-4.png", meta: "15 de setembro  |  Leitura de 2 min", title: "Como proteger sua carteira", text: "Proteja sua carteira, seus ativos e sua identidade." },
]

export function BlogSection() {
  return (
    <section aria-labelledby="blog-title" className="mt-24 space-y-10">
      <div className="space-y-3 text-center">
        <h2 id="blog-title" className="text-[28px] font-bold">
          Diário da Cunhagem
        </h2>
        <p className="text-sm text-muted-foreground">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {POSTS.map((post) => (
          <article key={post.title} className="overflow-hidden rounded-lg bg-card">
            <img src={post.image} alt="" width={268} height={195} loading="lazy" className="h-[195px] w-full object-cover" />
            <div className="space-y-2 px-4 pb-4 pt-3">
              <p className="text-xs font-medium text-muted-foreground">{post.meta}</p>
              <h3 className="text-base font-bold">{post.title}</h3>
              <p className="text-xs text-muted-foreground">{post.text}</p>
              <p
                aria-disabled="true"
                title="Conteúdo editorial fora do escopo desta entrega"
                className="text-xs font-bold text-highlight opacity-60"
              >
                Ler mais →
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
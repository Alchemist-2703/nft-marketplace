export function FeaturedBanner() {
  return (
    <section
      aria-label="NFT em destaque"
      className="overflow-hidden rounded-lg bg-gradient-to-b from-primary/10 to-primary/5 pt-6"
    >
      <p className="px-5 text-2xl font-bold text-highlight">NFT EM DESTAQUE</p>
      <p className="mt-4 px-5 text-center text-[22px] font-bold">OFERTA LIMITADA</p>
      <img
        src="/art/nft-2.png"
        alt="Macaco de chapéu e moletom roxo, NFT em oferta limitada"
        width={310}
        height={368}
        loading="lazy"
        className="mt-4 h-[368px] w-full rounded-[22px] object-cover"
      />
    </section>
  )
}
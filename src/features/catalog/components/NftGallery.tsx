import { useState } from "react"
import { cn } from "@/lib/utils"

interface NftGalleryProps {
  images: string[]
  name: string
}

export function NftGallery({ images, name }: NftGalleryProps) {
  const [selected, setSelected] = useState(0)

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      <ul className="flex gap-3 md:flex-col" aria-label="Miniaturas">
        {images.map((src, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Ver imagem ${index + 1} de ${images.length}`}
              aria-pressed={index === selected}
              className={cn(
                "block overflow-hidden rounded-lg border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                index === selected ? "border-primary" : "border-transparent opacity-70",
              )}
            >
              <img
                src={src}
                alt=""
                width={100}
                height={100}
                className="h-16 w-16 object-cover md:h-[100px] md:w-[100px]"
              />
            </button>
          </li>
        ))}
      </ul>
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-card md:flex-1">
        <img
          src={images[selected]}
          alt={`${name} - imagem ${selected + 1}`}
          width={444}
          height={444}
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  )
}
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Emblema de lado (CT / TR).
 *
 * Usa os arquivos em `public/assets/ct.webp` e `tr.webp`. O código antigo
 * apontava para `/assets/sides/Ct_logo.webp`, um caminho que nunca existiu no
 * repositório — era esse o motivo das imagens quebradas em quatro telas.
 */

const SIDES = {
  ct: { label: "CT", src: "/assets/ct.webp", alt: "Counter-Terrorist" },
  t: { label: "TR", src: "/assets/tr.webp", alt: "Terrorist" },
} as const;

export type FactionSide = keyof typeof SIDES;

/** Lado do emblema em px, por tamanho. */
const SIZES = { sm: 18, md: 28, lg: 40 } as const;

export function FactionBadge({
  side,
  className,
  size = "md",
}: {
  side: FactionSide;
  className?: string;
  /** `sm` inline sobre card, `md` padrão, `lg` para cabeçalho. */
  size?: keyof typeof SIZES;
}) {
  const { src, alt } = SIDES[side];
  const px = SIZES[size];

  return (
    <Image
      src={src}
      alt={alt}
      width={px}
      height={px}
      className={cn("inline-block shrink-0 object-contain", className)}
      style={{ width: px, height: px }}
    />
  );
}

import type { ImgHTMLAttributes } from "react";

// Plages d'écran, alignées sur les points de rupture de Tailwind (md = 48rem, lg = 64rem)
const MEDIA = {
  mobile: "not all and (min-width: 48rem)", // visible avec md:hidden
  desktop: "(min-width: 48rem)", // visible avec hidden md:block
  large: "(min-width: 64rem)", // visible avec hidden lg:block
} as const;

// Pixel transparent embarqué : aucune requête quand l'écran n'est pas dans la plage
const EMPTY_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

interface ScreenImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src"
> {
  // Plage d'écran où l'image est visible : elle ne doit jamais être plus étroite que les classes
  // CSS qui l'affichent, sinon le pixel vide apparaîtrait à la place de l'image
  screen: keyof typeof MEDIA;
  src: string;
}

// Image propre à un format d'écran (versions Desktop et Mobile, l'une masquée en CSS).
// Un navigateur télécharge une <img> même masquée : un téléphone recevait les deux versions.
// <picture> ne télécharge l'image que si l'écran est dans sa plage.
export default function ScreenImage({ screen, src, ...img }: ScreenImageProps) {
  return (
    // display: contents → la mise en page reste celle de l'<img> seule
    <picture className="contents">
      <source media={MEDIA[screen]} srcSet={src} />
      <img src={EMPTY_PIXEL} {...img} />
    </picture>
  );
}

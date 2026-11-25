import { useId } from 'react';

const artwork = {
  sentry: { src: '/images/sentry-logo.png', width: 500, height: 500, x: 86, y: 70, cropWidth: 326, cropHeight: 358 },
  arthurlabs: { src: '/images/arthurlabs-logo.webp', width: 2048, height: 682, x: 141, y: 216, cropWidth: 312, cropHeight: 257 },
  nexus: { src: '/images/nexus-logo.webp', width: 1254, height: 1254, x: 346, y: 258, cropWidth: 562, cropHeight: 558 },
  studio: { src: '/images/studio-logo.webp', width: 1254, height: 1254, x: 328, y: 247, cropWidth: 598, cropHeight: 514 },
};

/** The supplied symbol only; names and taglines are always rendered as HTML. */
export function LogoMark({ logo, className }: { logo: keyof typeof artwork; className?: string }) {
  const id = useId();
  const mask = `${id}-mask`, filter = `${id}-alpha`;
  const art = artwork[logo];
  const region = { x: art.x, y: art.y, width: art.cropWidth, height: art.cropHeight };
  const colored = logo === 'nexus' || logo === 'sentry';
  return <svg className={className} viewBox={`${art.x} ${art.y} ${art.cropWidth} ${art.cropHeight}`} width="40" height="40" aria-hidden="true" focusable="false" data-logo={logo}>
    <defs>
      {colored && <filter id={filter} colorInterpolationFilters="sRGB">
        {/* Turn non-black artwork into an opaque mask, preserving the original
            colored image beneath it rather than washing out its luminance. */}
        <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  3 3 3 0 0"/>
      </filter>}
      <mask id={mask} maskUnits="userSpaceOnUse" {...region} style={{ maskType: 'luminance' }}>
        <image href={art.src} width={art.width} height={art.height} filter={colored ? `url(#${filter})` : undefined}/>
      </mask>
    </defs>
    {colored
      ? <image href={art.src} width={art.width} height={art.height} mask={`url(#${mask})`}/>
      : <rect {...region} fill="currentColor" mask={`url(#${mask})`}/>}
  </svg>;
}

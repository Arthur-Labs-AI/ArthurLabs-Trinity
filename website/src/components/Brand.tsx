import Link from 'next/link';
import { LogoMark } from './LogoMark';

export function Brand() {
  return <Link className="brand" href="/" aria-label="ArthurLabs home">
    <LogoMark logo="arthurlabs"/>
    <span className="brand-name">ArthurLabs</span>
  </Link>;
}

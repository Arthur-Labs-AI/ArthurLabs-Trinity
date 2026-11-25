import type { ProductId } from '@/lib/products';
import { LogoMark } from '../LogoMark';
import styles from './suite.module.css';
export function ProductMark({ product }: { product: ProductId }) {
  return <span className={styles.mark} data-product={product} aria-hidden="true"><LogoMark logo={product}/></span>;
}

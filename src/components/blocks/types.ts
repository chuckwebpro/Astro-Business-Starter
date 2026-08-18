import type { SectionBackground, SectionSpacing } from '../ui/Section.astro';
import type { ContainerAlign, ContainerWidth } from '../ui/Container.astro';

/**
 * Every block forwards these straight through: background/spacing to the outer
 * Section, align/width to the inner Container. Blocks never own the band.
 */
export interface BlockProps {
  background?: SectionBackground;
  spacing?: SectionSpacing;
  align?: ContainerAlign;
  width?: ContainerWidth;
  /** Optional heading above the block content. */
  eyebrow?: string;
  title?: string;
  body?: string;
  /** Semantic level for `title`; visual size stays constant. */
  titleLevel?: 2 | 3;
}

export interface BlockAction {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'inverse';
}

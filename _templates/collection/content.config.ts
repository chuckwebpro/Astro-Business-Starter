/**
 * Paste into `src/content.config.ts`, replacing every `__collection__`.
 * If that file does not exist yet, this is its entire contents.
 *
 * Write the schema by hand — it is the one place where being explicit about a
 * project's content shape actually pays for itself.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const __collection__ = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/__collection__' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      publishDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      /** Filtered out of production builds; still visible in `dev`. */
      draft: z.boolean().default(false),
      author: z.string().optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).default([]),
      heroImage: image().optional(),
      heroImageAlt: z.string().optional(),
    }),
});

export const collections = { __collection__ };

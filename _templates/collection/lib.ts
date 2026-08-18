/**
 * Shared query helpers. Copy to `src/lib/__collection__.ts`.
 * Blocks stay props-only, so pages query here and pass results down.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export type Entry = CollectionEntry<'__collection__'>;

/** Drafts render in `dev` and disappear from production builds. */
export async function getPublished(): Promise<Entry[]> {
  const entries = await getCollection('__collection__', ({ data }) => {
    return import.meta.env.DEV || data.draft !== true;
  });

  return entries.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
}

export function readingTime(body: string | undefined): string {
  const words = (body ?? '').trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

/** Same category first, then most recent. */
export function related(all: Entry[], current: Entry, limit = 3): Entry[] {
  return all
    .filter((entry) => entry.id !== current.id)
    .sort((a, b) => {
      const aMatch = a.data.category === current.data.category ? 1 : 0;
      const bMatch = b.data.category === current.data.category ? 1 : 0;
      return bMatch - aMatch;
    })
    .slice(0, limit);
}

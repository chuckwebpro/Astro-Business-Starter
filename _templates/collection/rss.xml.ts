/**
 * RSS feed. Copy to `src/pages/__collection__/rss.xml.ts`.
 * Requires `npm i @astrojs/rss` — deliberately not a starter dependency.
 *
 * Imports are written for that destination and will not resolve in _templates/.
 */
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { site } from '../../config/site';
import { getPublished } from '../../lib/__collection__';

export const GET: APIRoute = async (context) => {
  const entries = await getPublished();

  return rss({
    title: `__Collection__ | ${site.name}`,
    description: site.description,
    site: context.site ?? site.url,
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.publishDate,
      link: `/__collection__/${entry.id}/`,
      categories: entry.data.tags,
    })),
  });
};

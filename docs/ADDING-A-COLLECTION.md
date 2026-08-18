# Adding a collection.

No collection ships with the starter. A site that has no blog should not carry
routes, schemas, or an RSS endpoint for one.

When a project needs repeatable content — a blog, `news`, `insights`, `projects`,
`services`, whatever the client calls it — copy `_templates/collection/` and rename.
Everything below assumes the collection is called `posts`; substitute your own name.

## 1. Copy the files

| From `_templates/collection/` | To                                        |
| ----------------------------- | ----------------------------------------- |
| `content.config.ts`           | `src/content.config.ts`                   |
| `lib.ts`                      | `src/lib/posts.ts`                        |
| `index.astro`                 | `src/pages/posts/[...page].astro`         |
| `[slug].astro`                | `src/pages/posts/[slug].astro`            |
| `rss.xml.ts`                  | `src/pages/posts/rss.xml.ts` _(optional)_ |
| `new-entry.mjs`               | `scripts/new-entry.mjs` _(optional)_      |

If `src/content.config.ts` already exists, merge the new `defineCollection` block
into it rather than overwriting.

**The import paths are already correct — for the destination.** They resolve from
`src/pages/<collection>/`, not from `_templates/`, so the files look broken sitting
in place and `tsconfig.json` excludes the folder for that reason. Copy them to the
paths in the table and the imports just work. Put a route somewhere else — say
`src/pages/[...page].astro` for a collection at the site root — and you will need to
adjust the `../../` prefixes to match the new depth.

## 2. Replace the placeholders

Two case-sensitive tokens appear throughout:

- `__collection__` → the collection id and URL segment, lowercase (`posts`)
- `__Collection__` → the display name (`Posts`, `News`, `Case Studies`)

## 3. Write the schema by hand

The Zod schema in `content.config.ts` is the guardrail against broken content.
Add and remove fields to match the project — there is no descriptor layer or code
generation to keep in sync, so edit it directly.

## 4. Wire it up

- Add the collection to `src/config/navigation.ts` if it belongs in the menu.
- Create `src/content/posts/` and add a first entry.
- For RSS: `npm i @astrojs/rss`, then link it from `BaseLayout`'s `head` slot.
- For the scaffolder: add `"new:entry": "node scripts/new-entry.mjs"` to `package.json`.

## 5. Feed blocks, don't query from them

Blocks are props-only. Query in the page and pass the result down:

```astro
---
import { getPublished } from '../lib/posts';
import ServicesGrid from '../components/blocks/ServicesGrid.astro';

const posts = await getPublished();
const items = posts.slice(0, 3).map((post) => ({
  title: post.data.title,
  body: post.data.description,
  href: `/posts/${post.id}/`,
}));
---

<ServicesGrid title="Latest posts" items={items} />
```

This is what keeps blocks portable between projects with different content shapes.

## Drafts

`draft: true` entries render in `dev` and are filtered from production builds by
`getPublished()`. Work in progress can live on `main` safely.

## Removing a collection

Delete the routes, `src/lib/posts.ts`, `src/content/posts/`, and the collection
from `src/content.config.ts`. If it was the only collection, delete
`src/content.config.ts` entirely — the site must still build clean without it.

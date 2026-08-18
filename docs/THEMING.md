# Theming

`tokens/*.json` is the only committed source of design values.
`src/styles/theme.css` is **generated** from it and is gitignored — never edit it.

Generation runs automatically from `predev`, `prebuild`, and `preverify`, so there
is no `npm run tokens` step to forget.

## Where tokens come from

The pipeline cannot tell the difference between these, and no project is ever
blocked waiting on a design tool:

1. **Figma via Tokens Studio** — the designer maps the plugin to the Figma variable
   collections and pushes `tokens/*.json` to a `design-tokens` branch. Merge, build.
   See `docs/DESIGNER-BRIEF.md`.
2. **Another design tool** — export or transcribe values into the JSON by hand.
3. **No designer** — edit the JSON directly. This is fully supported.

## How tokens map to Tailwind

Token paths become Tailwind v4 theme namespaces, so the utility name follows from
the token name:

| Token path        | CSS variable        | Utility           |
| ----------------- | ------------------- | ----------------- |
| `color.brand.500` | `--color-brand-500` | `bg-brand-500`    |
| `color.ink.muted` | `--color-ink-muted` | `text-ink-muted`  |
| `font.sans`       | `--font-sans`       | `font-sans`       |
| `text.3xl`        | `--text-3xl`        | `text-3xl`        |
| `radius.lg`       | `--radius-lg`       | `rounded-lg`      |
| `shadow.md`       | `--shadow-md`       | `shadow-md`       |
| `spacing.section` | `--spacing-section` | `py-section`      |
| `container.page`  | `--container-page`  | `max-w-page`      |
| `breakpoint.md`   | `--breakpoint-md`   | `md:` / `max-md:` |

Two rules that matter:

- **Do not reuse a Tailwind built-in key name.** `container.prose` silently loses to
  Tailwind's own `--container-prose: 65ch`. Ours is `container.reading` for that reason.
- The generator emits **`@theme static`**, so every token reaches the stylesheet even
  if no utility class references it. Components read tokens through raw `var()`
  (`Prose`, `Section`), and without `static` those get tree-shaken away.

## Semantic aliases

Raw ramps (`brand`, `neutral`, `accent`) are referenced by semantic tokens:

- `surface.*` — band backgrounds (`Section`)
- `ink.*` — text colours
- `line.*` — borders
- `focus` — focus ring

Components use the semantic names, so a rebrand usually means editing the brand
ramp alone and letting the aliases follow.

## Rebranding a project

1. Edit `tokens/color.json` (usually just the `brand` ramp).
2. `npm run dev` — the theme regenerates on start.
3. Check `/styleguide` for contrast and hierarchy before touching pages.

## There is no override stylesheet

If one place needs a value the tokens do not have, that is a component-level
decision — a prop or a local class. Not a global escape hatch. If you find
yourself wanting to edit `theme.css`, the value belongs either in the tokens or
in a component prop; there is deliberately no third option.

Verify with:

```bash
grep -rE "#[0-9a-fA-F]{6}|\[[0-9]+px\]" src/
```

Anything outside `tokens/*.json` is either a missing token or a prop that should exist.

# Hosting (cPanel)

Everything runs on your own infrastructure. The only external services are GitHub
(source + CI) and Formspree (form delivery).

## URL shape — decided once, do not change casually

`astro.config.mjs` pins these together:

```js
trailingSlash: 'always',
build: { format: 'directory' },
```

That produces `/about/index.html`, which Apache serves at `/about/` via
`DirectoryIndex` with no redirect. Changing one without the other breaks URLs,
generates redirect chains, and splits your log analytics between two paths for
the same page.

**The 404 is the exception:** Astro emits it flat as `dist/404.html`, not
`dist/404/index.html`. `.htaccess` points `ErrorDocument` at `/404.html`.

## First-time server setup

1. Create the domain or subdomain in cPanel; note the document root
   (usually `public_html/` or `public_html/subdomain/`).
2. Issue the SSL certificate (AutoSSL) **before** the first deploy — `.htaccess`
   force-redirects to HTTPS and will loop against a missing certificate.
3. Create an FTP account scoped to the document root.
4. Add repository secrets in GitHub → Settings → Secrets → Actions:

   | Secret           | Value                                    |
   | ---------------- | ---------------------------------------- |
   | `FTP_SERVER`     | `ftp.example.com`                        |
   | `FTP_USERNAME`   | The scoped FTP account                   |
   | `FTP_PASSWORD`   | Its password                             |
   | `FTP_SERVER_DIR` | `public_html/` (trailing slash required) |

5. Update `site` in `astro.config.mjs` and the `Sitemap:` line in
   `public/robots.txt` to the real domain.

## Deploying

`.github/workflows/deploy.yml` runs on every push to `main`: install → `verify`
→ `build` → FTP upload of `dist/`. The `verify` gate means a type error or
malformed frontmatter fails in CI instead of shipping.

Manual fallback: `npm run build` and upload the contents of `dist/`.

## What `.htaccess` does

Lives at `public/.htaccess`, so it ends up at the document root:

- Forces HTTPS and non-www (swap two lines to prefer www)
- Adds trailing slashes in one hop so `mod_dir` cannot chain a second redirect
- `ErrorDocument 404 /404.html`
- gzip and brotli for text assets
- Immutable, one-year caching for fingerprinted assets; `must-revalidate` for HTML
  — without that split, a deploy is invisible until caches expire
- `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, HSTS

## Analytics from server logs

Log analytics is the baseline measurement layer. It costs the page nothing: no
JavaScript, no consent prompt, no ad-blocker loss.

Raw logs live under `~/logs/` (cPanel → Raw Access). Enable log archiving so they
survive the monthly rotation.

```bash
goaccess ~/logs/example.com-ssl_log \
  --log-format=COMBINED \
  --ignore-panel=REFERRING_SITES \
  --exclude-ip=YOUR.OFFICE.IP \
  -o ~/public_html/_reports/index.html
```

Cron it monthly, and protect `_reports/` with cPanel's Directory Privacy.

Two things the build does to keep reports honest, both worth preserving:

- **Stable URLs.** Changing `trailingSlash` splits one page across two log paths.
- **Clean 404s and redirects.** A redirect chain shows up as two hits.

Filter out asset paths (`/_astro/`) and known bots in the GoAccess config, and set
a log retention period.

**Limits worth naming before a client asks:** logs answer _how much traffic and to
which pages_, not _what people did on the page_. No scroll depth, no in-page events,
no cross-device attribution. When a client runs paid ads and needs conversion
attribution, add GA4/Meta/Bing tags in `src/config/site.ts` — that is what they are
for.

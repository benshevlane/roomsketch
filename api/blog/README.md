# Blog auto-publish API

External SEO tools (e.g. ralfseo) POST generated articles here. The endpoint:

1. Validates the Bearer token.
2. Renders a new `<slug>.html` using the same template as hand-written posts (same nav, footer, typography, schema, OG tags, breadcrumbs).
3. Inserts a new card at the top of `/blog/index.html`.
4. Adds the URL to `sitemap.xml`.
5. Commits all three files to `main` in a single atomic commit — Vercel auto-redeploys and the post goes live in about a minute.

## Endpoint

```
POST https://freeroomplanner.com/api/blog/publish
Authorization: Bearer <BLOG_PUBLISH_TOKEN>
Content-Type: application/json
```

### Body

| Field           | Type                | Required | Notes                                                                     |
| --------------- | ------------------- | -------- | ------------------------------------------------------------------------- |
| `title`         | string (3–200)      | yes      | Article headline                                                          |
| `description`   | string (10–500)     | yes      | Meta description / excerpt (~150 chars is ideal)                          |
| `body`          | string              | one of   | Article body. `html` and `content` are also accepted as aliases.          |
| `html`          | string              | one of   | Same as `body`                                                            |
| `content`       | string              | one of   | Same as `body`                                                            |
| `slug`          | string              | no       | URL slug; auto-generated from title if omitted                            |
| `tag`           | string              | no       | Badge / category (default: `"Room Planning"`)                             |
| `readingTime`   | string              | no       | e.g. `"8 min read"`; auto-calculated if omitted                           |
| `datePublished` | string `YYYY-MM-DD` | no       | Defaults to today (UTC)                                                   |
| `canonicalUrl`  | string URL          | no       | Defaults to `https://freeroomplanner.com/blog/<slug>`                     |
| `ogImage`       | string URL          | no       | Defaults to `https://freeroomplanner.com/og-image.png`                    |
| `overwrite`     | boolean             | no       | Set `true` to replace an existing post with the same slug                 |

The body may be a full HTML fragment (using `<h2>`, `<p>`, `<ul>`, etc.) or plain text with double-newline-separated paragraphs — plain text is wrapped in `<p>` tags automatically.

### Example — curl

```bash
curl -X POST https://freeroomplanner.com/api/blog/publish \
  -H "Authorization: Bearer $BLOG_PUBLISH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "How to Plan a Galley Kitchen",
    "description": "A practical guide to planning a galley kitchen — measurements, the work triangle, and common mistakes to avoid.",
    "tag": "Kitchen Planning",
    "body": "<h2>What is a galley kitchen?</h2><p>A galley kitchen has two parallel runs of cabinets with a walkway between them…</p>"
  }'
```

### Responses

- `200` — `{ ok: true, slug, url, commitUrl }`
- `400` — validation error (Zod flattened errors)
- `401` — missing or invalid bearer token
- `409` — post already exists at that slug; re-send with `"overwrite": true`
- `503` — `BLOG_PUBLISH_TOKEN` not configured in Vercel env
- `500` — GitHub API error

## Vercel environment variables

All three must be set in the project (Production + Preview):

| Name                  | Example                                        | Purpose                                                 |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| `BLOG_PUBLISH_TOKEN`  | `long random string`                           | Bearer token callers must present                       |
| `GITHUB_TOKEN`        | `github_pat_…`                                 | Fine-grained PAT with Contents: Read & write on the repo |
| `GITHUB_REPO`         | `benshevlane/freeroomplanner.com` (default)    | `<owner>/<repo>` — optional if using the default         |
| `GITHUB_BRANCH`       | `main` (default)                               | Branch to commit to — optional                           |

Generate a strong token with `openssl rand -hex 32` and paste it into both Vercel and ralfseo's webhook settings.

## How to connect ralfseo

1. In ralfseo, open the webhook / publish integration settings.
2. Set URL: `https://freeroomplanner.com/api/blog/publish`
3. Set method: `POST`
4. Add header: `Authorization: Bearer <BLOG_PUBLISH_TOKEN>`
5. Map ralfseo's generated article fields to the body fields above (at minimum: `title`, `description`, and article HTML into `body`).

## Local testing

```bash
# With the dev server running (npm run dev) and env vars set locally:
curl -X POST http://localhost:3000/api/blog/publish \
  -H "Authorization: Bearer $BLOG_PUBLISH_TOKEN" \
  -H "Content-Type: application/json" \
  -d @test-post.json
```

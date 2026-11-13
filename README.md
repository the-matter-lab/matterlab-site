# The Matter Lab website

Source for [matter.toronto.edu](https://www.matter.toronto.edu), built with Vite + React + TypeScript.
**All content lives in plain YAML / Markdown files under [`content/`](content/).** To change the site, edit a file and open a pull request. Merging to `main` deploys automatically.

```bash
npm install
npm run dev        # local dev server with live reload: http://localhost:5173
npm run build      # production build -> dist/ (every page pre-rendered to static HTML)
npm run preview    # serve dist/ locally
```

---

## Where things are

| What you want to change                     | File                                                       |
| ------------------------------------------- | ---------------------------------------------------------- |
| Top menu, footer, site name                 | [`content/site.yaml`](content/site.yaml)                   |
| Home page (mission, hero photo, intro text) | [`content/home.yaml`](content/home.yaml)                   |
| People, staff, students, alumni             | [`content/people.yaml`](content/people.yaml)               |
| Publications                                | [`content/publications.yaml`](content/publications.yaml)   |
| Research areas (bubbles, colours, filters)  | [`content/research-areas.yaml`](content/research-areas.yaml) |
| News                                        | [`content/news/`](content/news/), one Markdown file per item |
| Text pages (About Alán, Open Positions, …)  | [`content/pages/`](content/pages/), one Markdown file per page |
| Images                                      | [`public/images/`](public/images/)                         |

If a content file has a mistake (bad YAML indentation, a publication without a year, an unknown research area…), `npm run dev` / `npm run build` stops with a message that names the file and the entry.

---

## Common tasks

### Add a person

Put a photo (JPG/PNG, any size) in `public/images/people/`; the build automatically crops it to a 400×400 centred square and compresses it to WebP, so you don't need to resize it yourself, then add an entry to the right group in `content/people.yaml`:

```yaml
      - name: Ada Lovelace
        email: ada.lovelace@utoronto.ca     # shown as ada.lovelace[at]utoronto.ca
        photo: /images/people/ada.jpg
        areas:
          - AI for discovery & self-driving labs
          - Quantum computing
        links:
          - label: Google Scholar
            url: https://scholar.google.com/citations?user=XXXX
          - label: LinkedIn
            url: https://www.linkedin.com/in/ada
```

Optional fields: `role` (shown under the name, used for staff), `address` (list of lines).
Order in the file = order on the page. When someone graduates, delete their entry and add their name under `alumni:` at the bottom.

### Add a publication

Copy an entry to the **top** of `content/publications.yaml` and edit it:

```yaml
- title: "Title of the paper: with a colon needs quotes"
  year: 2026
  venue: Nature
  authors: First Author, Second Author, Alán Aspuru-Guzik
  area: ai-for-discovery-and-self-driving-labs
  url: https://doi.org/10.xxxx/xxxxx
  citation: F. Author, S. Author, A. Aspuru-Guzik. *Nature* **600**, 1 (2026).   # optional, Markdown
```

`area` must be one of the `id`s in `content/research-areas.yaml`:
`quantum-computing`, `energy-and-functional-materials`, `ai-for-discovery-and-self-driving-labs`, `electronic-structure-methods`, `biophysics-molecular-computers-and-other-topics`.

Tip: quote the title (`"…"`) if it contains `:` or starts with a special character.

### Add a news item

Create `content/news/YYYY-MM-DD-short-slug.md`:

```markdown
---
title: Our paper is on the cover of Science
date: 2026-11-12
source: Science            # optional: outlet or authors
description: One-sentence teaser shown on the card.   # optional
image: /images/news/cover.jpg                         # optional
link: https://www.science.org/...                     # optional external article
---

Optional body text in Markdown. If you write a body, the item gets its own page
at /news/short-slug; otherwise "Read more" goes straight to `link`.
```

### Edit or add a text page

Pages are in `content/pages/<slug>.md` and appear at `/basic-content-page/<slug>` (same URLs as the old Webflow site, so existing links keep working).

```markdown
---
title: Open Positions
subtitle: Optional line under the title
buttons:                       # optional buttons in the page header
  - label: Apply here
    url: https://forms.gle/...
---

Normal **Markdown** here: headings, lists, [links](/people), images:

![caption](/images/pages/some-figure.png)

###### [A green pill button](/publications)
```

(`######` around a link renders as a green button, matching the old site's style.)
To show a new page in the menu, add it to `nav:` in `content/site.yaml`.

Research-area pages (the five whose slug matches `page:` in `research-areas.yaml`) automatically list their 5 most recent papers.

### Images

Put files in `public/images/<folder>/` and reference them as `/images/<folder>/<file>`. Please keep photos under ~500 KB (resize to ≤1600 px wide). Headshots in `images/people/` are exempt: the build compresses them automatically (`content-plugin.ts`, `PHOTO_SIZE`).

---

## Deployment

`.github/workflows/deploy.yml` builds the site and publishes `dist/` to **GitHub Pages** on every push to `main`.

One-time setup:

1. Push this repo to GitHub (for example `aspuru-guzik-group/matterlab-site`).
2. Repo **Settings → Pages → Source: GitHub Actions**.
   The site is then live at `https://<org>.github.io/<repo>/` (the build sets `BASE_PATH=/<repo>/` automatically).
3. Repo **Settings → Pages → Custom domain:** `www.matter.toronto.edu`, then enable **Enforce HTTPS**.
   Also add a repo variable (**Settings → Secrets and variables → Actions → Variables**) `BASE_PATH` = `/`, and re-run the deploy workflow, so the site is served from the domain root.
4. Ask UofT IT (whoever manages the `toronto.edu` DNS today) to change the DNS:
   - `www.matter.toronto.edu` → `CNAME` → `<github-org>.github.io`
   - `matter.toronto.edu` (apex) → the GitHub Pages `A` records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, or a redirect to `www`.
5. Once the new site is live, cancel the Webflow plan.

Any other static host works too (Netlify, Cloudflare Pages, Vercel, or a UofT web server): build command `npm run build`, output directory `dist`.

---

## Re-importing from Webflow

`scripts/import-from-webflow.mjs` scrapes the live Webflow site into `content/` and downloads all images. If anyone edits Webflow before the switch, run this right before changing DNS:

```bash
npm run import:webflow -- --force   # overwrites content/*.yaml and content/**/*.md
```

Then re-apply any manual edits from git (`git diff`). After the switch you can delete the script and the `cheerio` / `turndown` dev dependencies.

---

## Code layout

```
content/              ← all site content (edit these)
public/               ← static files: images, fonts
src/
  content.ts          typed access to content/
  pages/              one component per page type
  components/         header, footer, cards, …
  styles.css          all styling (colour tokens at the top)
content-plugin.ts     compiles + validates YAML/Markdown at build time
scripts/prerender.mjs renders each route to static HTML, plus sitemap.xml and robots.txt
```

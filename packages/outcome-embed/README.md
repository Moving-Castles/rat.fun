# outcome-embed

A standalone, embeddable widget that replays real rat.fun trip outcomes — built for
the post-mortem article. It reproduces the in-game trip report log (timestamps,
`[ITEM]`/`[QUOTE]`/`[SYSTEM]`/`[BALANCE]` highlighting, balance/item chips, death
summary) without any dependency on the client app.

## How it works

- `build-data.mjs` fetches a curated list of outcome documents (plus their trip
  prompt and image) from the **public** Sanity CMS (`saljmqwt`, no token needed)
  and snapshots them into `data.js`. It also precomputes each rat's avatar — the
  four layered part images (body, arms, head, ears) picked from the `rat-images`
  singleton by hashing the rat's entity ID, exactly as the client's
  `RatAvatar.svelte` / `hashToIndices` do.
- `widget.js` + `widget.css` hold the shared rendering (vanilla JS, no build
  step), using the same log-parsing logic as the client (`mergeLog` from
  `GameRun/TripReport/Log/index.ts` and `parseLogText` from
  `GameRun/TripReport/Log/LogItem/parseLogText.ts`, ported verbatim).
- `index.html` — gallery: flip through all snapshotted examples with prev/next.
- `solo.html` — one outcome only, no navigation; pick it with
  `?id=<Sanity outcome _id>`.

Data is snapshotted rather than fetched live, and all referenced images (trip
images, rat avatar layers) plus the two fonts (Workbench, Xanh Mono — both
OFL-licensed) are downloaded into `assets/` with URLs rewritten to relative
paths. The deployed folder is fully self-contained (~3 MB): no runtime requests
to Sanity or Google, so the embed keeps working even after the game winds down.

## Usage

Regenerate the snapshot (optionally with your own outcome IDs):

```sh
node build-data.mjs
node build-data.mjs <outcomeId> <outcomeId> ...
```

Preview locally:

```sh
npx serve .
```

Deploy the folder to any static host (Netlify, GitHub Pages, …), then embed
the gallery:

```html
<iframe
  src="https://<host>/outcome-embed/"
  width="100%"
  height="640"
  style="border: none; background: #000"
  title="rat.fun trip outcome replay"
></iframe>
```

…or a single outcome (no prev/next), chosen by its Sanity document ID:

```html
<iframe
  src="https://<host>/outcome-embed/solo.html?id=1875f349-a2cc-487c-aa8f-7664f0872149"
  width="100%"
  height="640"
  style="border: none; background: #000"
  title="rat.fun trip outcome replay"
></iframe>
```

Both pages read from the same `data.js` snapshot — an ID must be in the curated
list in `build-data.mjs` (re-run it after adding one). The gallery also supports
deep-linking its start example with `?i=<index>` (0-based) or `?id=<outcome _id>`,
e.g. `/?i=7` opens the DOOM E1M2 run directly. The first four examples are an
intro sequence: the same convenience store empty-handed vs. carrying Fire
Blessing, then the same computer shop visited twice by the same pistol-carrying
rat — once politely, once as an armed robbery.

## Finding more examples

The dataset is publicly queryable. Useful GROQ starting points:

```groq
// Recent deaths with loot lost
*[_type == "outcome" && newRatBalance == 0 && count(itemsLostOnDeath) > 0] | order(_createdAt desc)

// Big wins
*[_type == "outcome" && ratValueChange > 150] | order(_createdAt desc)

// Item crafting / trading drama
*[_type == "outcome" && count(itemChanges) > 1] | order(_createdAt desc)
```

Query via curl:

```sh
curl -sG "https://saljmqwt.api.sanity.io/v2025-04-18/data/query/production" \
  --data-urlencode 'query=*[_type=="outcome"] | order(_createdAt desc)[0...5]{_id, ratName, ratValueChange}'
```

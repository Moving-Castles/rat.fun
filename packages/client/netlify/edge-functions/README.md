# Netlify Edge Functions

This directory contains Netlify edge functions for rat.fun.

## trip-seo.ts

This edge function intercepts crawler requests for trip pages and renders basic HTML with meta tags for SEO purposes.

### How it works

1. **Crawler Detection**: Detects common crawler user agents (Googlebot, Bingbot, Facebook, Twitter, etc.)
2. **Path Matching**: Intercepts requests to `/(main)/(game)/[tripId]` routes
3. **Data Fetching**: Fetches trip data from Sanity CMS
4. **HTML Generation**: Renders basic HTML with proper meta tags for social sharing and SEO

### Environment Variables

The following environment variables need to be set in Netlify:

- `SANITY_PROJECT_ID`: Your Sanity project ID
- `SANITY_DATASET`: Your Sanity dataset (default: production)
- `SANITY_API_VERSION`: Sanity API version (default: 2024-01-01)

### Deployment

The edge function is automatically deployed when you push to the main branch. The function is configured in the root `netlify.toml` file.

### Testing

You can test the edge function locally using:

```bash
cd packages/client/netlify/edge-functions
pnpm install
netlify dev
```

Then visit a trip URL with a crawler user agent to see the generated HTML.

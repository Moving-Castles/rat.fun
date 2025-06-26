<script lang="ts">
  const defaultTitle = "RAT.FUN"
  let {
    prependTitle = "",
    url = "https://rat.fun",
    title = defaultTitle,
    description = "",
    imageAlt = "rat.fun",
    imageUrl = "/images/meta.png",
    language = "en-us",
    imageWidth = "1200",
    imageHeight = "600"
  } = $props()

  let finalTitle = $derived(prependTitle ? `${prependTitle} | ${title}` : title)
</script>

<svelte:head>
  <title>{finalTitle}</title>

  <meta name="siteUrl" content={url} />
  <meta name="pageTitle" content={finalTitle} />
  <meta name="description" content={description} />
  <meta
    name="robots"
    content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
  />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={finalTitle} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={imageUrl} />

  <meta property="og:site_name" content={finalTitle} />
  <meta property="og:locale" content={language} />
  <meta property="og:url" content={url} />
  <meta property="og:title" content={finalTitle} />
  <meta property="og:description" content={description} />

  <meta property="og:image" content={imageUrl} />
  <meta property="og:image:width" content={imageWidth} />
  <meta property="og:image:height" content={imageHeight} />
  <meta property="og:image:alt" content={imageAlt} />
</svelte:head>

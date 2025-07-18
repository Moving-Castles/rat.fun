/**
 *  GROQ queries for Sanity CMS
 *  https://www.sanity.io/docs/groq
 */

export const queries = {
  templateImages: '*[_id == "template-images"]{..., "roomImages": roomImages[].asset->url}[0]'
}

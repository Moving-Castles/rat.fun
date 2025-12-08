import TextFill from "textfilljs"

export const resizeTextAttachment = (element: HTMLElement, options: any) => {
  const fit = () => {
    TextFill(element, options)
  }

  fit()

  window.addEventListener("resize", fit)

  return () => {
    window.removeEventListener("resize", fit)
  }
}

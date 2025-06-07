import { mount } from 'svelte'
import "./app.css"
import App from "./App.svelte"
import { ENVIRONMENT } from "@mud/enums"

const getEnvironment = () => {
  const hostname = window.location.hostname
  const urlParams = new URLSearchParams(window.location.search)

  if (hostname.includes("rhodolite") || urlParams.has("rhodolite")) {
    return ENVIRONMENT.RHODOLITE
  }

  if (hostname.includes("pyrope") || urlParams.has("pyrope")) {
    return ENVIRONMENT.PYROPE
  }

  return ENVIRONMENT.DEVELOPMENT
}

const environment = getEnvironment()

const app = mount(App, {
  target: document.getElementById("app") as HTMLElement,
  props: {
    environment,
  }})

export default app
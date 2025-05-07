import { SvelteURL } from "svelte/reactivity"
import { writable } from "svelte/store"

const url = writable(new SvelteURL(window.location.href))

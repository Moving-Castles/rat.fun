import { fade, fly } from 'svelte/transition';
// import { lerp } from '$lib/modules/utils/maths';
import { elasticOut, linear } from 'svelte/easing';

type LayoutRouteId =
	| '/'
	| '/(rooms)'
	| '/(rooms)/[roomId]'
	| '/(rooms)/[roomId]/enter'
	| '/(rooms)/landlord'
	| '/outcome/[id]'
	| null;

export type TransitionConfig = {
	from: LayoutRouteId | '*';
	to: LayoutRouteId | '*';
	in?: {
    transition: TransitionFunction,
    params: Record<string, string | number>
  }
  out?: {
    transition: TransitionFunction,
    params: Record<string, string | number>
  }
};

export const wipe = (
	_: HTMLElement,
	params: {
		delay?: number;
		duration?: number;
		feather?: number;
    direction: "in" | "out";
		easing?: (t: number) => number;
	} = {
    direction: "out"
  }
) => {
  console.log(params)
	return {
		delay: params.delay || 0,
		duration: params.duration || 400,
		easing: params.easing || linear,
		css: (t, u) => {
      console.log("WIPE DIRECTION DFEFALT", params.direction)
      const progress = params.direction === "in" ? u : t;
      const halfWidth = progress * 50; // Expands from 0% to 50% on each side
      const centerLeft = 50 - halfWidth;
      const centerRight = 50 + halfWidth;
      const angle = 90;
      const fromColor = params.direction === "in" ? "#ffff" : "#0000"
      const toColor = params.direction === "in" ? "#0000" : "#ffff"

      return `
        position: fixed;
        z-index: 1000000000;
        inset: 0;
        -webkit-mask-image: linear-gradient(${angle}deg, ${fromColor} ${centerLeft}%, ${toColor} ${centerLeft}%, ${toColor} ${centerRight}%, ${fromColor} ${centerRight}%);
        mask-image: linear-gradient(${angle}deg, ${fromColor} ${centerLeft}%, ${toColor} ${centerLeft}%, ${toColor} ${centerRight}%, ${fromColor} ${centerRight}%);
        -webkit-mask-size: 100vw 100vh;
        mask-size: 100vw 100vh;
        mask-position: 50% 50%;
        mask-repeat: no-repeat;
      `;
		}
	};
};

export const leftToRight = (
	node: HTMLElement,
	params: {
		delay?: number;
		duration?: number;
		feather?: number;
		easing?: (t: number) => number;
	}
) => {
	const css = (t, _) => `
  -webkit-mask-image: linear-gradient(to left,  #ffff ${t * 100}%, ${fromColor} ${t * 100 + (params?.feather || 0)}%);
  mask-image: linear-gradient(to left,  #ffff ${t * 100}%, ${fromColor} ${t * 100 + (params?.feather || 0)}%);
  -webkit-mask-size: 100vw 100vh;
  mask-size: 100vw 100vh;
  mask-position: 50% 50%;
  mask-repeat: no-repeat;
`;

	return {
		delay: params.delay || 0,
		duration: params.duration || 400,
		easing: params.easing || elasticOut,
		css
	};
};

export function whoosh(
	node: HTMLElement,
	params: { delay?: number; duration?: number; easing?: (t: number) => number }
) {
	const existingTransform = getComputedStyle(node).transform.replace('none', '');

	return {
		delay: params.delay || 0,
		duration: params.duration || 400,
		easing: params.easing || elasticOut,
		css: (t, u) => `transform: ${existingTransform} scale(${t})`
	};
}

export const transitionFunctions = {
  none: (_: HTMLElement, __: object) => {},
	fade,
  fly,
	wipe: wipe,
	leftToRight
};

export type TransitionFunction = keyof typeof transitionFunctions;

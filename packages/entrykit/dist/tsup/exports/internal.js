import { createContext, forwardRef, useRef, useState, useEffect, useContext, isValidElement, cloneElement, Children, useCallback, useMemo } from 'react';
import { DialogClose, Root, DialogPortal, DialogContent, DialogTitle, DialogDescription } from '@radix-ui/react-dialog';
import ReactDOM from 'react-dom';
import { useMediaQuery, useResizeObserver, useIsMounted } from 'usehooks-ts';
import { mergeRefs } from 'react-merge-refs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useConfig, useClient, useAccount, useConnectorClient, createConfig, useChains, createConnector, ProviderNotFoundError, ChainNotConfiguredError, useConnectors, useConnect, useBalance as useBalance$1, useWatchBlockNumber, useDisconnect, useChainId, useWriteContract, useSwitchChain, usePublicClient, usePrepareTransactionRequest, useWalletClient } from 'wagmi';
import { transactionQueue } from '@latticexyz/common/actions';
import { parseAbi, formatEther, parseEther, http, createClient, fallback, keccak256, stringToHex, webSocket, createTransport, getAddress, SwitchChainError, numberToHex, UserRejectedRequestError, getAbiItem, parseEventLogs, isHex, encodeFunctionData, zeroAddress, parseErc6492Signature, toHex, formatGwei } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { createBundlerClient as createBundlerClient$1, entryPoint07Address, entryPoint06Abi, entryPoint06Address, entryPoint08Address, formatUserOperation, toPackedUserOperation, getUserOperationHash, entryPoint07Abi, formatUserOperationRequest, waitForUserOperationReceipt, sendUserOperation as sendUserOperation$1 } from 'viem/account-abstraction';
import { readContract, setBalance, estimateFeesPerGas, getLogs, getTransactionReceipt, writeContract, waitForTransactionReceipt, sendCalls, signTypedData } from 'viem/actions';
import { getAction } from 'viem/utils';
import createDebug from 'debug';
import { wiresaw, getUserOperationReceipt } from '@latticexyz/common/internal';
import { getDefaultConfig, ConnectKitProvider, useModal } from 'connectkit';
import { twMerge } from 'tailwind-merge';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { useQuery, queryOptions, useQueryClient, skipToken, useMutation } from '@tanstack/react-query';
import { isIdPlaceConnector } from '@latticexyz/id.place/internal';
import { defineStore, storeEventsAbi } from '@latticexyz/store';
import { getRecord } from '@latticexyz/store/internal';
import { resourceToHex, findCause, hexToResource } from '@latticexyz/common';
import worldConfig, { systemsConfig } from '@latticexyz/world/mud.config';
import { toSimpleSmartAccount } from 'permissionless/accounts';
import { persist } from 'zustand/middleware';
import { getBalanceQueryOptions as getBalanceQueryOptions$1 } from 'wagmi/query';
import IBaseWorldAbi from '@latticexyz/world/out/IBaseWorld.sol/IBaseWorld.abi.json';
import { callWithSignatureTypes } from '@latticexyz/world-module-callwithsignature/internal';
import moduleConfig from '@latticexyz/world-module-callwithsignature/mud.config';
import CallWithSignatureAbi from '@latticexyz/world-module-callwithsignature/out/CallWithSignatureSystem.sol/CallWithSignatureSystem.abi.json';
import { smartAccountActions } from 'permissionless';
import { callFrom, sendUserOperationFrom } from '@latticexyz/world/internal';
import * as Select from '@radix-ui/react-select';
import { TESTNET_RELAY_API, MAINNET_RELAY_API, fetchChainConfigs, createClient as createClient$1, LogLevel } from '@reservoir0x/relay-sdk';
import { getBalance as getBalance$1 } from 'wagmi/actions';
import { wait, isNotNull } from '@latticexyz/common/utils';
import { ErrorBoundary } from 'react-error-boundary';
import { safe, injected, coinbaseWallet } from 'wagmi/connectors';

// src/config/defineConfig.ts
function defineConfig(input) {
  return {
    ...input,
    appName: input.appName ?? document.title,
    appIcon: input.appIcon ?? document.querySelector("link[rel~='icon']")?.getAttribute("href") ?? "/favico.ico"
  };
}

// ../../node_modules/.pnpm/tailwindcss@3.4.18_tsx@4.20.6_yaml@2.8.1/node_modules/tailwindcss/tailwind.css?inline
var tailwind_default = '*, ::before, ::after {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-gradient-from-position:  ;\n  --tw-gradient-via-position:  ;\n  --tw-gradient-to-position:  ;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n  --tw-contain-size:  ;\n  --tw-contain-layout:  ;\n  --tw-contain-paint:  ;\n  --tw-contain-style:  ;\n}\n\n::backdrop {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-gradient-from-position:  ;\n  --tw-gradient-via-position:  ;\n  --tw-gradient-to-position:  ;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n  --tw-contain-size:  ;\n  --tw-contain-layout:  ;\n  --tw-contain-paint:  ;\n  --tw-contain-style:  ;\n}/*\n! tailwindcss v3.4.18 | MIT License | https://tailwindcss.com\n*//*\n1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)\n2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)\n*/\n\n*,\n::before,\n::after {\n  box-sizing: border-box; /* 1 */\n  border-width: 0; /* 2 */\n  border-style: solid; /* 2 */\n  border-color: #e5e7eb; /* 2 */\n}\n\n::before,\n::after {\n  --tw-content: \'\';\n}\n\n/*\n1. Use a consistent sensible line-height in all browsers.\n2. Prevent adjustments of font size after orientation changes in iOS.\n3. Use a more readable tab size.\n4. Use the user\'s configured `sans` font-family by default.\n5. Use the user\'s configured `sans` font-feature-settings by default.\n6. Use the user\'s configured `sans` font-variation-settings by default.\n7. Disable tap highlights on iOS\n*/\n\nhtml,\n:host {\n  line-height: 1.5; /* 1 */\n  -webkit-text-size-adjust: 100%; /* 2 */ /* 3 */\n  tab-size: 4; /* 3 */\n  font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; /* 4 */\n  font-feature-settings: normal; /* 5 */\n  font-variation-settings: normal; /* 6 */\n  -webkit-tap-highlight-color: transparent; /* 7 */\n}\n\n/*\n1. Remove the margin in all browsers.\n2. Inherit line-height from `html` so users can set them as a class directly on the `html` element.\n*/\n\nbody {\n  margin: 0; /* 1 */\n  line-height: inherit; /* 2 */\n}\n\n/*\n1. Add the correct height in Firefox.\n2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)\n3. Ensure horizontal rules are visible by default.\n*/\n\nhr {\n  height: 0; /* 1 */\n  color: inherit; /* 2 */\n  border-top-width: 1px; /* 3 */\n}\n\n/*\nAdd the correct text decoration in Chrome, Edge, and Safari.\n*/\n\nabbr:where([title]) {\n  -webkit-text-decoration: underline dotted;\n          text-decoration: underline dotted;\n}\n\n/*\nRemove the default font size and weight for headings.\n*/\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: inherit;\n  font-weight: inherit;\n}\n\n/*\nReset links to optimize for opt-in styling instead of opt-out.\n*/\n\na {\n  color: inherit;\n  text-decoration: inherit;\n}\n\n/*\nAdd the correct font weight in Edge and Safari.\n*/\n\nb,\nstrong {\n  font-weight: bolder;\n}\n\n/*\n1. Use the user\'s configured `mono` font-family by default.\n2. Use the user\'s configured `mono` font-feature-settings by default.\n3. Use the user\'s configured `mono` font-variation-settings by default.\n4. Correct the odd `em` font sizing in all browsers.\n*/\n\ncode,\nkbd,\nsamp,\npre {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; /* 1 */\n  font-feature-settings: normal; /* 2 */\n  font-variation-settings: normal; /* 3 */\n  font-size: 1em; /* 4 */\n}\n\n/*\nAdd the correct font size in all browsers.\n*/\n\nsmall {\n  font-size: 80%;\n}\n\n/*\nPrevent `sub` and `sup` elements from affecting the line height in all browsers.\n*/\n\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\n\nsub {\n  bottom: -0.25em;\n}\n\nsup {\n  top: -0.5em;\n}\n\n/*\n1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)\n2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)\n3. Remove gaps between table borders by default.\n*/\n\ntable {\n  text-indent: 0; /* 1 */\n  border-color: inherit; /* 2 */\n  border-collapse: collapse; /* 3 */\n}\n\n/*\n1. Change the font styles in all browsers.\n2. Remove the margin in Firefox and Safari.\n3. Remove default padding in all browsers.\n*/\n\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  font-family: inherit; /* 1 */\n  font-feature-settings: inherit; /* 1 */\n  font-variation-settings: inherit; /* 1 */\n  font-size: 100%; /* 1 */\n  font-weight: inherit; /* 1 */\n  line-height: inherit; /* 1 */\n  letter-spacing: inherit; /* 1 */\n  color: inherit; /* 1 */\n  margin: 0; /* 2 */\n  padding: 0; /* 3 */\n}\n\n/*\nRemove the inheritance of text transform in Edge and Firefox.\n*/\n\nbutton,\nselect {\n  text-transform: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Remove default button styles.\n*/\n\nbutton,\ninput:where([type=\'button\']),\ninput:where([type=\'reset\']),\ninput:where([type=\'submit\']) {\n  -webkit-appearance: button; /* 1 */\n  background-color: transparent; /* 2 */\n  background-image: none; /* 2 */\n}\n\n/*\nUse the modern Firefox focus style for all focusable elements.\n*/\n\n:-moz-focusring {\n  outline: auto;\n}\n\n/*\nRemove the additional `:invalid` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)\n*/\n\n:-moz-ui-invalid {\n  box-shadow: none;\n}\n\n/*\nAdd the correct vertical alignment in Chrome and Firefox.\n*/\n\nprogress {\n  vertical-align: baseline;\n}\n\n/*\nCorrect the cursor style of increment and decrement buttons in Safari.\n*/\n\n::-webkit-inner-spin-button,\n::-webkit-outer-spin-button {\n  height: auto;\n}\n\n/*\n1. Correct the odd appearance in Chrome and Safari.\n2. Correct the outline style in Safari.\n*/\n\n[type=\'search\'] {\n  -webkit-appearance: textfield; /* 1 */\n  outline-offset: -2px; /* 2 */\n}\n\n/*\nRemove the inner padding in Chrome and Safari on macOS.\n*/\n\n::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Change font properties to `inherit` in Safari.\n*/\n\n::-webkit-file-upload-button {\n  -webkit-appearance: button; /* 1 */\n  font: inherit; /* 2 */\n}\n\n/*\nAdd the correct display in Chrome and Safari.\n*/\n\nsummary {\n  display: list-item;\n}\n\n/*\nRemoves the default spacing and border for appropriate elements.\n*/\n\nblockquote,\ndl,\ndd,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6,\nhr,\nfigure,\np,\npre {\n  margin: 0;\n}\n\nfieldset {\n  margin: 0;\n  padding: 0;\n}\n\nlegend {\n  padding: 0;\n}\n\nol,\nul,\nmenu {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\n\n/*\nReset default styling for dialogs.\n*/\ndialog {\n  padding: 0;\n}\n\n/*\nPrevent resizing textareas horizontally by default.\n*/\n\ntextarea {\n  resize: vertical;\n}\n\n/*\n1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)\n2. Set the default placeholder color to the user\'s configured gray 400 color.\n*/\n\ninput::placeholder,\ntextarea::placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\n/*\nSet the default cursor for buttons.\n*/\n\nbutton,\n[role="button"] {\n  cursor: pointer;\n}\n\n/*\nMake sure disabled buttons don\'t get the pointer cursor.\n*/\n:disabled {\n  cursor: default;\n}\n\n/*\n1. Make replaced elements `display: block` by default. (https://github.com/mozdevs/cssremedy/issues/14)\n2. Add `vertical-align: middle` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)\n   This can trigger a poorly considered lint error in some tools but is included by design.\n*/\n\nimg,\nsvg,\nvideo,\ncanvas,\naudio,\niframe,\nembed,\nobject {\n  display: block; /* 1 */\n  vertical-align: middle; /* 2 */\n}\n\n/*\nConstrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)\n*/\n\nimg,\nvideo {\n  max-width: 100%;\n  height: auto;\n}\n\n/* Make elements with the HTML hidden attribute stay hidden by default */\n[hidden]:where(:not([hidden="until-found"])) {\n  display: none;\n}\n\n.container {\n  width: 100%;\n}\n\n@media (min-width: 640px) {\n\n  .container {\n    max-width: 640px;\n  }\n}\n\n@media (min-width: 768px) {\n\n  .container {\n    max-width: 768px;\n  }\n}\n\n@media (min-width: 1024px) {\n\n  .container {\n    max-width: 1024px;\n  }\n}\n\n@media (min-width: 1280px) {\n\n  .container {\n    max-width: 1280px;\n  }\n}\n\n@media (min-width: 1536px) {\n\n  .container {\n    max-width: 1536px;\n  }\n}\n\n.grid-cols-2.divide-y > :not([hidden]) ~ :not([hidden]):nth-child(-n + 2) {\n  border-top-width: 0;\n  border-bottom-width: 0;\n}\n\n.sr-only {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border-width: 0;\n}\n\n.pointer-events-none {\n  pointer-events: none;\n}\n\n.pointer-events-auto {\n  pointer-events: auto;\n}\n\n.fixed {\n  position: fixed;\n}\n\n.absolute {\n  position: absolute;\n}\n\n.relative {\n  position: relative;\n}\n\n.sticky {\n  position: sticky;\n}\n\n.inset-0 {\n  inset: 0px;\n}\n\n.bottom-0 {\n  bottom: 0px;\n}\n\n.left-0 {\n  left: 0px;\n}\n\n.right-0 {\n  right: 0px;\n}\n\n.top-0 {\n  top: 0px;\n}\n\n.col-start-1 {\n  grid-column-start: 1;\n}\n\n.row-start-1 {\n  grid-row-start: 1;\n}\n\n.m-0 {\n  margin: 0px;\n}\n\n.m-2 {\n  margin: 0.5rem;\n}\n\n.-mx-0\\.5 {\n  margin-left: -0.125rem;\n  margin-right: -0.125rem;\n}\n\n.-my-1 {\n  margin-top: -0.25rem;\n  margin-bottom: -0.25rem;\n}\n\n.-my-\\[0\\.125em\\] {\n  margin-top: -0.125em;\n  margin-bottom: -0.125em;\n}\n\n.mx-auto {\n  margin-left: auto;\n  margin-right: auto;\n}\n\n.-ml-3 {\n  margin-left: -0.75rem;\n}\n\n.-mr-1 {\n  margin-right: -0.25rem;\n}\n\n.-mt-2 {\n  margin-top: -0.5rem;\n}\n\n.mt-1 {\n  margin-top: 0.25rem;\n}\n\n.mt-4 {\n  margin-top: 1rem;\n}\n\n.block {\n  display: block;\n}\n\n.inline-block {\n  display: inline-block;\n}\n\n.flex {\n  display: flex;\n}\n\n.inline-flex {\n  display: inline-flex;\n}\n\n.table {\n  display: table;\n}\n\n.grid {\n  display: grid;\n}\n\n.inline-grid {\n  display: inline-grid;\n}\n\n.contents {\n  display: contents;\n}\n\n.hidden {\n  display: none;\n}\n\n.aspect-square {\n  aspect-ratio: 1 / 1;\n}\n\n.h-10 {\n  height: 2.5rem;\n}\n\n.h-12 {\n  height: 3rem;\n}\n\n.h-16 {\n  height: 4rem;\n}\n\n.h-3 {\n  height: 0.75rem;\n}\n\n.h-3\\.5 {\n  height: 0.875rem;\n}\n\n.h-4 {\n  height: 1rem;\n}\n\n.h-6 {\n  height: 1.5rem;\n}\n\n.h-64 {\n  height: 16rem;\n}\n\n.h-\\[1\\.25em\\] {\n  height: 1.25em;\n}\n\n.h-\\[1em\\] {\n  height: 1em;\n}\n\n.h-\\[2px\\] {\n  height: 2px;\n}\n\n.h-full {\n  height: 100%;\n}\n\n.max-h-\\[230px\\] {\n  max-height: 230px;\n}\n\n.max-h-full {\n  max-height: 100%;\n}\n\n.w-10 {\n  width: 2.5rem;\n}\n\n.w-16 {\n  width: 4rem;\n}\n\n.w-24 {\n  width: 6rem;\n}\n\n.w-28 {\n  width: 7rem;\n}\n\n.w-3 {\n  width: 0.75rem;\n}\n\n.w-3\\.5 {\n  width: 0.875rem;\n}\n\n.w-4 {\n  width: 1rem;\n}\n\n.w-48 {\n  width: 12rem;\n}\n\n.w-6 {\n  width: 1.5rem;\n}\n\n.w-60 {\n  width: 15rem;\n}\n\n.w-8 {\n  width: 2rem;\n}\n\n.w-\\[0\\.6em\\] {\n  width: 0.6em;\n}\n\n.w-\\[1\\.25em\\] {\n  width: 1.25em;\n}\n\n.w-\\[352px\\] {\n  width: 352px;\n}\n\n.w-full {\n  width: 100%;\n}\n\n.max-w-\\[26rem\\] {\n  max-width: 26rem;\n}\n\n.flex-shrink-0 {\n  flex-shrink: 0;\n}\n\n.flex-grow {\n  flex-grow: 1;\n}\n\n.-translate-y-2 {\n  --tw-translate-y: -0.5rem;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n\n.-translate-y-4 {\n  --tw-translate-y: -1rem;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n\n.translate-x-2 {\n  --tw-translate-x: 0.5rem;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n\n.translate-y-0 {\n  --tw-translate-y: 0px;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n\n.scale-100 {\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n\n.scale-50 {\n  --tw-scale-x: .5;\n  --tw-scale-y: .5;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n\n.transform {\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n\n@keyframes spin {\n\n  to {\n    transform: rotate(360deg);\n  }\n}\n\n.animate-spin {\n  animation: spin 1s linear infinite;\n}\n\n.cursor-pointer {\n  cursor: pointer;\n}\n\n.cursor-text {\n  cursor: text;\n}\n\n.grid-cols-2 {\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n}\n\n.grid-cols-\\[1fr_auto_1fr\\] {\n  grid-template-columns: 1fr auto 1fr;\n}\n\n.flex-col {\n  flex-direction: column;\n}\n\n.place-items-center {\n  place-items: center;\n}\n\n.items-end {\n  align-items: flex-end;\n}\n\n.items-center {\n  align-items: center;\n}\n\n.justify-end {\n  justify-content: flex-end;\n}\n\n.justify-center {\n  justify-content: center;\n}\n\n.justify-between {\n  justify-content: space-between;\n}\n\n.gap-1 {\n  gap: 0.25rem;\n}\n\n.gap-2 {\n  gap: 0.5rem;\n}\n\n.gap-2\\.5 {\n  gap: 0.625rem;\n}\n\n.gap-4 {\n  gap: 1rem;\n}\n\n.gap-5 {\n  gap: 1.25rem;\n}\n\n.gap-6 {\n  gap: 1.5rem;\n}\n\n.space-y-2 > :not([hidden]) ~ :not([hidden]) {\n  --tw-space-y-reverse: 0;\n  margin-top: calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));\n  margin-bottom: calc(0.5rem * var(--tw-space-y-reverse));\n}\n\n.space-y-6 > :not([hidden]) ~ :not([hidden]) {\n  --tw-space-y-reverse: 0;\n  margin-top: calc(1.5rem * calc(1 - var(--tw-space-y-reverse)));\n  margin-bottom: calc(1.5rem * var(--tw-space-y-reverse));\n}\n\n.divide-y > :not([hidden]) ~ :not([hidden]) {\n  --tw-divide-y-reverse: 0;\n  border-top-width: calc(1px * calc(1 - var(--tw-divide-y-reverse)));\n  border-bottom-width: calc(1px * var(--tw-divide-y-reverse));\n}\n\n.divide-neutral-700 > :not([hidden]) ~ :not([hidden]) {\n  --tw-divide-opacity: 1;\n  border-color: rgb(64 64 64 / var(--tw-divide-opacity, 1));\n}\n\n.divide-neutral-800 > :not([hidden]) ~ :not([hidden]) {\n  --tw-divide-opacity: 1;\n  border-color: rgb(38 38 38 / var(--tw-divide-opacity, 1));\n}\n\n.self-auto {\n  align-self: auto;\n}\n\n.self-center {\n  align-self: center;\n}\n\n.overflow-auto {\n  overflow: auto;\n}\n\n.overflow-clip {\n  overflow: clip;\n}\n\n.overflow-y-auto {\n  overflow-y: auto;\n}\n\n.whitespace-nowrap {\n  white-space: nowrap;\n}\n\n.whitespace-pre-wrap {\n  white-space: pre-wrap;\n}\n\n.rounded-full {\n  border-radius: 9999px;\n}\n\n.border {\n  border-width: 1px;\n}\n\n.border-2 {\n  border-width: 2px;\n}\n\n.border-4 {\n  border-width: 4px;\n}\n\n.border-dashed {\n  border-style: dashed;\n}\n\n.border-neutral-300 {\n  --tw-border-opacity: 1;\n  border-color: rgb(212 212 212 / var(--tw-border-opacity, 1));\n}\n\n.border-neutral-700 {\n  --tw-border-opacity: 1;\n  border-color: rgb(64 64 64 / var(--tw-border-opacity, 1));\n}\n\n.border-transparent {\n  border-color: transparent;\n}\n\n.border-white\\/50 {\n  border-color: rgb(255 255 255 / 0.5);\n}\n\n.bg-black\\/10 {\n  background-color: rgb(0 0 0 / 0.1);\n}\n\n.bg-blue-600 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(37 99 235 / var(--tw-bg-opacity, 1));\n}\n\n.bg-blue-700 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(29 78 216 / var(--tw-bg-opacity, 1));\n}\n\n.bg-blue-700\\/60 {\n  background-color: rgb(29 78 216 / 0.6);\n}\n\n.bg-green-600 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(22 163 74 / var(--tw-bg-opacity, 1));\n}\n\n.bg-neutral-100 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(245 245 245 / var(--tw-bg-opacity, 1));\n}\n\n.bg-neutral-700 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(64 64 64 / var(--tw-bg-opacity, 1));\n}\n\n.bg-neutral-800 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(38 38 38 / var(--tw-bg-opacity, 1));\n}\n\n.bg-neutral-800\\/85 {\n  background-color: rgb(38 38 38 / 0.85);\n}\n\n.bg-neutral-900 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(23 23 23 / var(--tw-bg-opacity, 1));\n}\n\n.bg-orange-500 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(249 115 22 / var(--tw-bg-opacity, 1));\n}\n\n.bg-orange-600 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(234 88 12 / var(--tw-bg-opacity, 1));\n}\n\n.bg-red-600 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(220 38 38 / var(--tw-bg-opacity, 1));\n}\n\n.bg-transparent {\n  background-color: transparent;\n}\n\n.bg-gradient-to-b {\n  background-image: linear-gradient(to bottom, var(--tw-gradient-stops));\n}\n\n.from-transparent {\n  --tw-gradient-from: transparent var(--tw-gradient-from-position);\n  --tw-gradient-to: rgb(0 0 0 / 0) var(--tw-gradient-to-position);\n  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);\n}\n\n.to-blue-700 {\n  --tw-gradient-to: #1d4ed8 var(--tw-gradient-to-position);\n}\n\n.bg-cover {\n  background-size: cover;\n}\n\n.bg-center {\n  background-position: center;\n}\n\n.bg-no-repeat {\n  background-repeat: no-repeat;\n}\n\n.object-cover {\n  object-fit: cover;\n}\n\n.p-1 {\n  padding: 0.25rem;\n}\n\n.p-2 {\n  padding: 0.5rem;\n}\n\n.p-2\\.5 {\n  padding: 0.625rem;\n}\n\n.p-3 {\n  padding: 0.75rem;\n}\n\n.p-4 {\n  padding: 1rem;\n}\n\n.p-6 {\n  padding: 1.5rem;\n}\n\n.p-\\[\\.75em\\] {\n  padding: .75em;\n}\n\n.px-8 {\n  padding-left: 2rem;\n  padding-right: 2rem;\n}\n\n.py-1 {\n  padding-top: 0.25rem;\n  padding-bottom: 0.25rem;\n}\n\n.py-2 {\n  padding-top: 0.5rem;\n  padding-bottom: 0.5rem;\n}\n\n.py-8 {\n  padding-top: 2rem;\n  padding-bottom: 2rem;\n}\n\n.pb-2 {\n  padding-bottom: 0.5rem;\n}\n\n.pb-8 {\n  padding-bottom: 2rem;\n}\n\n.pt-10 {\n  padding-top: 2.5rem;\n}\n\n.pt-8 {\n  padding-top: 2rem;\n}\n\n.text-left {\n  text-align: left;\n}\n\n.text-center {\n  text-align: center;\n}\n\n.font-mono {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;\n}\n\n.text-2xl {\n  font-size: 1.5rem;\n  line-height: 2rem;\n}\n\n.text-\\[\\.75em\\] {\n  font-size: .75em;\n}\n\n.text-base {\n  font-size: 1rem;\n  line-height: 1.5rem;\n}\n\n.text-lg {\n  font-size: 1.125rem;\n  line-height: 1.75rem;\n}\n\n.text-sm {\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n}\n\n.text-xs {\n  font-size: 0.75rem;\n  line-height: 1rem;\n}\n\n.font-bold {\n  font-weight: 700;\n}\n\n.font-medium {\n  font-weight: 500;\n}\n\n.leading-loose {\n  line-height: 2;\n}\n\n.leading-none {\n  line-height: 1;\n}\n\n.tracking-\\[-1ch\\] {\n  letter-spacing: -1ch;\n}\n\n.text-amber-500 {\n  --tw-text-opacity: 1;\n  color: rgb(245 158 11 / var(--tw-text-opacity, 1));\n}\n\n.text-black {\n  --tw-text-opacity: 1;\n  color: rgb(0 0 0 / var(--tw-text-opacity, 1));\n}\n\n.text-gray-400 {\n  --tw-text-opacity: 1;\n  color: rgb(156 163 175 / var(--tw-text-opacity, 1));\n}\n\n.text-green-600 {\n  --tw-text-opacity: 1;\n  color: rgb(22 163 74 / var(--tw-text-opacity, 1));\n}\n\n.text-neutral-300 {\n  --tw-text-opacity: 1;\n  color: rgb(212 212 212 / var(--tw-text-opacity, 1));\n}\n\n.text-neutral-400 {\n  --tw-text-opacity: 1;\n  color: rgb(163 163 163 / var(--tw-text-opacity, 1));\n}\n\n.text-neutral-500 {\n  --tw-text-opacity: 1;\n  color: rgb(115 115 115 / var(--tw-text-opacity, 1));\n}\n\n.text-orange-500 {\n  --tw-text-opacity: 1;\n  color: rgb(249 115 22 / var(--tw-text-opacity, 1));\n}\n\n.text-transparent {\n  color: transparent;\n}\n\n.text-white {\n  --tw-text-opacity: 1;\n  color: rgb(255 255 255 / var(--tw-text-opacity, 1));\n}\n\n.text-white\\/20 {\n  color: rgb(255 255 255 / 0.2);\n}\n\n.text-white\\/50 {\n  color: rgb(255 255 255 / 0.5);\n}\n\n.text-white\\/80 {\n  color: rgb(255 255 255 / 0.8);\n}\n\n.underline {\n  text-decoration-line: underline;\n}\n\n.decoration-neutral-500 {\n  text-decoration-color: #737373;\n}\n\n.underline-offset-4 {\n  text-underline-offset: 4px;\n}\n\n.opacity-0 {\n  opacity: 0;\n}\n\n.opacity-100 {\n  opacity: 1;\n}\n\n.opacity-25 {\n  opacity: 0.25;\n}\n\n.opacity-30 {\n  opacity: 0.3;\n}\n\n.opacity-50 {\n  opacity: 0.5;\n}\n\n.opacity-75 {\n  opacity: 0.75;\n}\n\n.outline-none {\n  outline: 2px solid transparent;\n  outline-offset: 2px;\n}\n\n.ring-1 {\n  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);\n  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);\n  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);\n}\n\n.ring-2 {\n  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);\n  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);\n  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);\n}\n\n.ring-neutral-700\\/50 {\n  --tw-ring-color: rgb(64 64 64 / 0.5);\n}\n\n.ring-transparent {\n  --tw-ring-color: transparent;\n}\n\n.filter {\n  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);\n}\n\n.transition {\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-duration: 150ms;\n}\n\n.transition-colors {\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-duration: 150ms;\n}\n\n.duration-100 {\n  transition-duration: 100ms;\n}\n\n.duration-300 {\n  transition-duration: 300ms;\n}\n\n.ease-linear {\n  transition-timing-function: linear;\n}\n\n@keyframes enter {\n\n  from {\n    opacity: var(--tw-enter-opacity, 1);\n    transform: translate3d(var(--tw-enter-translate-x, 0), var(--tw-enter-translate-y, 0), 0) scale3d(var(--tw-enter-scale, 1), var(--tw-enter-scale, 1), var(--tw-enter-scale, 1)) rotate(var(--tw-enter-rotate, 0));\n  }\n}\n\n@keyframes exit {\n\n  to {\n    opacity: var(--tw-exit-opacity, 1);\n    transform: translate3d(var(--tw-exit-translate-x, 0), var(--tw-exit-translate-y, 0), 0) scale3d(var(--tw-exit-scale, 1), var(--tw-exit-scale, 1), var(--tw-exit-scale, 1)) rotate(var(--tw-exit-rotate, 0));\n  }\n}\n\n.animate-in {\n  animation-name: enter;\n  animation-duration: 150ms;\n  --tw-enter-opacity: initial;\n  --tw-enter-scale: initial;\n  --tw-enter-rotate: initial;\n  --tw-enter-translate-x: initial;\n  --tw-enter-translate-y: initial;\n}\n\n.animate-out {\n  animation-name: exit;\n  animation-duration: 150ms;\n  --tw-exit-opacity: initial;\n  --tw-exit-scale: initial;\n  --tw-exit-rotate: initial;\n  --tw-exit-translate-x: initial;\n  --tw-exit-translate-y: initial;\n}\n\n.fade-in {\n  --tw-enter-opacity: 0;\n}\n\n.fade-out {\n  --tw-exit-opacity: 0;\n}\n\n.slide-in-from-bottom-16 {\n  --tw-enter-translate-y: 4rem;\n}\n\n.slide-in-from-bottom-2 {\n  --tw-enter-translate-y: 0.5rem;\n}\n\n.slide-in-from-bottom-8 {\n  --tw-enter-translate-y: 2rem;\n}\n\n.slide-in-from-top-2 {\n  --tw-enter-translate-y: -0.5rem;\n}\n\n.animate-duration-300 {\n  animation-duration: 300ms;\n}\n\n.ease-linear {\n  animation-timing-function: linear;\n}\n\n@property --tw-border-gradient-angle {\n  syntax: \'<angle>\';\n  inherits: true;\n  initial-value: 0deg;\n}\n\n@property --tw-conic-gradient-angle {\n  syntax: \'<angle>\';\n  inherits: true;\n  initial-value: 0deg;\n}\n\n@keyframes border-gradient {\n\n  to {\n    --tw-border-gradient-angle: 360deg;\n  }\n}\n\n.placeholder\\:text-neutral-500::placeholder {\n  --tw-text-opacity: 1;\n  color: rgb(115 115 115 / var(--tw-text-opacity, 1));\n}\n\n.after\\:select-none::after {\n  content: var(--tw-content);\n  -webkit-user-select: none;\n          user-select: none;\n}\n\n.after\\:content-\\[\\\'\\2026\\\'\\]::after {\n  --tw-content: \'\u2026\';\n  content: var(--tw-content);\n}\n\n.focus-within\\:border-transparent:focus-within {\n  border-color: transparent;\n}\n\n.focus-within\\:ring-orange-500:focus-within {\n  --tw-ring-opacity: 1;\n  --tw-ring-color: rgb(249 115 22 / var(--tw-ring-opacity, 1));\n}\n\n.hover\\:bg-blue-500:hover {\n  --tw-bg-opacity: 1;\n  background-color: rgb(59 130 246 / var(--tw-bg-opacity, 1));\n}\n\n.hover\\:bg-neutral-200:hover {\n  --tw-bg-opacity: 1;\n  background-color: rgb(229 229 229 / var(--tw-bg-opacity, 1));\n}\n\n.hover\\:bg-orange-400:hover {\n  --tw-bg-opacity: 1;\n  background-color: rgb(251 146 60 / var(--tw-bg-opacity, 1));\n}\n\n.hover\\:text-white:hover {\n  --tw-text-opacity: 1;\n  color: rgb(255 255 255 / var(--tw-text-opacity, 1));\n}\n\n.hover\\:text-white\\/40:hover {\n  color: rgb(255 255 255 / 0.4);\n}\n\n.hover\\:text-white\\/80:hover {\n  color: rgb(255 255 255 / 0.8);\n}\n\n.hover\\:decoration-orange-500:hover {\n  text-decoration-color: #f97316;\n}\n\n.hover\\:brightness-125:hover {\n  --tw-brightness: brightness(1.25);\n  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);\n}\n\n.focus\\:border-orange-500:focus {\n  --tw-border-opacity: 1;\n  border-color: rgb(249 115 22 / var(--tw-border-opacity, 1));\n}\n\n.focus\\:border-yellow-400:focus {\n  --tw-border-opacity: 1;\n  border-color: rgb(250 204 21 / var(--tw-border-opacity, 1));\n}\n\n.focus\\:bg-neutral-700:focus {\n  --tw-bg-opacity: 1;\n  background-color: rgb(64 64 64 / var(--tw-bg-opacity, 1));\n}\n\n.active\\:bg-orange-600:active {\n  --tw-bg-opacity: 1;\n  background-color: rgb(234 88 12 / var(--tw-bg-opacity, 1));\n}\n\n.active\\:brightness-150:active {\n  --tw-brightness: brightness(1.5);\n  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);\n}\n\n.group:hover .group-hover\\:pointer-events-none {\n  pointer-events: none;\n}\n\n.group:hover .group-hover\\:pointer-events-auto {\n  pointer-events: auto;\n}\n\n.group:hover .group-hover\\:inline-block {\n  display: inline-block;\n}\n\n.group:hover .group-hover\\:hidden {\n  display: none;\n}\n\n.group:hover .group-hover\\:rotate-90 {\n  --tw-rotate: 90deg;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n\n.group:hover .group-hover\\:opacity-0 {\n  opacity: 0;\n}\n\n.group:hover .group-hover\\:opacity-100 {\n  opacity: 1;\n}\n\n.peer:placeholder-shown ~ .peer-placeholder-shown\\:text-neutral-500 {\n  --tw-text-opacity: 1;\n  color: rgb(115 115 115 / var(--tw-text-opacity, 1));\n}\n\n.aria-busy\\:pointer-events-none[aria-busy="true"] {\n  pointer-events: none;\n}\n\n.aria-busy\\:bg-blue-500[aria-busy="true"] {\n  --tw-bg-opacity: 1;\n  background-color: rgb(59 130 246 / var(--tw-bg-opacity, 1));\n}\n\n.aria-disabled\\:pointer-events-none[aria-disabled="true"] {\n  pointer-events: none;\n}\n\n.aria-disabled\\:opacity-50[aria-disabled="true"] {\n  opacity: 0.5;\n}\n\n.group[aria-busy="true"] .group-aria-busy\\:inline {\n  display: inline;\n}\n\n.group[aria-busy="true"] .group-aria-busy\\:hidden {\n  display: none;\n}\n\n.group\\/button[aria-busy="true"] .group-aria-busy\\/button\\:translate-x-0 {\n  --tw-translate-x: 0px;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n\n.group[aria-busy="true"] .group-aria-busy\\:scale-100 {\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n\n.group[aria-busy="true"] .group-aria-busy\\:scale-125 {\n  --tw-scale-x: 1.25;\n  --tw-scale-y: 1.25;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n\n.group\\/button[aria-busy="true"] .group-aria-busy\\/button\\:opacity-100 {\n  opacity: 1;\n}\n\n.group[aria-busy="true"] .group-aria-busy\\:opacity-0 {\n  opacity: 0;\n}\n\n.group[aria-busy="true"] .group-aria-busy\\:opacity-100 {\n  opacity: 1;\n}\n\n.group\\/button[aria-busy="true"] .group-aria-busy\\/button\\:duration-300 {\n  transition-duration: 300ms;\n}\n\n.group[aria-expanded="true"] .group-aria-expanded\\:inline {\n  display: inline;\n}\n\n.group[aria-expanded="true"] .group-aria-expanded\\:hidden {\n  display: none;\n}\n\n.data-\\[highlighted\\]\\:bg-neutral-200[data-highlighted] {\n  --tw-bg-opacity: 1;\n  background-color: rgb(229 229 229 / var(--tw-bg-opacity, 1));\n}\n\n.data-\\[state\\=checked\\]\\:bg-neutral-900[data-state="checked"] {\n  --tw-bg-opacity: 1;\n  background-color: rgb(23 23 23 / var(--tw-bg-opacity, 1));\n}\n\n.links\\:font-medium a[href]:not(.links-unset) {\n  font-weight: 500;\n}\n\n.links\\:text-white a[href]:not(.links-unset) {\n  --tw-text-opacity: 1;\n  color: rgb(255 255 255 / var(--tw-text-opacity, 1));\n}\n\n.links\\:underline a[href]:not(.links-unset) {\n  text-decoration-line: underline;\n}\n\n.links\\:decoration-neutral-500 a[href]:not(.links-unset) {\n  text-decoration-color: #737373;\n}\n\n.links\\:underline-offset-4 a[href]:not(.links-unset) {\n  text-underline-offset: 4px;\n}\n\n.hover\\:links\\:decoration-orange-500 a[href]:not(.links-unset):hover {\n  text-decoration-color: #f97316;\n}\n\n@media (min-width: 640px) {\n\n  .sm\\:items-center {\n    align-items: center;\n  }\n}\n\n.dark\\:border-neutral-700:where([data-theme="dark"], [data-theme="dark"] *) {\n  --tw-border-opacity: 1;\n  border-color: rgb(64 64 64 / var(--tw-border-opacity, 1));\n}\n\n.dark\\:bg-neutral-800:where([data-theme="dark"], [data-theme="dark"] *) {\n  --tw-bg-opacity: 1;\n  background-color: rgb(38 38 38 / var(--tw-bg-opacity, 1));\n}\n\n.dark\\:bg-white\\/10:where([data-theme="dark"], [data-theme="dark"] *) {\n  background-color: rgb(255 255 255 / 0.1);\n}\n\n.dark\\:text-white:where([data-theme="dark"], [data-theme="dark"] *) {\n  --tw-text-opacity: 1;\n  color: rgb(255 255 255 / var(--tw-text-opacity, 1));\n}\n\n.dark\\:hover\\:bg-neutral-700:hover:where([data-theme="dark"], [data-theme="dark"] *) {\n  --tw-bg-opacity: 1;\n  background-color: rgb(64 64 64 / var(--tw-bg-opacity, 1));\n}\n\n.\\[\\&_\\>_\\:is\\(dt\\2c dd\\)\\]\\:px-1 > :is(dt,dd) {\n  padding-left: 0.25rem;\n  padding-right: 0.25rem;\n}\n\n.\\[\\&_\\>_dd\\]\\:text-right > dd {\n  text-align: right;\n}\n';
var Context = createContext(null);
function FrameProvider({ frame, children }) {
  const value = useContext(Context);
  if (value) throw new Error("`FrameProvider` can only be used once.");
  return /* @__PURE__ */ jsx(Context.Provider, { value: { frame }, children });
}
function useFrame() {
  const value = useContext(Context);
  if (!value) throw new Error("`useFrame` can only be used within a `FrameProvider`.");
  return value;
}
async function estimateUserOperationGas(_params) {
  return formatUserOperationRequest({
    callGasLimit: 20000000n,
    preVerificationGas: 200000n,
    verificationGasLimit: 2000000n,
    paymasterVerificationGasLimit: 200000n,
    paymasterPostOpGasLimit: 200000n
  });
}
async function sendUserOperation({
  executor,
  rpcUserOp
}) {
  const userOp = formatUserOperation(rpcUserOp);
  const packedUserOp = toPackedUserOperation(userOp);
  const userOpHash = getUserOperationHash({
    userOperation: userOp,
    chainId: executor.chain.id,
    entryPointVersion: "0.7",
    entryPointAddress: entryPoint07Address
  });
  const transactionHash = await getAction(
    executor,
    writeContract,
    "writeContract"
  )({
    abi: entryPoint07Abi,
    address: entryPoint07Address,
    functionName: "handleOps",
    args: [[packedUserOp], executor.account.address],
    chain: executor.chain,
    account: executor.account
  });
  const receipt = await getAction(
    executor,
    waitForTransactionReceipt,
    "waitForTransactionReceipt"
  )({ hash: transactionHash });
  const parsedLogs = parseEventLogs({
    logs: receipt.logs,
    abi: entryPoint07Abi,
    eventName: "UserOperationEvent"
  });
  return {
    success: parsedLogs[0].args.success,
    userOpHash,
    receipt
  };
}
var debug = createDebug("mud:entrykit");
var error = createDebug("mud:entrykit");
debug.log = console.debug.bind(console);
error.log = console.error.bind(console);

// src/quarry/debug.ts
var debug2 = debug.extend("quarry");
function userOpExecutor({
  executor,
  fallbackDefaultTransport
}) {
  return (opts) => {
    debug2("using a local user op executor", executor.account.address);
    if (executor.chain.id === 31337) {
      debug2("setting executor balance");
      setBalance(
        executor.extend(() => ({ mode: "anvil" })),
        {
          address: executor.account.address,
          value: parseEther("100")
        }
      );
    }
    const receipts = /* @__PURE__ */ new Map();
    const request = async ({ method, params }) => {
      if (method === "eth_chainId") {
        return numberToHex(executor.chain.id);
      }
      if (method === "eth_supportedEntryPoints") {
        return [entryPoint07Address];
      }
      if (method === "eth_sendUserOperation") {
        const [rpcUserOp, entrypoint] = params;
        if (entrypoint === entryPoint07Address) {
          const result = await sendUserOperation({ executor, rpcUserOp });
          receipts.set(result.userOpHash, result);
          return result.userOpHash;
        }
      }
      if (method === "eth_getUserOperationReceipt") {
        const [userOpHash] = params;
        if (receipts.has(userOpHash)) return receipts.get(userOpHash);
        const event = getAbiItem({
          abi: entryPoint06Abi,
          name: "UserOperationEvent"
        });
        const log = (await getLogs(executor, {
          address: [entryPoint06Address, entryPoint07Address, entryPoint08Address],
          event,
          args: { userOpHash }
        })).at(0);
        if (!log) return null;
        const hash = log.transactionHash;
        const receipt = await getTransactionReceipt(executor, { hash });
        const userOpReceipt = getUserOperationReceipt(userOpHash, {
          ...receipt,
          blobGasPrice: receipt.blobGasPrice ? numberToHex(receipt.blobGasPrice) : void 0,
          blobGasUsed: receipt.blobGasUsed ? numberToHex(receipt.blobGasUsed) : void 0,
          blockNumber: numberToHex(receipt.blockNumber),
          cumulativeGasUsed: numberToHex(receipt.cumulativeGasUsed),
          effectiveGasPrice: numberToHex(receipt.effectiveGasPrice),
          gasUsed: numberToHex(receipt.gasUsed),
          logs: receipt.logs.map((log2) => ({
            ...log2,
            blockNumber: numberToHex(log2.blockNumber),
            logIndex: numberToHex(log2.logIndex),
            transactionIndex: numberToHex(log2.transactionIndex)
          })),
          status: receipt.status,
          transactionIndex: numberToHex(receipt.transactionIndex)
        });
        return userOpReceipt;
      }
      if (method === "eth_estimateUserOperationGas") {
        return await estimateUserOperationGas();
      }
      debug2(`userOpExecutor: method "${method}" not overridden, falling back to fallback transport`);
      const { request: fallbackRequest } = fallbackDefaultTransport(opts);
      return fallbackRequest({ method, params });
    };
    return createTransport({
      key: "userOpExecutor",
      type: "userOpExecutor",
      name: "User Operation Executor Transport",
      request
    });
  };
}
function getBundlerTransport(chain) {
  if ("wiresaw" in chain.rpcUrls) {
    return wiresaw();
  }
  const bundlerHttpUrl = chain.rpcUrls.bundler?.http[0];
  if (bundlerHttpUrl) {
    return http(bundlerHttpUrl);
  }
  if (chain.id === 31337) {
    return userOpExecutor({
      executor: createClient({
        chain,
        transport: fallback([webSocket(), http()]),
        account: privateKeyToAccount(keccak256(stringToHex("local user op executor"))),
        pollingInterval: 10
      }).extend(transactionQueue()),
      fallbackDefaultTransport: http()
    });
  }
  throw new Error(`Chain ${chain.id} config did not include a bundler RPC URL.`);
}
var Context2 = createContext(null);
function EntryKitConfigProvider({ config, children }) {
  const currentConfig = useContext(Context2);
  if (currentConfig) throw new Error("`EntryKitProvider` can only be used once.");
  const chains = useChains();
  const chain = chains.find(({ id }) => id === config.chainId);
  if (!chain) throw new Error(`Could not find configured chain for chain ID ${config.chainId}.`);
  getBundlerTransport(chain);
  return /* @__PURE__ */ jsx(
    ConnectKitProvider,
    {
      theme: "midnight",
      options: {
        enforceSupportedChains: true,
        // Prevent Wagmi trying to switch chains after connection
        // https://github.com/wevm/wagmi/blob/f5b717ccf8a5b283263cadc984ba00b354bcefae/packages/core/src/connectors/injected.ts#L174-L182
        initialChainId: chain.id
      },
      children: /* @__PURE__ */ jsx(Context2.Provider, { value: { ...config, chain }, children })
    }
  );
}
function useEntryKitConfig() {
  const config = useContext(Context2);
  if (!config) throw new Error("`useEntryKitConfig` can only be used within a `EntryKitProvider`.");
  return config;
}

// src/useTheme.ts
function useTheme() {
  const { theme: initialTheme } = useEntryKitConfig();
  const darkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = initialTheme ?? (darkMode ? "dark" : "light");
  return theme;
}
function Resizer({
  onSize,
  ...props
}) {
  const ref = useRef(null);
  useResizeObserver({ ref, onResize: onSize });
  return /* @__PURE__ */ jsx("div", { ref, ...props, style: { ...props.style, display: "inline-grid" } });
}
var Shadow = forwardRef(function Shadow2({ mode, children }, forwardedRef) {
  const frameRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const frame = loaded ? frameRef.current : null;
  const [frameSize, setFrameSize] = useState({
    width: void 0,
    height: void 0
  });
  const frameDocument = frame?.contentDocument;
  const theme = useTheme();
  useEffect(() => {
    if (frameDocument) {
      frameDocument.body.setAttribute("data-theme", theme);
    }
  }, [frameDocument, theme]);
  const frameStyle = mode === "modal" ? {
    all: "unset",
    display: "block",
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    // one less than ConnectKit's modal z-index
    // so that ConnectKit can overlap properly
    zIndex: "2147483645"
  } : frameSize.width && frameSize.height ? {
    all: "unset",
    display: "inline-grid",
    width: `${frameSize.width}px`,
    height: `${frameSize.height}px`
  } : {
    all: "unset",
    display: "block",
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    opacity: 0,
    pointerEvents: "none"
  };
  return /* @__PURE__ */ jsx(
    "iframe",
    {
      ref: mergeRefs([forwardedRef, frameRef]),
      style: frameStyle,
      onLoad: () => setLoaded(true),
      srcDoc: "<!doctype html><title>\u2026</title>",
      children: frameDocument ? ReactDOM.createPortal(
        /* @__PURE__ */ jsxs(FrameProvider, { frame, children: [
          /* @__PURE__ */ jsx("div", { children: mode === "modal" ? children : /* @__PURE__ */ jsx(Resizer, { onSize: setFrameSize, children }) }),
          /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: tailwind_default } })
        ] }),
        frameDocument.body
      ) : null
    }
  );
});
function Modal({ open, onOpenChange, children }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.defaultPrevented) return;
      if (event.key === "Escape" && open) {
        event.preventDefault();
        onOpenChange?.(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);
  return /* @__PURE__ */ jsx(Root, { open, onOpenChange, children: /* @__PURE__ */ jsx(DialogPortal, { children: /* @__PURE__ */ jsxs(Shadow, { mode: "modal", children: [
    /* @__PURE__ */ jsx("div", { className: twMerge("fixed inset-0", "bg-neutral-800/85", "animate-in animate-duration-300 fade-in") }),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: twMerge(
          "fixed inset-0",
          "grid items-end sm:items-center",
          "animate-in animate-duration-300 fade-in slide-in-from-bottom-16"
        ),
        children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(DialogContent, { className: "outline-none w-full max-w-[26rem] mx-auto", children: [
          /* @__PURE__ */ jsx(DialogTitle, { className: "sr-only", children: "EntryKit" }),
          /* @__PURE__ */ jsx(DialogDescription, { className: "sr-only", children: "Sign in to this app" }),
          children
        ] }) })
      }
    )
  ] }) }) });
}
var store = createStore(() => ({ open: false }));
function useAccountModal() {
  const accountModalOpen = useStore(store, (state) => state.open);
  const openAccountModal = useCallback(() => {
    store.setState({ open: true });
  }, []);
  const closeAccountModal = useCallback(() => {
    store.setState({ open: false });
  }, []);
  const toggleAccountModal = useCallback((open) => {
    store.setState({ open });
  }, []);
  return useMemo(
    () => ({
      accountModalOpen,
      openAccountModal,
      closeAccountModal,
      toggleAccountModal
    }),
    [accountModalOpen, openAccountModal, closeAccountModal, toggleAccountModal]
  );
}
function PendingIcon({ className, ...props }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      className: twMerge("-my-[0.125em] h-[1.25em] w-[1.25em] animate-spin", className),
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      ...props,
      children: [
        /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
        /* @__PURE__ */ jsx(
          "path",
          {
            className: "opacity-75",
            fill: "currentColor",
            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          }
        )
      ]
    }
  );
}
var buttonClassName = ({ variant = "secondary" } = {}) => twMerge(
  "group/button self-center leading-none outline-none border-4 border-transparent",
  "transition hover:brightness-125 active:brightness-150",
  "focus:border-orange-500",
  "aria-disabled:pointer-events-none aria-busy:pointer-events-none",
  // TODO: better disabled state
  "aria-disabled:opacity-50",
  "p-[.75em] font-medium",
  {
    primary: twMerge("bg-orange-600 text-white focus:border-yellow-400"),
    secondary: twMerge("bg-neutral-700 text-white focus:border-orange-500"),
    tertiary: twMerge("bg-neutral-800 text-white focus:border-orange-500")
  }[variant]
);
var Button = ({ pending, variant, type, className, children, disabled, ...props }) => {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: type || "button",
      className: twMerge(buttonClassName({ variant}), className),
      "aria-busy": pending,
      "aria-disabled": disabled,
      disabled: disabled || pending,
      ...props,
      children: /* @__PURE__ */ jsxs("span", { className: "grid grid-cols-[1fr_auto_1fr] gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "flex items-center justify-end text-[.75em]", children: /* @__PURE__ */ jsx("span", { className: "transition opacity-0 translate-x-2 group-aria-busy/button:opacity-100 group-aria-busy/button:translate-x-0 duration-100 group-aria-busy/button:duration-300", children: /* @__PURE__ */ jsx(PendingIcon, {}) }) }),
        /* @__PURE__ */ jsx("span", { children })
      ] })
    }
  );
};
function Logo({ className, ...props }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 8 8",
      fill: "currentColor",
      shapeRendering: "crispEdges",
      className: twMerge("-my-[0.125em] h-[1.25em] w-[1.25em]", className),
      ...props,
      children: [
        /* @__PURE__ */ jsx("path", { d: "M0 0h1v1H0zm0 1h1v1H0zm0 1h1v1H0zm0 1h1v1H0zm0 1h1v1H0zm0 1h1v1H0zm0 1h1v1H0zm0 1h1v1H0zm1 0h1v1H1zm1 0h1v1H2zm1 0h1v1H3zm1 0h1v1H4zm1 0h1v1H5zm2-1h1v1H7zm0 1h1v1H7zM6 7h1v1H6zm1-2h1v1H7zm0-1h1v1H7zm0-1h1v1H7z" }),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M2 2h1v1H2zm0 1h1v1H2zm0 1h1v1H2zm0 1h1v1H2zm1-3h1v1H3zm1 0h1v1H4zm1 0h1v1H5zm0 1h1v1H5zm0 1h1v1H5zm0 1h1v1H5zM4 5h1v1H4zM3 5h1v1H3z",
            opacity: ".5"
          }
        ),
        /* @__PURE__ */ jsx("path", { d: "M7 2h1v1H7zm0-1h1v1H7zM1 0h1v1H1zm1 0h1v1H2zm1 0h1v1H3zm1 0h1v1H4zm1 0h1v1H5zm1 0h1v1H6zm1 0h1v1H7z" })
      ]
    }
  );
}
function usePreloadImage(url) {
  return useQuery({
    enabled: !!url,
    retry: false,
    retryOnMount: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryKey: ["preloadImage", url],
    queryFn: () => new Promise((resolve, reject) => {
      if (!url) throw new Error("usePreloadImage: Must provide `url` to preload image.");
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`usePreloadImage: Could not load image.

	URL: ${url}`));
      image.src = url;
    })
  });
}
function AppInfo() {
  const { appName, appIcon } = useEntryKitConfig();
  const { data: hasAppIcon, isLoading: appIconLoading } = usePreloadImage(appIcon);
  return /* @__PURE__ */ jsxs("div", { className: "flex-grow flex flex-col items-center justify-center gap-2", children: [
    /* @__PURE__ */ jsx("div", { className: "w-16 h-16 m-2", children: !appIconLoading ? hasAppIcon ? /* @__PURE__ */ jsx("img", { src: appIcon, className: "w-full h-full object-cover" }) : (
      // TODO: swap with favicon
      /* @__PURE__ */ jsx(Logo, { className: "w-full h-full text-orange-500 bg-neutral-800" })
    ) : null }),
    /* @__PURE__ */ jsx("div", { className: "text-2xl text-white text-center", children: appName })
  ] });
}
function ConnectWallet() {
  const connectors = useConnectors();
  const porto = connectors.find(isIdPlaceConnector);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: twMerge("flex flex-col gap-6 p-6", "animate-in animate-duration-300 fade-in slide-in-from-bottom-8"),
      children: [
        /* @__PURE__ */ jsx("div", { className: "p-4", children: /* @__PURE__ */ jsx(AppInfo, {}) }),
        /* @__PURE__ */ jsx("div", { className: "self-center flex flex-col gap-2 w-60", children: porto ? /* @__PURE__ */ jsx(AccountButton, { connector: porto }) : /* @__PURE__ */ jsx(WalletButton, {}) })
      ]
    }
  );
}
function AccountButton({ connector }) {
  const { setOpen } = useModal();
  const { connect, isPending, error: error2 } = useConnect();
  const { chainId } = useEntryKitConfig();
  if (error2) {
    console.error("connect error", error2);
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      Button,
      {
        variant: "secondary",
        className: "self-auto flex justify-center",
        pending: isPending,
        onClick: () => connect({
          connector,
          // need to provide both `chainId` and `capabilities` to the
          // Porto connector so a fresh browser instance reusing a synced passkey
          // can be bound to the correct chain ID for the account
          chainId,
          capabilities: {}
        }),
        autoFocus: true,
        children: "Sign in"
      },
      "signin"
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        className: "text-sm self-center transition text-neutral-500 hover:text-white p-2",
        onClick: () => setOpen(true),
        children: "Already have a wallet?"
      }
    )
  ] });
}
function WalletButton() {
  const { open, setOpen } = useModal();
  const hasAutoOpenedRef = useRef(false);
  useEffect(() => {
    if (!open && !hasAutoOpenedRef.current) {
      setOpen(true);
      hasAutoOpenedRef.current = true;
    }
  }, [open, setOpen]);
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(
    Button,
    {
      variant: "secondary",
      className: "self-auto flex justify-center",
      onClick: () => setOpen(true),
      autoFocus: true,
      children: "Connect wallet"
    },
    "create"
  ) });
}
var paymasterAbi = parseAbi([
  // AllowanceSystem
  "error AllowanceSystem_InsufficientAllowance(uint256 allowance, uint256 required)",
  "error AllowanceSystem_NotAuthorized(address caller, address sponsor, address user)",
  "error AllowanceSystem_NotFound(address user, address sponsor)",
  "function removeAllowance(address user, address sponsor)",
  "function getAllowance(address user) view returns (uint256)",
  // GrantSystem
  "error GrantSystem_AllowanceBelowMinimum(uint256 allowance, uint256 min)",
  "error GrantSystem_AllowancesLimitReached(uint256 length, uint256 max)",
  "error GrantSystem_InsufficientBalance(uint256 balance, uint256 required)",
  "function grantAllowance(address user, uint256 allowance) payable",
  // BalanceSystem
  "error BalanceSystem_InsufficientBalance(address user, uint256 amount, uint256 balance)",
  "function depositTo(address to) payable",
  "function withdrawTo(address to, uint256 amount)",
  // SpenderSystem
  "error SpenderSystem_AlreadyRegistered(address spender, address user)",
  "error SpenderSystem_HasOwnBalance(address spender)",
  "function registerSpender(address spender)",
  // PaymasterSystem
  "error PaymasterSystem_InsufficientFunds(address user, uint256 maxCost, uint256 availableAllowance, uint256 availableBalance)",
  "error PaymasterSystem_OnlyEntryPoint()"
]);
var paymasterConfig = defineStore({
  namespaces: {
    root: {
      namespace: "",
      tables: {
        // Balance gets deposited and is withdrawable
        Balance: {
          schema: {
            user: "address",
            balance: "uint256"
          },
          key: ["user"]
        },
        // Allowance gets granted and is not withdrawable
        // Allowance is organized as a linked list and gets spent from smallest to largest
        Allowance: {
          name: "AllowanceV2",
          schema: {
            user: "address",
            sponsor: "address",
            allowance: "uint256",
            next: "address",
            previous: "address"
          },
          key: ["user", "sponsor"]
        },
        AllowanceList: {
          schema: {
            user: "address",
            first: "address",
            length: "uint256"
          },
          key: ["user"]
        },
        Spender: {
          schema: {
            spender: "address",
            user: "address"
          },
          key: ["spender"]
        },
        SystemConfig: {
          schema: {
            entryPoint: "address"
          },
          key: []
        }
      }
    }
  }
});
var paymasterTables = paymasterConfig.namespaces.root.tables;

// src/getPaymaster.ts
function getPaymaster(chain, paymasterOverride) {
  const contracts = chain.contracts ?? {};
  if (paymasterOverride) {
    return {
      type: "custom",
      paymasterClient: paymasterOverride
    };
  }
  if ("quarryPaymaster" in contracts && contracts.quarryPaymaster != null) {
    if ("address" in contracts.quarryPaymaster) {
      return {
        type: "quarry",
        address: contracts.quarryPaymaster.address,
        canSponsor: !!chain.rpcUrls.quarrySponsor?.http?.[0]
      };
    }
  }
  if ("paymaster" in contracts && contracts.paymaster != null) {
    if ("address" in contracts.paymaster) {
      return {
        type: "simple",
        address: contracts.paymaster.address
      };
    }
  }
}

// src/onboarding/quarry/getSpender.ts
async function getSpender({ client, userAddress, sessionAddress }) {
  const paymaster = getPaymaster(client.chain, void 0);
  if (paymaster?.type !== "quarry") return null;
  const record = await getRecord(client, {
    address: paymaster.address,
    table: paymasterTables.Spender,
    key: { spender: sessionAddress },
    blockTag: "pending"
  });
  return record.user.toLowerCase() === userAddress.toLowerCase();
}

// src/onboarding/quarry/useSpender.ts
function getSpenderQueryOptions({
  client,
  userAddress,
  sessionAddress
}) {
  return queryOptions({
    queryKey: ["getSpender", client?.uid, userAddress, sessionAddress],
    queryFn: client && userAddress && sessionAddress ? () => getSpender({ client, userAddress, sessionAddress }) : skipToken
  });
}
var defaultClientConfig = {
  pollingInterval: 250
};
var unlimitedDelegationControlId = resourceToHex({ type: "system", namespace: "", name: "unlimited" });
var worldTables = worldConfig.namespaces.world.tables;
var worldAbi = parseAbi([
  "function registerDelegation(address delegatee, bytes32 delegationControlId, bytes initCallData)"
]);

// src/onboarding/getDelegation.ts
async function getDelegation({
  client,
  worldAddress,
  userAddress,
  sessionAddress,
  // TODO: move everything to latest instead of pending
  blockTag = "pending"
}) {
  const record = await getRecord(client, {
    address: worldAddress,
    table: worldTables.UserDelegationControl,
    key: { delegator: userAddress, delegatee: sessionAddress },
    blockTag
  });
  return record.delegationControlId === unlimitedDelegationControlId;
}

// src/onboarding/useDelegation.ts
function getDelegationQueryOptions({
  client,
  worldAddress,
  userAddress,
  sessionAddress
}) {
  return queryOptions({
    queryKey: ["getDelegation", client?.uid, worldAddress, userAddress, sessionAddress],
    queryFn: client && userAddress && sessionAddress ? () => getDelegation({ client, worldAddress, userAddress, sessionAddress }) : skipToken
  });
}
var store2 = createStore(
  persist(
    () => ({
      signers: {}
    }),
    {
      name: "mud:entrykit",
      partialize: ({ signers }) => ({ signers })
    }
  )
);
function listener(event) {
  if (event.key === store2.persist.getOptions().name) {
    store2.persist.rehydrate();
  }
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", listener);
}
function getSessionSigner(userAddress) {
  const label = userAddress.toLowerCase();
  const sessionSignerPrivateKey = store2.getState().signers[label] ?? (() => {
    const deprecatedPrivateKey = localStorage.getItem(`mud:appSigner:privateKey:${userAddress.toLowerCase()}`)?.replace(/^"(.*)"$/, "$1");
    const privateKey = isHex(deprecatedPrivateKey) ? deprecatedPrivateKey : generatePrivateKey();
    store2.setState((state) => ({
      signers: {
        ...state.signers,
        [label]: privateKey
      }
    }));
    return privateKey;
  })();
  return privateKeyToAccount(sessionSignerPrivateKey);
}

// src/getSessionAccount.ts
async function getSessionAccount({
  client,
  userAddress
}) {
  const signer = getSessionSigner(userAddress);
  const account = await toSimpleSmartAccount({ client, owner: signer });
  return { account, signer };
}

// src/useSessionAccount.ts
function getSessionAccountQueryOptions({
  client,
  userAddress
}) {
  return queryOptions({
    queryKey: ["getSessionAccount", client?.uid, userAddress],
    queryFn: client && userAddress ? () => getSessionAccount({ client, userAddress }) : skipToken,
    staleTime: Infinity,
    // TODO: replace with function to retry only connection errors
    retry: false
  });
}
async function getAllowance({ client, userAddress }) {
  const paymaster = getPaymaster(client.chain, void 0);
  if (paymaster?.type !== "quarry") return null;
  return await getAction(
    client,
    readContract,
    "readContract"
  )({
    address: paymaster.address,
    abi: paymasterAbi,
    functionName: "getAllowance",
    args: [userAddress]
  });
}

// src/onboarding/quarry/useAllowance.ts
function getAllowanceQueryOptions({
  client,
  userAddress
}) {
  return queryOptions({
    queryKey: ["getAllowance", client?.uid, userAddress],
    queryFn: client && userAddress ? () => getAllowance({ client, userAddress }) : skipToken
  });
}
function useAllowance(userAddress) {
  const { chainId } = useEntryKitConfig();
  const client = useClient({ chainId });
  return useQuery(getAllowanceQueryOptions({ client, userAddress }));
}
async function getBalance({ client, userAddress }) {
  const paymaster = getPaymaster(client.chain, void 0);
  if (paymaster?.type !== "quarry") return null;
  const record = await getRecord(client, {
    address: paymaster.address,
    table: paymasterTables.Balance,
    key: { user: userAddress },
    blockTag: "pending"
  });
  return record.balance;
}

// src/onboarding/quarry/useBalance.ts
function getBalanceQueryOptions({
  client,
  userAddress
}) {
  return queryOptions({
    queryKey: ["getBalance", client?.uid, userAddress],
    queryFn: client && userAddress ? () => getBalance({ client, userAddress }) : skipToken
  });
}
function useBalance(userAddress) {
  const { chainId } = useEntryKitConfig();
  const client = useClient({ chainId });
  return useQuery(getBalanceQueryOptions({ client, userAddress }));
}

// src/useFunds.ts
function getFundsQueryOptions({
  queryClient,
  config,
  client,
  userAddress
}) {
  return queryOptions({
    queryKey: ["getFunds", client?.uid, userAddress],
    queryFn: async () => {
      if (!client) throw new Error("Viem client not ready.");
      if (!userAddress) throw new Error("User not connected.");
      const {
        account: { address: sessionAddress }
      } = await queryClient.fetchQuery(getSessionAccountQueryOptions({ client, userAddress }));
      const [sessionBalance, paymasterAllowance, paymasterBalance] = await Promise.all([
        queryClient.fetchQuery(getBalanceQueryOptions$1(config, { chainId: client.chain.id, address: sessionAddress })),
        queryClient.fetchQuery(getAllowanceQueryOptions({ client, userAddress })),
        queryClient.fetchQuery(getBalanceQueryOptions({ client, userAddress }))
      ]);
      return {
        sessionBalance: sessionBalance?.value ?? null,
        paymasterAllowance,
        paymasterBalance
      };
    },
    retry: false
  });
}
function useFunds(userAddress) {
  const queryClient = useQueryClient();
  const config = useConfig();
  const { chainId } = useEntryKitConfig();
  const client = useClient({ chainId });
  return useQuery(getFundsQueryOptions({ queryClient, config, client, userAddress }), queryClient);
}

// src/onboarding/usePrerequisites.ts
function getPrequisitesQueryOptions({
  queryClient,
  config,
  client,
  userAddress,
  worldAddress
}) {
  return queryOptions({
    queryKey: ["getPrerequisites", client?.uid, userAddress],
    queryFn: async () => {
      if (!client) throw new Error("Viem client not ready.");
      if (!userAddress) throw new Error("User not connected.");
      const {
        account: { address: sessionAddress }
      } = await queryClient.fetchQuery(getSessionAccountQueryOptions({ client, userAddress }));
      const [funds, spender, hasDelegation] = await Promise.all([
        queryClient.fetchQuery(getFundsQueryOptions({ queryClient, config, client, userAddress })),
        queryClient.fetchQuery(getSpenderQueryOptions({ client, userAddress, sessionAddress })),
        queryClient.fetchQuery(getDelegationQueryOptions({ client, worldAddress, userAddress, sessionAddress }))
      ]);
      const hasAllowance = funds.paymasterAllowance == null || funds.paymasterAllowance > 0n;
      const isSpender = spender == null ? true : spender;
      const hasGasBalance = funds.sessionBalance == null || funds.sessionBalance > 0n;
      const hasQuarryGasBalance = funds.paymasterBalance == null || funds.paymasterBalance > 0n;
      return {
        sessionAddress,
        hasAllowance,
        isSpender,
        hasGasBalance,
        hasQuarryGasBalance,
        hasDelegation,
        // we intentionally don't enforce an allowance/gas balance here
        complete: isSpender && hasDelegation
      };
    },
    retry: false
  });
}
function usePrerequisites(userAddress) {
  const queryClient = useQueryClient();
  const config = useConfig();
  const { chainId, worldAddress } = useEntryKitConfig();
  const client = useClient({ chainId });
  const prereqs = useQuery(
    getPrequisitesQueryOptions({
      queryClient,
      config,
      client,
      userAddress,
      worldAddress
    }),
    queryClient
  );
  return prereqs;
}
function useENS(address) {
  const normalizedAddress = address?.toLowerCase();
  return useQuery({
    enabled: !!normalizedAddress,
    queryKey: ["ens", normalizedAddress],
    queryFn: async () => {
      const data = await fetch(`https://api.ensideas.com/ens/resolve/${normalizedAddress}`).then((res) => res.json());
      return {
        address: data.address ?? void 0,
        name: data.name ?? void 0,
        displayName: data.displayName ?? void 0,
        avatar: data.avatar ?? void 0
      };
    }
  });
}
function TruncatedHex({ hex }) {
  if (hex.length <= 10) {
    return /* @__PURE__ */ jsx("span", { title: hex, children: hex });
  }
  return /* @__PURE__ */ jsxs("span", { title: hex, children: [
    /* @__PURE__ */ jsx("span", { className: "after:select-none after:content-['\u2026']", children: hex.slice(0, 6) }),
    /* @__PURE__ */ jsx("span", { className: "tracking-[-1ch] text-transparent", children: hex.slice(6, -4) }),
    hex.slice(-4)
  ] });
}
var store3 = createStore(() => ({
  lastId: 0,
  errors: []
}));
function addError({
  error: error2,
  retry,
  dismiss
}) {
  if (findCause(error2, ({ name }) => name === "UserRejectedRequestError")) {
    return;
  }
  store3.setState((state) => {
    if (state.errors.some((e) => e.error === error2)) {
      return {};
    }
    const id = state.lastId + 1;
    return {
      lastId: id,
      errors: [
        ...state.errors,
        {
          id,
          error: error2,
          dismiss: dismiss ? () => {
            removeError(error2);
            dismiss();
          } : void 0,
          retry: retry ? async () => {
            removeError(error2);
            await retry();
          } : void 0
        }
      ]
    };
  });
  return () => {
    removeError(error2);
  };
}
function removeError(error2) {
  store3.setState((state) => ({
    errors: state.errors.filter((e) => e.error !== error2)
  }));
}
function useShowMutationError(result) {
  const { error: error2, reset } = result;
  useEffect(() => {
    if (!error2) return;
    return addError({ error: error2, dismiss: reset });
  }, [error2, reset]);
  return result;
}
function Wallet({ isActive, isExpanded, userAddress }) {
  const { data: ens } = useENS(userAddress);
  const { disconnect, isPending: disconnectIsPending } = useShowMutationError(useDisconnect());
  const { closeAccountModal } = useAccountModal();
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { children: "Account" }),
        /* @__PURE__ */ jsx("div", { className: "font-mono text-white", children: ens?.name ?? /* @__PURE__ */ jsx(TruncatedHex, { hex: userAddress }) })
      ] }),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: isActive ? "primary" : "tertiary",
          className: "flex-shrink-0 text-sm p-1 w-28",
          autoFocus: isActive,
          pending: disconnectIsPending,
          onClick: () => {
            closeAccountModal();
            disconnect();
          },
          children: "Sign out"
        }
      )
    ] }),
    isExpanded ? /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Each of your onchain actions in this app is associated with your account." }) : null
  ] });
}

// src/utils/defineCall.ts
function defineCall(call) {
  return call;
}
async function signCall({
  userClient,
  worldAddress,
  systemId,
  callData,
  nonce: initialNonce,
  client
}) {
  const nonce = initialNonce ?? (client ? (await getRecord(client, {
    address: worldAddress,
    table: moduleConfig.tables.CallWithSignatureNonces,
    key: { signer: userClient.account.address },
    blockTag: "pending"
  })).nonce : 0n);
  const { namespace: systemNamespace, name: systemName } = hexToResource(systemId);
  return await getAction(
    userClient,
    signTypedData,
    "signTypedData"
  )({
    account: userClient.account,
    domain: {
      verifyingContract: worldAddress,
      salt: toHex(userClient.chain.id, { size: 32 })
    },
    types: callWithSignatureTypes,
    primaryType: "Call",
    message: {
      signer: userClient.account.address,
      systemNamespace,
      systemName,
      callData,
      nonce
    }
  });
}
async function callWithSignature({
  sessionClient,
  ...opts
}) {
  const rawSignature = await signCall(opts);
  const { address, signature } = parseErc6492Signature(rawSignature);
  if (address != null) {
    throw new Error(
      "ERC-6492 signatures, like from Coinbase Smart Wallet, are not yet supported. Try using a different wallet?"
    );
  }
  return getAction(
    sessionClient,
    writeContract,
    "writeContract"
  )({
    address: opts.worldAddress,
    abi: CallWithSignatureAbi,
    functionName: "callWithSignature",
    args: [opts.userClient.account.address, opts.systemId, opts.callData, signature]
  });
}
function cachedFeesPerGas(client, options = { refreshInterval: 1e4 }) {
  let fees = null;
  async function refreshFees() {
    fees = await estimateFeesPerGas(client);
  }
  refreshFees();
  setInterval(refreshFees, options.refreshInterval);
  return async () => {
    if (fees) return fees;
    fees = await estimateFeesPerGas(client);
    return fees;
  };
}

// src/createBundlerClient.ts
function createBundlerClient(config) {
  const client = config.client;
  if (!client) throw new Error("No `client` provided to `createBundlerClient`.");
  const chain = config.chain ?? client.chain;
  const paymaster = chain ? getPaymaster(chain, config.paymaster) : void 0;
  return createBundlerClient$1({
    ...defaultClientConfig,
    paymaster: paymaster ? paymaster.type === "custom" ? paymaster.paymasterClient : {
      getPaymasterData: async () => ({
        paymaster: paymaster.address,
        paymasterData: "0x"
      })
    } : void 0,
    userOperation: {
      estimateFeesPerGas: createFeeEstimator(client)
    },
    ...config
  });
}
function createFeeEstimator(client) {
  if (!client.chain) return;
  if (client.chain.id === 31337) {
    return async () => ({ maxFeePerGas: 100000n, maxPriorityFeePerGas: 0n });
  }
  if ([690, 17069, 695569].includes(client.chain.id)) {
    return cachedFeesPerGas(client);
  }
}
function useSetupSession({ connector, userClient }) {
  const queryClient = useQueryClient();
  const { chainId, worldAddress, paymasterOverride } = useEntryKitConfig();
  const client = useClient({ chainId });
  const mutationKey = ["setupSession", client?.chain.id, userClient.account.address];
  return useMutation({
    retry: 0,
    mutationKey,
    mutationFn: async ({
      sessionClient,
      registerSpender,
      registerDelegation
    }) => {
      if (!client) throw new Error("Client not ready.");
      const paymaster = getPaymaster(client.chain, paymasterOverride);
      const sessionAddress = sessionClient.account.address;
      console.log("setting up session", userClient);
      if (isIdPlaceConnector(connector)) {
        const calls = [];
        if (registerSpender && paymaster?.type === "quarry") {
          console.log("registering spender");
          calls.push(
            defineCall({
              to: paymaster.address,
              abi: paymasterAbi,
              functionName: "registerSpender",
              args: [sessionAddress]
            })
          );
        }
        if (registerDelegation) {
          console.log("registering delegation");
          calls.push(
            defineCall({
              to: worldAddress,
              abi: worldAbi,
              functionName: "registerDelegation",
              args: [sessionAddress, unlimitedDelegationControlId, "0x"]
            })
          );
        }
        if (!calls.length) return;
        console.log("setting up account with", calls, userClient.account.address, sessionAddress);
        const { id } = await getAction(
          userClient,
          sendCalls,
          "sendCalls"
        )({
          account: userClient.account,
          calls
        });
        console.log("got send calls ID", id);
        const bundlerClient = createBundlerClient({
          transport: getBundlerTransport(client.chain),
          client
        });
        console.log("waiting for receipt");
        const receipt = await getAction(
          bundlerClient,
          waitForUserOperationReceipt,
          "waitForUserOperationReceipt"
        )({ hash: id });
        console.log("got result", receipt);
        console.log(
          "parsed logs",
          worldAddress,
          parseEventLogs({
            logs: receipt.logs,
            abi: [
              ...entryPoint07Abi,
              // TODO: export account abi from id package
              // ...abi,
              ...worldAbi,
              ...storeEventsAbi,
              ...calls.flatMap((call) => call.abi)
            ]
          })
        );
      } else if (userClient.account.type === "smart") {
        const calls = [];
        if (registerSpender && paymaster?.type === "quarry") {
          console.log("registering spender");
          calls.push(
            defineCall({
              to: paymaster.address,
              abi: paymasterAbi,
              functionName: "registerSpender",
              args: [sessionAddress]
            })
          );
        }
        if (registerDelegation) {
          console.log("registering delegation");
          calls.push(
            defineCall({
              to: worldAddress,
              abi: worldAbi,
              functionName: "registerDelegation",
              args: [sessionAddress, unlimitedDelegationControlId, "0x"]
            })
          );
        }
        if (!calls.length) return;
        console.log("setting up account with", calls, userClient);
        const hash = await getAction(userClient, sendUserOperation$1, "sendUserOperation")({ calls });
        console.log("got user op hash", hash);
        const receipt = await getAction(
          userClient,
          waitForUserOperationReceipt,
          "waitForUserOperationReceipt"
        )({ hash });
        console.log("got user op receipt", receipt);
        if (!receipt.success) {
          console.error("not successful?", receipt);
        }
      } else {
        const txs = [];
        if (registerSpender && paymaster?.type === "quarry") {
          console.log("registering spender");
          const tx = await callWithSignature({
            client,
            userClient,
            sessionClient,
            worldAddress: paymaster.address,
            systemId: resourceToHex({ type: "system", namespace: "", name: "SpenderSystem" }),
            callData: encodeFunctionData({
              abi: paymasterAbi,
              functionName: "registerSpender",
              args: [sessionAddress]
            })
          });
          console.log("got spender tx", tx);
          txs.push(tx);
        }
        if (registerDelegation) {
          console.log("registering delegation");
          const tx = await callWithSignature({
            client,
            userClient,
            sessionClient,
            worldAddress,
            systemId: systemsConfig.systems.RegistrationSystem.systemId,
            callData: encodeFunctionData({
              abi: IBaseWorldAbi,
              functionName: "registerDelegation",
              args: [sessionAddress, unlimitedDelegationControlId, "0x"]
            })
          });
          console.log("got delegation tx", tx);
          txs.push(tx);
        }
        if (!txs.length) return;
        console.log("waiting for", txs.length, "receipts");
        for (const hash of txs) {
          const receipt = await getAction(client, waitForTransactionReceipt, "waitForTransactionReceipt")({ hash });
          console.log("got tx receipt", receipt);
          if (receipt.status === "reverted") {
            console.error("tx reverted?", receipt);
          }
        }
      }
      await (async () => {
        if (await sessionClient.account.isDeployed?.()) return;
        console.log("creating session account by sending empty user op");
        const hash = await getAction(
          sessionClient,
          sendUserOperation$1,
          "sendUserOperation"
        )({
          calls: [{ to: zeroAddress }]
        });
        const receipt = await getAction(
          sessionClient,
          waitForUserOperationReceipt,
          "waitForUserOperationReceipt"
        )({ hash });
        console.log("got user op receipt", receipt);
      })();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["getSpender"] }),
        queryClient.invalidateQueries({ queryKey: ["getDelegation"] }),
        queryClient.invalidateQueries({ queryKey: ["getPrerequisites"] })
      ]);
    }
  });
}
async function getSessionClient({
  userAddress,
  sessionAccount,
  sessionSigner,
  worldAddress,
  paymasterOverride
}) {
  const client = sessionAccount.client;
  if (!clientHasChain(client)) {
    throw new Error("Session account client had no associated chain.");
  }
  const bundlerClient = createBundlerClient({
    transport: getBundlerTransport(client.chain),
    client,
    account: sessionAccount,
    paymaster: paymasterOverride
  });
  const sessionClient = bundlerClient.extend(smartAccountActions).extend(
    callFrom({
      worldAddress,
      delegatorAddress: userAddress,
      publicClient: client
    })
  ).extend(
    sendUserOperationFrom({
      worldAddress,
      delegatorAddress: userAddress,
      publicClient: client
    })
  ).extend(() => ({ userAddress, worldAddress, internal_signer: sessionSigner }));
  return sessionClient;
}
function clientHasChain(client) {
  return client.chain != null;
}

// src/useSessionClient.ts
function getSessionClientQueryOptions({
  queryClient,
  client,
  userAddress,
  worldAddress,
  paymasterOverride
}) {
  return queryOptions({
    queryKey: ["getSessionClient", client?.uid, userAddress, worldAddress],
    queryFn: async () => {
      if (!userAddress) throw new Error("User not connected.");
      const { account: sessionAccount, signer: sessionSigner } = await queryClient.fetchQuery(
        getSessionAccountQueryOptions({ client, userAddress })
      );
      return await getSessionClient({
        sessionAccount,
        sessionSigner,
        userAddress,
        worldAddress,
        paymasterOverride
      });
    },
    staleTime: Infinity,
    // TODO: replace with function to retry only connection errors
    retry: false
  });
}
function useSessionClient(userAddress) {
  const queryClient = useQueryClient();
  const { chainId, worldAddress, paymasterOverride } = useEntryKitConfig();
  const client = useClient({ chainId });
  return useQuery(
    getSessionClientQueryOptions({
      queryClient,
      client,
      userAddress,
      worldAddress,
      paymasterOverride
    })
  );
}
function useShowQueryError(result) {
  const { error: error2, refetch } = result;
  useEffect(() => {
    if (!error2) return;
    return addError({ error: error2, retry: refetch, dismiss: () => {
    } });
  }, [error2, refetch]);
  return result;
}
function Session({ isActive, isExpanded, connector, userClient, registerSpender, registerDelegation }) {
  const sessionClient = useShowQueryError(useSessionClient(userClient.account.address));
  const setup = useShowMutationError(useSetupSession({ userClient, connector }));
  const hasSession = !registerDelegation && !registerDelegation;
  const { data: prerequisites } = usePrerequisites(userClient.account.address);
  const { hasAllowance, hasGasBalance, hasQuarryGasBalance } = prerequisites ?? {};
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isActive && setup.status === "idle" && sessionClient.data && !hasSession && (hasAllowance || hasGasBalance || hasQuarryGasBalance)) ;
    });
    return () => clearTimeout(timer);
  }, [
    hasSession,
    isActive,
    registerDelegation,
    registerSpender,
    sessionClient,
    setup,
    hasAllowance,
    hasGasBalance,
    hasQuarryGasBalance
  ]);
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { children: "Session" }),
        /* @__PURE__ */ jsx("div", { className: "font-mono text-white", children: hasSession ? "Enabled" : "Set up" })
      ] }),
      hasSession ? /* @__PURE__ */ jsx(Button, { variant: "tertiary", className: "flex-shrink-0 text-sm p-1 w-28", autoFocus: isActive, disabled: true, children: "Enabled" }) : /* @__PURE__ */ jsx(
        Button,
        {
          variant: isActive ? "primary" : "tertiary",
          className: "flex-shrink-0 text-sm p-1 w-28",
          autoFocus: isActive,
          pending: !sessionClient.data || setup.status === "pending",
          onClick: sessionClient.data ? () => setup.mutate({
            sessionClient: sessionClient.data,
            registerSpender,
            registerDelegation
          }) : void 0,
          children: "Enable"
        }
      )
    ] }),
    isExpanded ? /* @__PURE__ */ jsx("p", { className: "text-sm", children: "You can perform actions in this app without interruptions for approvals." }) : null
  ] });
}
function EthIcon({ className, ...props }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 263 428",
      fill: "currentColor",
      className: twMerge("w-[0.6em] h-[1em]", className),
      ...props,
      children: [
        /* @__PURE__ */ jsx("path", { d: "M132 321V428L263 243L132 321Z" }),
        /* @__PURE__ */ jsx("path", { d: "M0 243L132 321V428", fillOpacity: "0.5" }),
        /* @__PURE__ */ jsx("path", { d: "M132 0V296L263 218" }),
        /* @__PURE__ */ jsx("path", { d: "M0 218L132 296V0L0 218Z", fillOpacity: "0.5" })
      ]
    }
  );
}
function formatBalance(wei) {
  const formatted = formatEther(wei);
  const parsed = parseFloat(formatted);
  if (parsed > 0 && parsed < 1e-5) {
    return "<0.00001";
  }
  const magnitude = Math.floor(parsed).toString().length;
  return parsed.toLocaleString("en-US", { maximumFractionDigits: Math.max(0, 6 - magnitude) });
}
function Balance({ wei }) {
  return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", title: formatEther(wei), children: [
    formatBalance(wei),
    " ",
    /* @__PURE__ */ jsx(EthIcon, {})
  ] });
}

// src/data/relayChains.json
var relayChains_default = {
  "1": {
    bridgeUrl: "https://relay.link/bridge/ethereum"
  },
  "10": {
    bridgeUrl: "https://relay.link/bridge/optimism"
  },
  "56": {
    bridgeUrl: "https://relay.link/bridge/bnb"
  },
  "100": {
    bridgeUrl: "https://relay.link/bridge/gnosis"
  },
  "111": {
    bridgeUrl: "https://testnets.relay.link/bridge/bob"
  },
  "130": {
    bridgeUrl: "https://relay.link/bridge/unichain"
  },
  "137": {
    bridgeUrl: "https://relay.link/bridge/polygon"
  },
  "146": {
    bridgeUrl: "https://relay.link/bridge/sonic"
  },
  "185": {
    bridgeUrl: "https://relay.link/bridge/mint"
  },
  "288": {
    bridgeUrl: "https://relay.link/bridge/boba"
  },
  "324": {
    bridgeUrl: "https://relay.link/bridge/zksync"
  },
  "360": {
    bridgeUrl: "https://relay.link/bridge/shape"
  },
  "480": {
    bridgeUrl: "https://relay.link/bridge/world-chain"
  },
  "690": {
    bridgeUrl: "https://relay.link/bridge/redstone"
  },
  "747": {
    bridgeUrl: "https://relay.link/bridge/flow-evm"
  },
  "919": {
    bridgeUrl: "https://testnets.relay.link/bridge/mode-testnet"
  },
  "1101": {
    bridgeUrl: "https://relay.link/bridge/polygon-zkevm"
  },
  "1135": {
    bridgeUrl: "https://relay.link/bridge/lisk"
  },
  "1301": {
    bridgeUrl: "https://testnets.relay.link/bridge/unichain-sepolia"
  },
  "1329": {
    bridgeUrl: "https://relay.link/bridge/sei"
  },
  "1424": {
    bridgeUrl: "https://relay.link/bridge/perennial"
  },
  "1514": {
    bridgeUrl: "https://relay.link/bridge/story"
  },
  "1625": {
    bridgeUrl: "https://relay.link/bridge/gravity"
  },
  "1868": {
    bridgeUrl: "https://relay.link/bridge/soneium"
  },
  "1923": {
    bridgeUrl: "https://relay.link/bridge/swellchain"
  },
  "1993": {
    bridgeUrl: "https://testnets.relay.link/bridge/b3"
  },
  "1996": {
    bridgeUrl: "https://relay.link/bridge/sanko"
  },
  "2187": {
    bridgeUrl: "https://relay.link/bridge/game7"
  },
  "2741": {
    bridgeUrl: "https://relay.link/bridge/abstract"
  },
  "2911": {
    bridgeUrl: "https://relay.link/bridge/hychain"
  },
  "4202": {
    bridgeUrl: "https://testnets.relay.link/bridge/lisk-sepolia"
  },
  "4321": {
    bridgeUrl: "https://relay.link/bridge/echos"
  },
  "5000": {
    bridgeUrl: "https://relay.link/bridge/mantle"
  },
  "5112": {
    bridgeUrl: "https://relay.link/bridge/ham"
  },
  "7560": {
    bridgeUrl: "https://relay.link/bridge/cyber"
  },
  "7865": {
    bridgeUrl: "https://relay.link/bridge/powerloom"
  },
  "7897": {
    bridgeUrl: "https://relay.link/bridge/arena-z"
  },
  "8333": {
    bridgeUrl: "https://relay.link/bridge/B3"
  },
  "8453": {
    bridgeUrl: "https://relay.link/bridge/base"
  },
  "9897": {
    bridgeUrl: "https://testnets.relay.link/bridge/arena-z-testnet"
  },
  "11011": {
    bridgeUrl: "https://testnets.relay.link/bridge/shape-sepolia"
  },
  "11124": {
    bridgeUrl: "https://testnets.relay.link/bridge/abstract"
  },
  "13746": {
    bridgeUrl: "https://testnets.relay.link/bridge/game7-testnet"
  },
  "17000": {
    bridgeUrl: "https://testnets.relay.link/bridge/holesky"
  },
  "17069": {
    bridgeUrl: "https://testnets.relay.link/bridge/garnet"
  },
  "17071": {
    bridgeUrl: "https://relay.link/bridge/onchain-points"
  },
  "33139": {
    bridgeUrl: "https://relay.link/bridge/apechain"
  },
  "33979": {
    bridgeUrl: "https://relay.link/bridge/funki"
  },
  "34443": {
    bridgeUrl: "https://relay.link/bridge/mode"
  },
  "42161": {
    bridgeUrl: "https://relay.link/bridge/arbitrum"
  },
  "42170": {
    bridgeUrl: "https://relay.link/bridge/arbitrum-nova"
  },
  "42220": {
    bridgeUrl: "https://relay.link/bridge/celo"
  },
  "43114": {
    bridgeUrl: "https://relay.link/bridge/avalanche"
  },
  "55244": {
    bridgeUrl: "https://relay.link/bridge/superposition"
  },
  "57073": {
    bridgeUrl: "https://relay.link/bridge/ink"
  },
  "59144": {
    bridgeUrl: "https://relay.link/bridge/linea"
  },
  "60808": {
    bridgeUrl: "https://relay.link/bridge/bob"
  },
  "70700": {
    bridgeUrl: "https://relay.link/bridge/apex"
  },
  "70701": {
    bridgeUrl: "https://relay.link/bridge/boss"
  },
  "70800": {
    bridgeUrl: "https://testnets.relay.link/bridge/apex-testnet"
  },
  "70805": {
    bridgeUrl: "https://testnets.relay.link/bridge/cloud"
  },
  "80002": {
    bridgeUrl: "https://testnets.relay.link/bridge/amoy"
  },
  "80094": {
    bridgeUrl: "https://relay.link/bridge/berachain"
  },
  "81457": {
    bridgeUrl: "https://relay.link/bridge/blast"
  },
  "84532": {
    bridgeUrl: "https://testnets.relay.link/bridge/base-sepolia"
  },
  "167000": {
    bridgeUrl: "https://relay.link/bridge/taiko"
  },
  "167009": {
    bridgeUrl: "https://testnets.relay.link/bridge/hekla"
  },
  "421614": {
    bridgeUrl: "https://testnets.relay.link/bridge/arbitrum-sepolia"
  },
  "534352": {
    bridgeUrl: "https://relay.link/bridge/scroll"
  },
  "543210": {
    bridgeUrl: "https://relay.link/bridge/zero-network"
  },
  "660279": {
    bridgeUrl: "https://relay.link/bridge/xai"
  },
  "695569": {
    bridgeUrl: "https://testnets.relay.link/bridge/pyrope"
  },
  "911867": {
    bridgeUrl: "https://testnets.relay.link/bridge/odyssey"
  },
  "984122": {
    bridgeUrl: "https://relay.link/bridge/forma"
  },
  "1118190": {
    bridgeUrl: "https://testnets.relay.link/bridge/eclipse-testnet"
  },
  "3397901": {
    bridgeUrl: "https://testnets.relay.link/bridge/funki-testnet"
  },
  "3441006": {
    bridgeUrl: "https://testnets.relay.link/bridge/manta-pacific-testnet"
  },
  "4457845": {
    bridgeUrl: "https://testnets.relay.link/bridge/zero-sepolia"
  },
  "7777777": {
    bridgeUrl: "https://relay.link/bridge/zora"
  },
  "8253038": {
    bridgeUrl: "https://relay.link/bridge/bitcoin"
  },
  "9092725": {
    bridgeUrl: "https://testnets.relay.link/bridge/bitcoin-testnet4"
  },
  "9286185": {
    bridgeUrl: "https://relay.link/bridge/eclipse"
  },
  "11155111": {
    bridgeUrl: "https://testnets.relay.link/bridge/sepolia"
  },
  "11155420": {
    bridgeUrl: "https://testnets.relay.link/bridge/op-sepolia"
  },
  "666666666": {
    bridgeUrl: "https://relay.link/bridge/degen"
  },
  "792703809": {
    bridgeUrl: "https://relay.link/bridge/solana"
  },
  "845320008": {
    bridgeUrl: "https://testnets.relay.link/bridge/lordchain-testnet"
  },
  "888888888": {
    bridgeUrl: "https://relay.link/bridge/ancient8"
  },
  "999999999": {
    bridgeUrl: "https://testnets.relay.link/bridge/zora-sepolia"
  },
  "1380012617": {
    bridgeUrl: "https://relay.link/bridge/rari"
  },
  "1936682084": {
    bridgeUrl: "https://testnets.relay.link/bridge/solana-devnet"
  },
  "88153591557": {
    bridgeUrl: "https://testnets.relay.link/bridge/arbitrum-blueberry"
  }
};
function useSetBalance() {
  const queryClient = useQueryClient();
  const { chainId } = useEntryKitConfig();
  const client = useClient({ chainId });
  return useMutation({
    retry: 0,
    mutationKey: ["setBalance", chainId],
    mutationFn: async (params) => {
      if (!client) return null;
      await setBalance({ ...client, mode: "anvil" }, params);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["balance"] }),
        queryClient.invalidateQueries({ queryKey: ["getFunds"] }),
        queryClient.invalidateQueries({ queryKey: ["getPrerequisites"] })
      ]);
      return null;
    }
  });
}
function usePrevious(value, initialValue) {
  const ref = useRef();
  useEffect(() => {
    ref.current = { value };
  }, [value]);
  return ref.current ? ref.current.value : initialValue;
}
function IconSVG({ className, children, ...props }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "currentColor",
      className: twMerge("-my-[0.125em] h-[1.25em] w-[1.25em]", className),
      ...props,
      children
    }
  );
}
function CopyIcon(props) {
  return /* @__PURE__ */ jsx(IconSVG, { ...props, children: /* @__PURE__ */ jsx(
    "path",
    {
      d: "M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H16C17.1046 21 18 20.1046 18 19V18M8 5C8 6.10457 8.89543 7 10 7H12C13.1046 7 14 6.10457 14 5M8 5C8 3.89543 8.89543 3 10 3H12C13.1046 3 14 3.89543 14 5M14 5H16C17.1046 5 18 5.89543 18 7V10M20 14H10M10 14L13 11M10 14L13 17",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  ) });
}
function CheckIcon(props) {
  return /* @__PURE__ */ jsx(IconSVG, { ...props, children: /* @__PURE__ */ jsx(
    "path",
    {
      d: "M5 13L9 17L19 7",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  ) });
}
function GasBalance({ isActive, isExpanded, sessionAddress }) {
  const queryClient = useQueryClient();
  const { chain } = useEntryKitConfig();
  const [copied, setCopied] = useState(false);
  const balance = useShowQueryError(useBalance$1({ chainId: chain.id, address: sessionAddress }));
  const prevBalance = usePrevious(balance.data);
  useWatchBlockNumber({ onBlockNumber: () => balance.refetch() });
  const setBalance3 = useShowMutationError(useSetBalance());
  const relayChain = relayChains_default[chain.id];
  const handleCopy = () => {
    navigator.clipboard.writeText(sessionAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  useEffect(() => {
    if (balance.data != null && prevBalance?.value === 0n && balance.data.value > 0n) {
      queryClient.invalidateQueries({ queryKey: ["getFunds"] });
      queryClient.invalidateQueries({ queryKey: ["getPrerequisites"] });
    }
  }, [balance.data, prevBalance, setBalance3, sessionAddress, queryClient]);
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { children: "Gas balance" }),
        /* @__PURE__ */ jsx("div", { className: "font-mono text-white", children: balance.data != null ? /* @__PURE__ */ jsx(Balance, { wei: balance.data.value }) : /* @__PURE__ */ jsx(PendingIcon, { className: "text-sm" }) })
      ] }),
      chain.id === 31337 ? /* @__PURE__ */ jsx(
        Button,
        {
          variant: isActive ? "primary" : "tertiary",
          className: "flex-shrink-0 text-sm p-1 w-28",
          autoFocus: isActive || isExpanded,
          pending: balance.status === "pending" || setBalance3.status === "pending",
          onClick: () => setBalance3.mutate({
            address: sessionAddress,
            value: parseEther("0.01") + (balance.data?.value ?? 0n)
          }),
          children: "Top up"
        }
      ) : relayChain != null ? (
        // TODO: convert this to a <ButtonLink>
        /* @__PURE__ */ jsx(
          "a",
          {
            href: `${relayChain.bridgeUrl}?${new URLSearchParams({ toAddress: sessionAddress, amount: "0.01" })}`,
            target: "_blank",
            rel: "noopener noreferrer",
            children: /* @__PURE__ */ jsx(
              Button,
              {
                variant: isActive ? "primary" : "tertiary",
                className: "flex-shrink-0 text-sm p-1 w-28",
                autoFocus: isActive || isExpanded,
                pending: balance.status === "pending",
                children: "Top up"
              }
            )
          }
        )
      ) : null
    ] }),
    isExpanded ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Your session's gas balance is used to pay for onchain computation." }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
        "Send funds to",
        " ",
        /* @__PURE__ */ jsxs(
          "span",
          {
            className: "inline-flex items-center gap-1 font-mono text-white cursor-pointer hover:text-white/80 transition-colors",
            onClick: handleCopy,
            title: "Click to copy",
            children: [
              /* @__PURE__ */ jsx(TruncatedHex, { hex: sessionAddress }),
              " ",
              copied ? /* @__PURE__ */ jsx(CheckIcon, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ jsx(CopyIcon, { className: "w-3.5 h-3.5" })
            ]
          }
        ),
        " ",
        "on ",
        chain.name,
        " to top up your session balance."
      ] })
    ] }) : null
  ] });
}
function ChevronUpIcon(props) {
  return /* @__PURE__ */ jsx(IconSVG, { viewBox: "0 0 20 20", ...props, children: /* @__PURE__ */ jsx(
    "path",
    {
      d: "M14.7071 12.7071C14.3166 13.0976 13.6834 13.0976 13.2929 12.7071L10 9.41421L6.70711 12.7071C6.31658 13.0976 5.68342 13.0976 5.29289 12.7071C4.90237 12.3166 4.90237 11.6834 5.29289 11.2929L9.29289 7.29289C9.68342 6.90237 10.3166 6.90237 10.7071 7.29289L14.7071 11.2929C15.0976 11.6834 15.0976 12.3166 14.7071 12.7071Z",
      fillRule: "evenodd",
      clipRule: "evenodd"
    }
  ) });
}
function ChevronDownIcon(props) {
  return /* @__PURE__ */ jsx(IconSVG, { viewBox: "0 0 20 20", ...props, children: /* @__PURE__ */ jsx(
    "path",
    {
      d: "M5.29289 7.29289C5.68342 6.90237 6.31658 6.90237 6.70711 7.29289L10 10.5858L13.2929 7.29289C13.6834 6.90237 14.3166 6.90237 14.7071 7.29289C15.0976 7.68342 15.0976 8.31658 14.7071 8.70711L10.7071 12.7071C10.3166 13.0976 9.68342 13.0976 9.29289 12.7071L5.29289 8.70711C4.90237 8.31658 4.90237 7.68342 5.29289 7.29289Z",
      fillRule: "evenodd",
      clipRule: "evenodd"
    }
  ) });
}
function Slot({
  children,
  ...props
}) {
  if (isValidElement(children)) {
    return cloneElement(children, {
      ...props,
      ...children.props,
      style: {
        ...props.style,
        ...children.props.style
      },
      className: twMerge(props.className, children.props.className)
    });
  }
  if (Children.count(children) > 1) {
    Children.only(null);
  }
  return null;
}
function Input({ asChild, className, ...props }) {
  const Child = asChild ? Slot : "input";
  return /* @__PURE__ */ jsx(
    Child,
    {
      className: twMerge(
        "p-2.5 gap-1 border text-lg font-medium transition",
        "outline-none ring-2 ring-transparent focus-within:ring-orange-500 focus-within:border-transparent",
        "bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500",
        className
      ),
      ...props
    }
  );
}
function PreloadedImage({ url, fallback: fallback2, className }) {
  const { isSuccess, isLoading } = usePreloadImage(url);
  return /* @__PURE__ */ jsx("span", { className: twMerge("inline-flex w-full h-full items-center justify-center overflow-clip", className), children: !isLoading ? isSuccess ? /* @__PURE__ */ jsx("img", { src: url, className: "w-full h-full object-cover" }) : fallback2 : null });
}
var ChainIcon = forwardRef(function ChainIcon2({ name, url, className }, forwardedRef) {
  return /* @__PURE__ */ jsx(
    "span",
    {
      ref: forwardedRef,
      className: twMerge("flex-shrink-0 inline-flex w-6 aspect-square rounded-full overflow-clip", className),
      children: url ? /* @__PURE__ */ jsx(PreloadedImage, { url }) : (
        // TODO: better placeholder
        /* @__PURE__ */ jsx(
          "span",
          {
            className: twMerge(
              "inline-flex items-center justify-center w-full h-full rounded-full",
              "border-2 border-dashed border-white/50 opacity-50"
            ),
            children: name?.slice(0, 1)
          }
        )
      )
    }
  );
});
function useRelay() {
  const { chain } = useEntryKitConfig();
  const appOrigin = location.host;
  const baseApiUrl = chain.testnet ? TESTNET_RELAY_API : MAINNET_RELAY_API;
  return useQuery({
    queryKey: ["relayChains", baseApiUrl, appOrigin],
    queryFn: async () => {
      debug("fetching relay chains from", baseApiUrl);
      const chains = await fetchChainConfigs(baseApiUrl);
      debug("got relay chains", chains);
      const client = createClient$1({
        baseApiUrl,
        source: appOrigin,
        chains,
        logLevel: LogLevel.Verbose
      });
      return { client, chains };
    },
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity
  });
}
function useChainBalances({ chains }) {
  const { address: userAddress } = useAccount();
  const wagmiConfig = useConfig();
  const chainIds = chains.map((chain) => chain.id);
  return useQuery({
    queryKey: ["chainBalances", chainIds, userAddress],
    queryFn: userAddress ? async () => {
      const chainBalances = await Promise.allSettled(
        chains.map(async (chain) => {
          const balance = await getBalance$1(wagmiConfig, { chainId: chain.id, address: userAddress });
          return { chain, balance };
        })
      );
      return chainBalances.map((result) => result.status === "fulfilled" ? result.value : null).filter(isNotNull);
    } : skipToken,
    refetchInterval: 1e3 * 60,
    retry: 1
  });
}
function ChainSelect({ value, onChange }) {
  const theme = useTheme();
  const { frame } = useFrame();
  const { chains, switchChain } = useSwitchChain();
  const relay = useRelay();
  const relayChains = relay.data?.chains;
  const sourceChains = useMemo(() => {
    return chains.map((sourceChain) => {
      const relayChain = relayChains?.find((c) => c.id === sourceChain.id);
      return {
        ...sourceChain,
        relayChain
      };
    }).filter((c) => c.relayChain);
  }, [chains, relayChains]);
  const selectedChain = sourceChains.find((c) => c.id === value);
  const { data: chainsBalances, isLoading } = useShowQueryError(useChainBalances({ chains: sourceChains }));
  const renderedChains = useMemo(() => {
    if (!chainsBalances) return [];
    const chainsWithBalance = chainsBalances.filter(({ balance }) => balance.value > 0n).map(({ chain, balance }) => ({ chain, balance: balance.value }));
    return chainsWithBalance.length > 0 ? chainsWithBalance : sourceChains.map((chain) => ({ chain, balance: 0n }));
  }, [chainsBalances, sourceChains]);
  useEffect(() => {
    if (renderedChains.length > 0 && (!selectedChain || !renderedChains.find((c) => c.chain.id === selectedChain?.id))) {
      const defaultChain = renderedChains[0].chain;
      onChange(defaultChain.id);
      switchChain({ chainId: defaultChain.id });
    }
  }, [value, selectedChain, renderedChains, onChange, switchChain]);
  return /* @__PURE__ */ jsxs(
    Select.Root,
    {
      value: value.toString(),
      onValueChange: (value2) => {
        if (value2) {
          const chain = renderedChains.find((item) => item.chain.id.toString() === value2)?.chain;
          if (!chain) throw new Error(`Unknown chain selected: ${value2}`);
          onChange(chain.id);
        }
      },
      children: [
        /* @__PURE__ */ jsx(Input, { asChild: true, children: /* @__PURE__ */ jsxs(Select.Trigger, { className: "group inline-flex items-center justify-center", children: [
          /* @__PURE__ */ jsx(Select.Value, { asChild: true, children: /* @__PURE__ */ jsx(
            ChainIcon,
            {
              id: selectedChain?.id,
              name: selectedChain?.name,
              url: selectedChain?.relayChain?.icon?.[theme],
              className: "w-8"
            }
          ) }),
          /* @__PURE__ */ jsx(Select.Icon, { asChild: true, children: /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(ChevronDownIcon, { className: "text-sm -mr-1 group-aria-expanded:hidden" }),
            /* @__PURE__ */ jsx(ChevronUpIcon, { className: "text-sm -mr-1 hidden group-aria-expanded:inline" })
          ] }) })
        ] }) }),
        frame.contentDocument ? /* @__PURE__ */ jsx(Select.Portal, { container: frame.contentDocument.body, children: /* @__PURE__ */ jsx(
          Select.Content,
          {
            position: "popper",
            className: "w-[352px] max-h-[230px] overflow-y-auto mt-1 animate-in fade-in slide-in-from-top-2",
            children: /* @__PURE__ */ jsx(Select.Viewport, { children: /* @__PURE__ */ jsx(
              Select.Group,
              {
                className: twMerge(
                  "flex flex-col border divide-y",
                  "bg-neutral-800 text-neutral-300 border-neutral-700 divide-neutral-700"
                ),
                children: isLoading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center p-4", children: /* @__PURE__ */ jsx(PendingIcon, { className: "h-6 w-6 animate-spin text-gray-400" }) }) : renderedChains.map(({ chain, balance }) => {
                  return /* @__PURE__ */ jsxs(
                    Select.Item,
                    {
                      value: chain.id.toString(),
                      className: twMerge(
                        "group flex p-2.5 gap-2.5 items-center cursor-pointer outline-none",
                        "text-white focus:bg-neutral-700 data-[state=checked]:bg-neutral-900"
                      ),
                      children: [
                        /* @__PURE__ */ jsx(ChainIcon, { id: chain.id, name: chain.name, url: chain.relayChain?.icon?.[theme] }),
                        /* @__PURE__ */ jsx("span", { className: "flex-grow flex-shrink-0", children: chain.name }),
                        /* @__PURE__ */ jsx("span", { className: "flex-shrink-0 font-mono text-sm text-neutral-400", children: /* @__PURE__ */ jsx(Balance, { wei: balance }) })
                      ]
                    },
                    chain.id
                  );
                })
              }
            ) })
          }
        ) }) : null
      ]
    }
  );
}
var AmountInput = forwardRef(function AmountInput2({ initialAmount, onChange }, forwardedRef) {
  return /* @__PURE__ */ jsx(Input, { asChild: true, className: "w-full cursor-text flex items-center", children: /* @__PURE__ */ jsxs("label", { children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: forwardedRef,
        className: twMerge("peer flex-grow outline-none bg-transparent", "placeholder:text-neutral-500"),
        placeholder: "0.005",
        required: true,
        autoFocus: true,
        defaultValue: initialAmount == null ? "" : formatEther(initialAmount),
        onChange: (event) => {
          const input = event.currentTarget;
          if (input.value.trim() === "") {
            input.setCustomValidity("");
            onChange(void 0);
            return;
          }
          const value = input.value.trim().replace(/\.$/, ".0");
          if (!/^\d*(\.\d+)?$/.test(value)) {
            return input.setCustomValidity("Invalid amount.");
          }
          input.setCustomValidity("");
          onChange(parseEther(value));
        }
      }
    ),
    /* @__PURE__ */ jsx("span", { className: twMerge("flex-shrink-0 text-2xl", "peer-placeholder-shown:text-neutral-500"), children: /* @__PURE__ */ jsx(EthIcon, {}) })
  ] }) });
});
var MAX_DEPOSIT_AMOUNT = "0.1";
function SubmitButton({ amount, chainId, className, ...buttonProps }) {
  const { chainId: userChainId, address: userAddress } = useAccount();
  const { data: userBalance } = useBalance$1({ address: userAddress });
  const shouldSwitchChain = chainId != null && chainId !== userChainId;
  const switchChain = useSwitchChain();
  if (shouldSwitchChain) {
    return /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        variant: "primary",
        className: twMerge("w-full", className),
        pending: switchChain.isPending,
        onClick: () => switchChain.switchChain({ chainId }),
        children: "Switch chain"
      }
    );
  } else if (amount) {
    if (amount > parseEther(MAX_DEPOSIT_AMOUNT)) {
      return /* @__PURE__ */ jsxs(Button, { type: "button", className: twMerge("w-full", className), disabled: true, children: [
        "Max amount is ",
        MAX_DEPOSIT_AMOUNT,
        " ETH"
      ] });
    } else if (amount > (userBalance?.value ?? 0n)) {
      return /* @__PURE__ */ jsx(Button, { type: "button", className: twMerge("w-full", className), disabled: true, children: "Insufficient balance" });
    }
  }
  return /* @__PURE__ */ jsx(Button, { type: "submit", className: twMerge("w-full", className), ...buttonProps });
}
function WarningIcon(props) {
  return /* @__PURE__ */ jsx(IconSVG, { fill: "none", ...props, children: /* @__PURE__ */ jsx(
    "path",
    {
      d: "M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  ) });
}
function formatGas(wei) {
  const formatted = formatGwei(wei);
  const magnitude = Math.floor(parseFloat(formatted)).toString().length;
  return parseFloat(formatted).toLocaleString("en-US", { maximumFractionDigits: Math.max(0, 6 - magnitude) });
}
function DepositForm({
  sourceChain,
  setSourceChainId,
  amount,
  setAmount,
  estimatedFee,
  estimatedTime,
  onSubmit,
  submitButton
}) {
  const amountInputRef = useRef(null);
  const isMounted = useIsMounted();
  const { address: userAddress, chainId: userChainId } = useAccount();
  const balance = useShowQueryError(useBalance$1({ chainId: sourceChain.id, address: userAddress }));
  const quarryBalance = useShowQueryError(useBalance(userAddress));
  useWatchBlockNumber({
    onBlockNumber: () => {
      balance.refetch();
      quarryBalance.refetch();
    }
  });
  const minimumBalance = amount != null ? amount + (estimatedFee?.fee ?? 0n) : void 0;
  const hasMinimumBalance = balance.data != null ? balance.data.value > (minimumBalance ?? 0n) : void 0;
  useEffect(() => {
    amountInputRef.current?.focus();
  }, [userChainId]);
  return /* @__PURE__ */ jsxs(
    "form",
    {
      className: "flex flex-col gap-5",
      onSubmit: async (event) => {
        event.preventDefault();
        try {
          await onSubmit();
          if (isMounted()) {
            setAmount(void 0);
            if (amountInputRef.current) {
              amountInputRef.current.value = "";
            }
          }
        } catch (error2) {
          console.error("Error during deposit", error2);
        } finally {
          amountInputRef.current?.focus();
        }
      },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(ChainSelect, { value: sourceChain.id, onChange: setSourceChainId }),
          /* @__PURE__ */ jsx(AmountInput, { ref: amountInputRef, initialAmount: amount, onChange: setAmount })
        ] }),
        /* @__PURE__ */ jsxs(
          "dl",
          {
            className: twMerge(
              "grid grid-cols-2 divide-y text-sm leading-loose [&_>_:is(dt,dd)]:px-1 [&_>_dd]:text-right",
              "divide-neutral-700 text-neutral-400"
            ),
            children: [
              /* @__PURE__ */ jsx("dt", { children: "Available to deposit" }),
              /* @__PURE__ */ jsx("dd", { children: balance.isSuccess ? /* @__PURE__ */ jsx(Balance, { wei: balance.data.value }) : balance.isError ? /* @__PURE__ */ jsx("span", { title: String(balance.error), children: /* @__PURE__ */ jsx(WarningIcon, { className: "inline-block text-amber-500" }) }) : balance.isLoading ? /* @__PURE__ */ jsx(PendingIcon, { className: "inline-block text-xs" }) : null }),
              /* @__PURE__ */ jsx("dt", { children: "Gas balance after deposit" }),
              /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx(Balance, { wei: (quarryBalance.data ?? 0n) + (amount ?? 0n) }) }),
              /* @__PURE__ */ jsx("dt", { children: "Estimated fee" }),
              /* @__PURE__ */ jsx("dd", { children: estimatedFee.fee ? /* @__PURE__ */ jsxs(Fragment, { children: [
                formatGas(estimatedFee.fee),
                " gwei"
              ] }) : estimatedFee.error ? /* @__PURE__ */ jsx("span", { title: String(estimatedFee.error), children: /* @__PURE__ */ jsx(WarningIcon, { className: "inline-block text-amber-500" }) }) : estimatedFee.isLoading ? /* @__PURE__ */ jsx(PendingIcon, { className: "inline-block text-xs" }) : null }),
              /* @__PURE__ */ jsx("dt", { children: "Time to deposit" }),
              /* @__PURE__ */ jsx("dd", { children: estimatedTime })
            ]
          }
        ),
        hasMinimumBalance ? submitButton : /* @__PURE__ */ jsx(SubmitButton, { disabled: true, children: "Not enough funds" })
      ]
    }
  );
}
var store4 = createStore(() => ({
  count: 0,
  deposits: []
}));
function useDeposits() {
  const deposits = useStore(store4, (state) => state.deposits);
  const addDeposit = useCallback((transaction) => {
    store4.setState((state) => {
      if (transaction.type === "relay") {
        const existingDeposit = state.deposits.find(
          (deposit) => deposit.type === "relay" && deposit.requestId === transaction.requestId
        );
        if (existingDeposit) {
          return state;
        }
      }
      return {
        count: state.count + 1,
        deposits: [
          ...state.deposits,
          {
            ...transaction,
            uid: `deposit-${state.count}`
          }
        ]
      };
    });
  }, []);
  const removeDeposit = useCallback((uid) => {
    store4.setState((state) => ({
      deposits: state.deposits.filter((deposit) => deposit.uid !== uid)
    }));
  }, []);
  return useMemo(
    () => ({
      deposits,
      addDeposit,
      removeDeposit
    }),
    [addDeposit, deposits, removeDeposit]
  );
}
function DepositViaTransferForm({ amount, setAmount, sourceChain, setSourceChainId }) {
  const { chain, paymasterOverride } = useEntryKitConfig();
  const paymaster = getPaymaster(chain, paymasterOverride);
  const publicClient = usePublicClient();
  const { address: userAddress } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { addDeposit } = useDeposits();
  if (!userAddress) {
    throw new Error("User address not found");
  }
  const { data: gasPrice } = useQuery({
    queryKey: ["gasPrice", sourceChain.id],
    queryFn: async () => {
      if (!publicClient) throw new Error("Public client not available");
      return publicClient.getGasPrice();
    },
    refetchInterval: 15e3,
    enabled: !!publicClient
  });
  const { data: prepareData, error: prepareError } = usePrepareTransactionRequest({
    to: paymaster?.address,
    data: encodeFunctionData({
      abi: paymasterAbi,
      functionName: "depositTo",
      args: [userAddress]
    }),
    value: amount
  });
  const deposit = useMutation({
    mutationKey: ["depositViaTransfer", amount?.toString()],
    mutationFn: async () => {
      if (!paymaster?.address) throw new Error("Paymaster not found");
      if (!publicClient) throw new Error("Public client not found");
      if (!amount) throw new Error("Amount cannot be 0");
      try {
        const hash = await writeContractAsync({
          address: paymaster.address,
          abi: paymasterAbi,
          functionName: "depositTo",
          args: [userAddress],
          value: amount
        });
        const receipt = publicClient.waitForTransactionReceipt({ hash }).then((receipt2) => {
          if (receipt2.status === "reverted") {
            throw new Error("Transfer transaction reverted.");
          }
          return receipt2;
        });
        const pendingDeposit = {
          type: "transfer",
          amount,
          chainL1Id: sourceChain.id,
          chainL2Id: chain.id,
          hash,
          receipt,
          start: /* @__PURE__ */ new Date(),
          estimatedTime: 1e3 * 12,
          isComplete: receipt.then(() => void 0)
        };
        addDeposit(pendingDeposit);
      } catch (error2) {
        console.error("Error while depositing via bridge", error2);
        throw error2;
      }
    }
  });
  const estimatedFee = prepareData?.gas && gasPrice ? prepareData.gas * gasPrice : void 0;
  return /* @__PURE__ */ jsx(
    DepositForm,
    {
      sourceChain,
      setSourceChainId,
      amount,
      setAmount,
      estimatedFee: {
        fee: estimatedFee,
        isLoading: !prepareData && !prepareError || !gasPrice,
        error: prepareError instanceof Error ? prepareError : void 0
      },
      estimatedTime: "A few seconds",
      onSubmit: async () => {
        await deposit.mutateAsync();
      },
      submitButton: /* @__PURE__ */ jsx(
        SubmitButton,
        {
          variant: "primary",
          amount,
          chainId: sourceChain.id,
          disabled: !!prepareError || !amount || !userAddress,
          pending: deposit.isPending,
          children: "Deposit"
        }
      )
    }
  );
}
var ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
function DepositViaRelayForm({ amount, setAmount, sourceChain, setSourceChainId }) {
  const { chain, chainId: destinationChainId, paymasterOverride } = useEntryKitConfig();
  const paymaster = getPaymaster(chain, paymasterOverride);
  const { data: wallet } = useWalletClient();
  const { address: userAddress } = useAccount();
  const { addDeposit } = useDeposits();
  const { data: relay } = useRelay();
  const relayClient = relay?.client;
  const quote = useQuery({
    queryKey: ["relayBridgeQuote", sourceChain.id, amount?.toString()],
    queryFn: async () => {
      if (!relayClient) throw new Error("No Relay client found.");
      if (!userAddress) throw new Error("No user address found.");
      const result = await relayClient.actions.getQuote({
        chainId: sourceChain.id,
        toChainId: destinationChainId,
        currency: ETH_ADDRESS,
        toCurrency: ETH_ADDRESS,
        amount: amount?.toString(),
        tradeType: "EXACT_OUTPUT",
        recipient: paymaster?.address,
        wallet,
        txs: [
          {
            to: paymaster?.address,
            data: encodeFunctionData({
              abi: paymasterAbi,
              functionName: "depositTo",
              args: [userAddress]
            }),
            value: amount?.toString()
          }
        ]
      });
      if (!result) {
        throw new Error("Failed to get relay quote");
      }
      return result;
    },
    retry: 1,
    refetchInterval: 15e3,
    enabled: !!amount && !!userAddress && !!relayClient
  });
  const deposit = useMutation({
    mutationKey: ["depositViaRelay", sourceChain.id, amount?.toString()],
    mutationFn: async ({ quote: quote2, amount: amount2 }) => {
      if (!relayClient) throw new Error("No Relay client found.");
      if (!wallet) throw new Error("No wallet found.");
      try {
        return new Promise((resolve) => {
          const pendingDeposit = relayClient.actions.execute({
            quote: quote2,
            wallet,
            onProgress(progress) {
              const currentStep = progress.currentStep;
              const requestId = currentStep?.requestId;
              const currentState = currentStep?.items[0]?.progressState;
              if (requestId && currentState === "validating") {
                addDeposit({
                  type: "relay",
                  requestId,
                  amount: amount2,
                  chainL1Id: sourceChain.id,
                  chainL2Id: destinationChainId,
                  start: /* @__PURE__ */ new Date(),
                  estimatedTime: 1e3 * 30,
                  depositPromise: pendingDeposit,
                  isComplete: pendingDeposit.then(() => void 0)
                });
                resolve(void 0);
              }
            }
          });
        });
      } catch (error2) {
        console.error("Error while depositing via Relay", error2);
        throw error2;
      }
    }
  });
  const fees = quote.data?.fees;
  const gasFee = BigInt(fees?.gas?.amount ?? 0);
  const relayerFee = BigInt(fees?.relayer?.amount ?? 0);
  const fee = gasFee + relayerFee;
  return /* @__PURE__ */ jsx(
    DepositForm,
    {
      sourceChain,
      setSourceChainId,
      amount,
      setAmount,
      estimatedFee: {
        fee: fee != null ? BigInt(fee) : void 0,
        isLoading: quote.isLoading,
        error: quote.error instanceof Error ? quote.error : void 0
      },
      estimatedTime: "A few seconds",
      onSubmit: async () => {
        if (!quote.data || !amount) return;
        await deposit.mutateAsync({ quote: quote.data, amount });
      },
      submitButton: /* @__PURE__ */ jsx(
        SubmitButton,
        {
          variant: "primary",
          amount,
          chainId: sourceChain.id,
          disabled: quote.isError || !amount,
          pending: deposit.isPending,
          children: "Deposit"
        }
      )
    }
  );
}
function CloseIcon(props) {
  return /* @__PURE__ */ jsx(IconSVG, { strokeWidth: "2", stroke: "currentColor", ...props, children: /* @__PURE__ */ jsx(
    "path",
    {
      d: "M6 18L18 6M6 6L18 18",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  ) });
}
function DepositStatus({ status, progress, children, onDismiss }) {
  const [appear, setAppear] = useState(false);
  useEffect(() => {
    setAppear(true);
  }, []);
  return /* @__PURE__ */ jsxs("div", { className: "group bg-neutral-900 flex flex-col animate-in fade-in slide-in-from-bottom-2 animate-out fade-out", children: [
    /* @__PURE__ */ jsxs("div", { className: "py-1 text-sm flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-grow", children }),
      /* @__PURE__ */ jsxs("div", { className: "flex-shrink-0 grid", children: [
        /* @__PURE__ */ jsx("span", { className: "col-start-1 row-start-1 transition opacity-100 group-hover:opacity-0 group-hover:pointer-events-none", children: status === "success" ? /* @__PURE__ */ jsx(CheckIcon, { className: "text-green-600" }) : status === "error" ? /* @__PURE__ */ jsx(WarningIcon, { className: "text-amber-500" }) : /* @__PURE__ */ jsx(PendingIcon, { className: "text-neutral-500 transition" }) }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: twMerge(
              "col-start-1 row-start-1 flex items-center justify-center transition",
              "opacity-0 pointer-events-none",
              "group-hover:opacity-100 group-hover:pointer-events-auto",
              "text-neutral-500 hover:text-white"
            ),
            title: "Dismiss",
            onClick: onDismiss,
            children: /* @__PURE__ */ jsx(CloseIcon, {})
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "w-full h-[2px] -mt-full overflow-clip", children: /* @__PURE__ */ jsx(
      "div",
      {
        className: twMerge(
          "w-full h-full transition ease-linear",
          status === "success" ? "bg-green-600" : status === "error" ? "bg-red-600" : "bg-blue-600",
          status === "pending" ? "opacity-100" : "opacity-0"
        ),
        style: status === "pending" ? {
          transform: appear ? `translateX(0)` : "translate(-100%)",
          transitionDuration: `${progress.duration}ms`,
          transitionDelay: `-${Math.min(progress.duration, progress.elapsed)}ms`
        } : void 0
      }
    ) })
  ] });
}
function TransferDepositStatus({
  amount,
  chainL1Id,
  hash,
  receipt: receiptPromise,
  start,
  estimatedTime,
  onDismiss
}) {
  const chains = useChains();
  const chain = chains.find((chain2) => chain2.id === chainL1Id);
  const receipt = useQuery({
    queryKey: ["transferDepositStatus", hash],
    queryFn: () => receiptPromise
  });
  return /* @__PURE__ */ jsx(
    DepositStatus,
    {
      status: receipt.status,
      progress: {
        duration: estimatedTime,
        elapsed: Math.min(estimatedTime, Date.now() - start.getTime())
      },
      onDismiss,
      children: (() => {
        const blockExplorer = chain.blockExplorers?.default.url;
        if (receipt.status === "pending") {
          return /* @__PURE__ */ jsxs(Fragment, { children: [
            "Confirming deposit on",
            " ",
            /* @__PURE__ */ jsx(
              "a",
              {
                href: blockExplorer ? `${blockExplorer}/tx/${hash}` : void 0,
                target: "_blank",
                rel: "noreferrer noopener",
                children: chain.name
              }
            ),
            "\u2026"
          ] });
        }
        if (receipt.status === "error") {
          return /* @__PURE__ */ jsxs(Fragment, { children: [
            "Could not find deposit on",
            " ",
            /* @__PURE__ */ jsx(
              "a",
              {
                href: blockExplorer ? `${blockExplorer}/tx/${hash}` : void 0,
                target: "_blank",
                rel: "noreferrer noopener",
                children: chain.name
              }
            ),
            "."
          ] });
        }
        return /* @__PURE__ */ jsxs(Fragment, { children: [
          "Successfully",
          " ",
          /* @__PURE__ */ jsx(
            "a",
            {
              href: blockExplorer ? `${blockExplorer}/tx/${receipt.data.transactionHash}` : void 0,
              target: "_blank",
              rel: "noreferrer noopener",
              children: "deposited"
            }
          ),
          " ",
          /* @__PURE__ */ jsx(Balance, { wei: amount })
        ] });
      })()
    }
  );
}
function RelayDepositStatus({
  amount,
  chainL1Id,
  chainL2Id,
  start,
  estimatedTime,
  depositPromise,
  onDismiss
}) {
  const chains = useChains();
  const chainL1 = chains.find((chain) => chain.id === chainL1Id);
  const chainL2 = chains.find((chain) => chain.id === chainL2Id);
  const deposit = useQuery({
    queryKey: ["relayDepositPromise", chainL1Id, chainL2Id, amount.toString(), start.toISOString()],
    queryFn: () => depositPromise
  });
  return /* @__PURE__ */ jsx(
    DepositStatus,
    {
      status: deposit.status,
      progress: {
        duration: estimatedTime,
        elapsed: Math.min(estimatedTime, Date.now() - start.getTime())
      },
      onDismiss,
      children: (() => {
        if (deposit.status === "pending") {
          return /* @__PURE__ */ jsxs(Fragment, { children: [
            "Relay bridge deposit pending on ",
            chainL1.name,
            "\u2026"
          ] });
        }
        if (deposit.status === "error") {
          return /* @__PURE__ */ jsxs(Fragment, { children: [
            "Relay bridge deposit to ",
            chainL2.name,
            " failed."
          ] });
        }
        return /* @__PURE__ */ jsxs(Fragment, { children: [
          "Successfully bridged ",
          /* @__PURE__ */ jsx(Balance, { wei: amount }),
          " to ",
          chainL2.name,
          "!"
        ] });
      })()
    }
  );
}
function Deposits() {
  const queryClient = useQueryClient();
  const { chainId } = useEntryKitConfig();
  const client = useClient({ chainId });
  const { address: userAddress } = useAccount();
  const { deposits, removeDeposit } = useDeposits();
  const { data: isComplete } = useQuery({
    queryKey: ["depositsComplete", deposits.map((deposit) => deposit.uid)],
    queryFn: async () => {
      if (!deposits.length) return false;
      await Promise.all(deposits.map((deposit) => deposit.isComplete));
      return true;
    }
  });
  useEffect(() => {
    if (isComplete) {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["getBalance", client?.uid, userAddress] });
    }
  }, [client?.uid, isComplete, queryClient, userAddress]);
  if (!deposits.length) return null;
  return /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-1 mt-4", children: deposits.map((deposit) => {
    if (deposit.type === "transfer") {
      return /* @__PURE__ */ jsx(TransferDepositStatus, { ...deposit, onDismiss: () => removeDeposit(deposit.uid) }, deposit.uid);
    } else if (deposit.type === "relay") {
      return /* @__PURE__ */ jsx(RelayDepositStatus, { ...deposit, onDismiss: () => removeDeposit(deposit.uid) }, deposit.uid);
    }
  }) });
}
function DepositFormContainer() {
  const { chainId: destinationChainId } = useEntryKitConfig();
  const chainId = useChainId();
  const chains = useChains();
  const [amount, setAmount] = useState(void 0);
  const [sourceChainId, setSourceChainId] = useState(chainId);
  const sourceChain = chains.find(({ id }) => id === sourceChainId);
  return /* @__PURE__ */ jsxs("div", { className: "pt-10 pb-2", children: [
    destinationChainId === sourceChainId ? /* @__PURE__ */ jsx(
      DepositViaTransferForm,
      {
        amount,
        setAmount,
        sourceChain,
        setSourceChainId
      }
    ) : /* @__PURE__ */ jsx(
      DepositViaRelayForm,
      {
        amount,
        setAmount,
        sourceChain,
        setSourceChainId
      }
    ),
    /* @__PURE__ */ jsx(Deposits, {})
  ] });
}
function ArrowLeftIcon(props) {
  return /* @__PURE__ */ jsx(IconSVG, { ...props, children: /* @__PURE__ */ jsx(
    "path",
    {
      d: "M19 12H5M12 19l-7-7 7-7",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  ) });
}
function WithdrawGasBalanceButton({ userAddress }) {
  const { writeContractAsync } = useWriteContract();
  const { switchChain } = useSwitchChain();
  const { chain, chainId } = useEntryKitConfig();
  const { chainId: userChainId } = useAccount();
  const queryClient = useQueryClient();
  const client = useClient({ chainId });
  const paymaster = getPaymaster(chain, void 0);
  const balance = useShowQueryError(useBalance(userAddress));
  const shouldSwitchChain = chainId != null && chainId !== userChainId;
  const withdraw = useMutation({
    mutationKey: ["withdraw", userAddress],
    mutationFn: async () => {
      if (!client) throw new Error("Client not ready.");
      if (!paymaster?.address) throw new Error("Paymaster not found");
      if (!balance.data) throw new Error("No gas balance to withdraw.");
      try {
        const hash = await writeContractAsync({
          address: paymaster.address,
          abi: paymasterAbi,
          functionName: "withdrawTo",
          args: [userAddress, balance.data],
          chainId
        });
        await getAction(client, waitForTransactionReceipt, "waitForTransactionReceipt")({ hash });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["balance"] }),
          queryClient.invalidateQueries({ queryKey: ["getFunds"] }),
          queryClient.invalidateQueries({ queryKey: ["getPrerequisites"] })
        ]);
      } catch (error2) {
        console.error("Error while withdrawing", error2);
        throw error2;
      }
    }
  });
  if (balance.data == null || balance.data === 0n) {
    return null;
  }
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick: () => {
        if (shouldSwitchChain) {
          return switchChain({ chainId });
        }
        withdraw.mutate();
      },
      className: twMerge(
        "text-sm font-medium text-white/50 group whitespace-nowrap",
        withdraw.isPending ? "opacity-50 pointer-events-none" : "cursor-pointer hover:text-white"
      ),
      disabled: withdraw.isPending,
      children: /* @__PURE__ */ jsxs("span", { className: "inline-block", children: [
        /* @__PURE__ */ jsxs(
          "span",
          {
            className: twMerge(
              "inline-flex items-center gap-1 underline decoration-neutral-500 underline-offset-4",
              !withdraw.isPending && "hover:decoration-orange-500",
              shouldSwitchChain && "group-hover:hidden"
            ),
            children: [
              withdraw.isPending && /* @__PURE__ */ jsx(PendingIcon, { className: "w-3 h-3" }),
              "Withdraw"
            ]
          }
        ),
        shouldSwitchChain && /* @__PURE__ */ jsx("span", { className: "hidden group-hover:inline-block underline decoration-neutral-500 underline-offset-4 hover:decoration-orange-500", children: "Switch chain" })
      ] })
    }
  );
}
function quarrySponsor() {
  return ({ chain }) => {
    if (!chain) throw new Error("No chain provided to quarrySponsor transport.");
    const url = "quarrySponsor" in chain.rpcUrls ? chain.rpcUrls.quarrySponsor.http[0] : void 0;
    if (!url) throw new Error(`No \`quarrySponsor\` RPC URL found for chain ${chain.id}.`);
    return http(url)({ chain, retryCount: 0 });
  };
}

// src/quarry/requestAllowance.ts
async function requestAllowance({ chain, userAddress }) {
  const transport = quarrySponsor()({ chain });
  debug2("Requesting allowance for", userAddress);
  await transport.request({
    method: "sponsor_requestAllowance",
    params: [userAddress]
  });
}

// src/onboarding/quarry/useRequestAllowance.ts
function useRequestAllowance() {
  const queryClient = useQueryClient();
  const { chain } = useEntryKitConfig();
  const mutationKey = ["requestAllowance", chain.id];
  return useMutation({
    retry: 0,
    mutationKey,
    mutationFn: async (userAddress) => {
      await requestAllowance({ chain, userAddress });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["getAllowance"] }),
        queryClient.invalidateQueries({ queryKey: ["getFunds"] }),
        queryClient.invalidateQueries({ queryKey: ["getPrerequisites"] })
      ]);
    }
  });
}
function GasBalance2({ isActive, isExpanded, isFocused, setFocused, userAddress, paymaster }) {
  const queryClient = useQueryClient();
  const balance = useShowQueryError(useBalance(userAddress));
  const prevBalance = usePrevious(balance.data || 0n);
  const allowance = useShowQueryError(useAllowance(userAddress));
  const prevAllowance = usePrevious(allowance.data || 0n);
  const requestAllowance2 = useRequestAllowance();
  useEffect(() => {
    if (balance.data != null && prevBalance === 0n && balance.data > 0n) {
      queryClient.invalidateQueries({ queryKey: ["getPrerequisites"] });
      setFocused(false);
    }
  }, [balance.data, prevBalance, setFocused, queryClient, userAddress]);
  useEffect(() => {
    if (allowance.data != null && prevAllowance === 0n && allowance.data > 0n) {
      queryClient.invalidateQueries({ queryKey: ["getPrerequisites"] });
      setFocused(false);
    }
  }, [allowance.data, prevAllowance, setFocused, queryClient, userAddress]);
  const gasBalance = balance.data != null && allowance.data != null ? balance.data + allowance.data : null;
  useEffect(() => {
    if (!isActive) return;
    if (!paymaster.canSponsor) return;
    if (gasBalance !== 0n) return;
    if (requestAllowance2.status !== "idle") return;
    const timer = setTimeout(() => {
      console.log("no funds, requesting allowance");
      requestAllowance2.mutate(userAddress, {
        onSuccess(data) {
          console.log("got allowance", data);
        },
        onError(error2) {
          console.log("failed to get allowance", error2);
        }
      });
    });
    return () => clearTimeout(timer);
  }, [isActive, paymaster.canSponsor, gasBalance, requestAllowance2, userAddress]);
  if (isFocused) {
    return /* @__PURE__ */ jsxs("div", { children: [
      isFocused && /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0", children: /* @__PURE__ */ jsx(
        "div",
        {
          className: "flex items-center justify-center w-10 h-10 text-white/20 hover:text-white/40 cursor-pointer",
          onClick: () => setFocused(false),
          children: /* @__PURE__ */ jsx(ArrowLeftIcon, { className: "m-0" })
        }
      ) }),
      /* @__PURE__ */ jsx(DepositFormContainer, {})
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { children: "Gas balance" }),
        /* @__PURE__ */ jsx("div", { className: "font-mono text-white", children: gasBalance != null ? /* @__PURE__ */ jsx(Balance, { wei: gasBalance }) : /* @__PURE__ */ jsx(PendingIcon, { className: "text-sm" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 justify-center items-center", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: isActive ? "primary" : "tertiary",
            className: "flex-shrink-0 text-sm p-1 w-28",
            autoFocus: isActive || isExpanded,
            pending: balance.status === "pending" || allowance.status === "pending" || requestAllowance2.status === "pending",
            onClick: () => setFocused(true),
            children: "Top up"
          }
        ),
        /* @__PURE__ */ jsx(WithdrawGasBalanceButton, { userAddress })
      ] })
    ] }),
    isExpanded ? /* @__PURE__ */ jsxs("div", { className: "text-sm space-y-2", children: [
      /* @__PURE__ */ jsx("p", { children: "Your gas balance is used to pay for onchain computation." }),
      /* @__PURE__ */ jsxs("p", { children: [
        "You have",
        " ",
        /* @__PURE__ */ jsx("span", { className: "font-mono", children: balance.data != null ? /* @__PURE__ */ jsx(Balance, { wei: balance.data }) : /* @__PURE__ */ jsx(PendingIcon, { className: "text-sm" }) }),
        " ",
        "in gas deposits and",
        " ",
        /* @__PURE__ */ jsx("span", { className: "font-mono", children: allowance.data != null ? /* @__PURE__ */ jsx(Balance, { wei: allowance.data }) : /* @__PURE__ */ jsx(PendingIcon, { className: "text-sm" }) }),
        " ",
        "in gas grants."
      ] })
    ] }) : null
  ] });
}
function ConnectedSteps({ connector, userClient, initialUserAddress }) {
  const { chain, paymasterOverride } = useEntryKitConfig();
  const paymaster = getPaymaster(chain, paymasterOverride);
  const [focusedId, setFocusedId] = useState(null);
  const userAddress = userClient.account.address;
  const { data: prerequisites, error: prerequisitesError } = usePrerequisites(userAddress);
  useEffect(() => {
    if (prerequisitesError) {
      console.error("Could not get prerequisites", prerequisitesError);
    }
  }, [prerequisitesError]);
  const { closeAccountModal } = useAccountModal();
  const isNewConnection = userAddress !== initialUserAddress;
  const initialPrerequisites = useRef(prerequisites);
  useEffect(() => {
    if (prerequisites == null) return;
    if (initialPrerequisites.current == null) {
      initialPrerequisites.current = prerequisites;
    }
    if (prerequisites.complete) {
      if (isNewConnection || !initialPrerequisites.current.complete) {
        closeAccountModal();
      }
    }
  }, [closeAccountModal, isNewConnection, prerequisites]);
  const { sessionAddress, hasAllowance, isSpender, hasDelegation, hasGasBalance, hasQuarryGasBalance } = prerequisites ?? {};
  const steps = useMemo(() => {
    if (!userAddress) {
      return [
        {
          id: "wallet",
          isComplete: false,
          content: () => null
        }
      ];
    }
    const steps2 = [
      {
        id: "wallet",
        isComplete: true,
        content: (props) => /* @__PURE__ */ jsx(Wallet, { ...props, userAddress })
      }
    ];
    if (!paymaster) {
      if (sessionAddress != null) {
        steps2.push({
          id: "gasBalance",
          isComplete: !!hasGasBalance,
          content: (props) => /* @__PURE__ */ jsx(GasBalance, { ...props, sessionAddress })
        });
      }
    } else if (paymaster.type === "quarry") {
      steps2.push({
        id: "gasBalanceQuarry",
        isComplete: !!hasQuarryGasBalance || !!hasAllowance,
        content: (props) => /* @__PURE__ */ jsx(GasBalance2, { ...props, userAddress, paymaster })
      });
    }
    steps2.push({
      id: "session",
      isComplete: !!isSpender && !!hasDelegation,
      content: (props) => /* @__PURE__ */ jsx(
        Session,
        {
          ...props,
          userClient,
          connector,
          registerSpender: !isSpender,
          registerDelegation: !hasDelegation
        }
      )
    });
    return steps2;
  }, [
    hasAllowance,
    hasDelegation,
    hasGasBalance,
    hasQuarryGasBalance,
    isSpender,
    paymaster,
    sessionAddress,
    userAddress,
    userClient,
    connector
  ]);
  const [selectedStepId] = useState(null);
  const nextStep = steps.find((step) => step.content != null && !step.isComplete);
  const completedSteps = steps.filter((step) => step.isComplete);
  const activeStep = (selectedStepId != null ? steps.find((step) => step.id === selectedStepId) : null) ?? nextStep ?? (completedSteps.length < steps.length ? completedSteps.at(-1) : null);
  const activeStepIndex = activeStep ? steps.indexOf(activeStep) : -1;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: twMerge(
        "px-8 flex flex-col",
        "divide-y divide-neutral-800",
        "animate-in animate-duration-300 fade-in slide-in-from-bottom-8"
      ),
      children: steps.map((step, i) => {
        const isActive = step === activeStep;
        const isExpanded = isActive || completedSteps.length === steps.length;
        const isDisabled = !step.isComplete && activeStepIndex !== -1 && i > activeStepIndex;
        const isFocused = focusedId === step.id;
        const content = step.content({
          isActive,
          isExpanded,
          isFocused,
          setFocused: (focused) => setFocusedId(focused ? step.id : null)
        });
        if (focusedId) {
          if (step.id === focusedId) {
            return content;
          }
          return null;
        }
        return /* @__PURE__ */ jsx("div", { className: twMerge("py-8 flex flex-col justify-center", isActive ? "flex-grow" : null), children: /* @__PURE__ */ jsx("div", { className: twMerge("flex flex-col", isDisabled ? "opacity-30 pointer-events-none" : null), children: content }) }, step.id);
      })
    }
  );
}
function AccountModalContent() {
  const { chainId } = useEntryKitConfig();
  const { address: userAddress, connector } = useAccount();
  const userClient = useConnectorClient({ chainId, connector });
  const initialUserAddress = useRef(userAddress);
  if (userClient.status !== "success") {
    return /* @__PURE__ */ jsx(ConnectWallet, {});
  }
  return /* @__PURE__ */ jsx(
    ConnectedSteps,
    {
      connector,
      userClient: userClient.data,
      initialUserAddress: initialUserAddress.current
    }
  );
}
function ErrorOverlay({ error: error2, retry, dismiss }) {
  useEffect(() => {
    if (error2) {
      console.error(error2);
    }
  }, [error2]);
  return /* @__PURE__ */ jsxs("div", { className: "pointer-events-none absolute inset-0 overflow-clip", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: twMerge(
          "absolute inset-0 bg-blue-700/60",
          "transition duration-300",
          error2 ? "opacity-100 pointer-events-auto" : "opacity-0"
        )
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: twMerge(
          "absolute inset-0 pb-8",
          "transition duration-300",
          error2 ? "translate-y-0 opacity-100 pointer-events-auto" : "-translate-y-4 opacity-0"
        ),
        children: error2 ? /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs("div", { className: "w-full max-h-full bg-blue-700 text-white/80 overflow-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-6 px-8 pt-8", children: [
            /* @__PURE__ */ jsx("div", { className: "text-white text-lg font-bold", children: "Oops! It broke :(" }),
            /* @__PURE__ */ jsx("div", { className: "font-mono text-xs whitespace-pre-wrap", children: error2.message.trim() }),
            /* @__PURE__ */ jsx("div", { className: "text-sm", children: "See the console for more info." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pointer-events-none sticky bottom-0 left-0 -mt-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-full h-12 bg-gradient-to-b from-transparent to-blue-700" }),
            retry ? /* @__PURE__ */ jsx("div", { className: "bg-blue-700 text-center", children: /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                className: twMerge(
                  "pointer-events-auto group w-24 p-1 -translate-y-2 transition",
                  "bg-blue-600 hover:bg-blue-500 aria-busy:bg-blue-500",
                  "text-white text-sm font-medium",
                  "aria-busy:pointer-events-none"
                ),
                onClick: async (event) => {
                  event.currentTarget.ariaBusy = "true";
                  await wait(500);
                  retry();
                  if (event.currentTarget) {
                    event.currentTarget.ariaBusy = null;
                  }
                },
                children: [
                  /* @__PURE__ */ jsx("span", { className: "group-aria-busy:hidden", children: "Retry" }),
                  /* @__PURE__ */ jsx("span", { className: "hidden group-aria-busy:inline", children: "Retrying\u2026" })
                ]
              }
            ) }) : dismiss ? /* @__PURE__ */ jsx("div", { className: "bg-blue-700 text-center", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: twMerge(
                  "pointer-events-auto group w-24 p-1 -translate-y-2 transition",
                  "bg-blue-600 hover:bg-blue-500 aria-busy:bg-blue-500",
                  "text-white text-sm font-medium",
                  "aria-busy:pointer-events-none"
                ),
                onClick: dismiss,
                children: "Dismiss"
              }
            ) }) : null
          ] })
        ] }) }) : null
      }
    )
  ] });
}
function ErrorFallback({ error: error2, resetErrorBoundary }) {
  return /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ErrorOverlay, { error: error2, retry: resetErrorBoundary }) });
}
function ErrorsOverlay() {
  const error2 = useStore(store3, (state) => state.errors.at(0));
  return /* @__PURE__ */ jsx(ErrorOverlay, { error: error2?.error, retry: error2?.retry, dismiss: error2?.dismiss });
}
function AccountModal() {
  const { accountModalOpen, toggleAccountModal } = useAccountModal();
  return /* @__PURE__ */ jsx(Modal, { open: accountModalOpen, onOpenChange: toggleAccountModal, children: accountModalOpen ? /* @__PURE__ */ jsxs(
    "div",
    {
      className: twMerge(
        "relative py-2 ring-1",
        "bg-neutral-900 text-neutral-400 ring-neutral-700/50",
        "links:font-medium links:underline links:underline-offset-4",
        "links:text-white",
        "links:decoration-neutral-500 hover:links:decoration-orange-500"
      ),
      children: [
        /* @__PURE__ */ jsxs(ErrorBoundary, { FallbackComponent: ErrorFallback, children: [
          /* @__PURE__ */ jsx(AccountModalContent, {}),
          /* @__PURE__ */ jsx(ErrorsOverlay, {})
        ] }),
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: "https://mud.dev",
            target: "_blank",
            rel: "noreferrer noopener",
            className: "group self-center p-3 flex items-center justify-center gap-2 links-unset text-sm font-mono transition text-neutral-400 hover:text-white",
            children: [
              /* @__PURE__ */ jsx("span", { className: "block w-4 h-4", children: /* @__PURE__ */ jsx(Logo, { className: "w-full h-full text-orange-500 group-hover:rotate-90 transition duration-300" }) }),
              /* @__PURE__ */ jsx("span", { children: "Powered by MUD" })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0", children: /* @__PURE__ */ jsx(
          DialogClose,
          {
            className: twMerge(
              "pointer-events-auto leading-none p-2 transition",
              "text-white/20 hover:text-white/40"
            ),
            title: "Close",
            children: /* @__PURE__ */ jsx(CloseIcon, { className: "m-0" })
          }
        ) })
      ]
    }
  ) : null });
}
function EntryKitProvider({ config, children }) {
  return /* @__PURE__ */ jsxs(EntryKitConfigProvider, { config, children: [
    children,
    /* @__PURE__ */ jsx(AccountModal, {})
  ] });
}
function AccountName({ address }) {
  const { data: ens } = useENS(address);
  const avatar = usePreloadImage(ens?.avatar);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("span", { className: "flex-shrink-0 w-6 h-6 -my-1 -mx-0.5 grid place-items-center", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: ens?.avatar && avatar.isSuccess ? ens.avatar : void 0,
          className: twMerge(
            "col-start-1 row-start-1",
            "inline-flex w-full h-full rounded-full bg-black/10 dark:bg-white/10 bg-cover bg-no-repeat bg-center",
            "transtion duration-300",
            avatar.isSuccess ? "opacity-100" : "opacity-0"
          )
        }
      ),
      /* @__PURE__ */ jsx(
        Logo,
        {
          className: twMerge(
            "col-start-1 row-start-1 text-orange-500",
            "transition duration-300",
            ens && (!ens.avatar || avatar.isError) ? "opacity-100" : "opacity-0"
          )
        }
      )
    ] }),
    /* @__PURE__ */ jsx("span", { className: "flex-grow", children: ens?.name ?? /* @__PURE__ */ jsx(TruncatedHex, { hex: address }) })
  ] });
}
var containerClassNames = twMerge(
  "w-48 p-3 inline-flex outline-none transition",
  "border border-transparent",
  "text-base leading-none"
);
var secondaryClassNames = twMerge(
  "bg-neutral-100 border-neutral-300 text-black",
  "dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
);
var secondaryInteractiveClassNames = twMerge(
  "cursor-pointer outline-none hover:bg-neutral-200 data-[highlighted]:bg-neutral-200 dark:hover:bg-neutral-700"
);
function AccountButton2() {
  const { openAccountModal, accountModalOpen } = useAccountModal();
  const { status, address: userAddress } = useAccount();
  const initialUserAddress = useRef(userAddress);
  const prereqs = usePrerequisites(userAddress);
  const isConnected = status === "connected" || status === "reconnecting" && userAddress;
  const isNewConnection = userAddress !== initialUserAddress.current;
  const isSignedIn = prereqs.isSuccess ? prereqs.data.complete : isNewConnection ? false : isConnected;
  const buttonLabel = (() => {
    if (prereqs.isSuccess) {
      if (!prereqs.data.hasAllowance) return "Top up";
      if (!prereqs.data.hasDelegation || !prereqs.data.isSpender) return "Set up";
    }
    return "Sign in";
  })();
  return /* @__PURE__ */ jsx(Shadow, { mode: "child", children: isSignedIn ? /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      className: twMerge(containerClassNames, secondaryClassNames, secondaryInteractiveClassNames),
      onClick: openAccountModal,
      children: /* @__PURE__ */ jsx("span", { className: "flex-grow inline-flex gap-2.5 items-center text-left font-medium", children: userAddress ? /* @__PURE__ */ jsx(AccountName, { address: userAddress }) : null })
    },
    "connected"
  ) : /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      className: twMerge(
        containerClassNames,
        "group",
        "items-center justify-center gap-2.5",
        "bg-orange-500 text-white font-medium",
        "hover:bg-orange-400",
        "active:bg-orange-600"
      ),
      "aria-busy": accountModalOpen || prereqs.isPending,
      onClick: openAccountModal,
      children: [
        /* @__PURE__ */ jsxs("span", { className: "pointer-events-none inline-grid place-items-center -ml-3", children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              className: twMerge(
                "col-start-1 row-start-1 leading-none",
                "scale-100 opacity-100 transition duration-300",
                "group-aria-busy:scale-125 group-aria-busy:opacity-0"
              ),
              children: /* @__PURE__ */ jsx(Logo, {})
            }
          ),
          /* @__PURE__ */ jsx(
            "span",
            {
              "aria-hidden": true,
              className: twMerge(
                "col-start-1 row-start-1",
                "scale-50 opacity-0 transition duration-300 delay-50",
                "group-aria-busy:scale-100 group-aria-busy:opacity-100"
              ),
              children: /* @__PURE__ */ jsx(PendingIcon, {})
            }
          )
        ] }),
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: buttonLabel })
      ]
    },
    "sign in"
  ) });
}
function useSessionClientReady() {
  const { chainId } = useEntryKitConfig();
  const userClient = useConnectorClient({ chainId });
  if (userClient.error) console.error("Error retrieving user client", userClient.error);
  const userAddress = userClient.data?.account.address;
  const prerequisites = usePrerequisites(userAddress);
  const sessionClient = useSessionClient(userAddress);
  if (!prerequisites.isSuccess || !prerequisites.data.complete) {
    return { ...prerequisites, data: void 0 };
  }
  return sessionClient;
}
walletConnect.type = "walletConnect";
function walletConnect(parameters) {
  const isNewChainsStale = parameters.isNewChainsStale ?? true;
  let provider_;
  let providerPromise;
  const NAMESPACE = "eip155";
  let accountsChanged;
  let chainChanged;
  let connect;
  let displayUri;
  let sessionDelete;
  let disconnect;
  return createConnector((config) => ({
    id: "walletConnect",
    name: "WalletConnect",
    type: walletConnect.type,
    async setup() {
      const provider = await this.getProvider().catch(() => null);
      if (!provider) return;
      if (!connect) {
        connect = this.onConnect.bind(this);
        provider.on("connect", connect);
      }
      if (!sessionDelete) {
        sessionDelete = this.onSessionDelete.bind(this);
        provider.on("session_delete", sessionDelete);
      }
    },
    async connect({ chainId, ...rest } = {}) {
      try {
        const provider = await this.getProvider();
        if (!provider) throw new ProviderNotFoundError();
        if (!displayUri) {
          displayUri = this.onDisplayUri;
          provider.on("display_uri", displayUri);
        }
        let targetChainId = chainId;
        if (!targetChainId) {
          const state = await config.storage?.getItem("state") ?? {};
          const isChainSupported = config.chains.some((x) => x.id === state.chainId);
          if (isChainSupported) targetChainId = state.chainId;
          else targetChainId = config.chains[0]?.id;
        }
        if (!targetChainId) throw new Error("No chains found on connector.");
        const isChainsStale = await this.isChainsStale();
        if (provider.session && isChainsStale) await provider.disconnect();
        if (!provider.session || isChainsStale) {
          const optionalChains = config.chains.filter((chain) => chain.id !== targetChainId).map((optionalChain) => optionalChain.id);
          await provider.connect({
            optionalChains: [targetChainId, ...optionalChains],
            ..."pairingTopic" in rest ? { pairingTopic: rest.pairingTopic } : {}
          });
          this.setRequestedChainsIds(config.chains.map((x) => x.id));
        }
        const accounts = (await provider.enable()).map((x) => getAddress(x));
        let currentChainId = await this.getChainId();
        if (chainId && currentChainId !== chainId) {
          const chain = await this.switchChain({ chainId }).catch((error2) => {
            if (error2.code === UserRejectedRequestError.code) throw error2;
            return { id: currentChainId };
          });
          currentChainId = chain?.id ?? currentChainId;
        }
        if (displayUri) {
          provider.removeListener("display_uri", displayUri);
          displayUri = void 0;
        }
        if (connect) {
          provider.removeListener("connect", connect);
          connect = void 0;
        }
        if (!accountsChanged) {
          accountsChanged = this.onAccountsChanged.bind(this);
          provider.on("accountsChanged", accountsChanged);
        }
        if (!chainChanged) {
          chainChanged = this.onChainChanged.bind(this);
          provider.on("chainChanged", chainChanged);
        }
        if (!disconnect) {
          disconnect = this.onDisconnect.bind(this);
          provider.on("disconnect", disconnect);
        }
        if (!sessionDelete) {
          sessionDelete = this.onSessionDelete.bind(this);
          provider.on("session_delete", sessionDelete);
        }
        return { accounts, chainId: currentChainId };
      } catch (error2) {
        if (/(user rejected|connection request reset)/i.test(error2?.message)) {
          throw new UserRejectedRequestError(error2);
        }
        throw error2;
      }
    },
    async disconnect() {
      const provider = await this.getProvider();
      try {
        await provider?.disconnect();
      } catch (error2) {
        if (!/No matching key/i.test(error2.message)) throw error2;
      } finally {
        if (chainChanged) {
          provider?.removeListener("chainChanged", chainChanged);
          chainChanged = void 0;
        }
        if (disconnect) {
          provider?.removeListener("disconnect", disconnect);
          disconnect = void 0;
        }
        if (!connect) {
          connect = this.onConnect.bind(this);
          provider?.on("connect", connect);
        }
        if (accountsChanged) {
          provider?.removeListener("accountsChanged", accountsChanged);
          accountsChanged = void 0;
        }
        if (sessionDelete) {
          provider?.removeListener("session_delete", sessionDelete);
          sessionDelete = void 0;
        }
        this.setRequestedChainsIds([]);
      }
    },
    async getAccounts() {
      const provider = await this.getProvider();
      return provider.accounts.map((x) => getAddress(x));
    },
    async getProvider() {
      async function initProvider() {
        const optionalChains = config.chains.map((x) => x.id);
        if (!optionalChains.length) return;
        const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
        return await EthereumProvider.init({
          ...parameters,
          disableProviderPing: true,
          optionalChains,
          projectId: parameters.projectId,
          rpcMap: Object.fromEntries(
            config.chains.map((chain) => {
              const [url] = extractRpcUrls({
                chain,
                transports: config.transports
              });
              return [chain.id, url];
            })
          ),
          showQrModal: parameters.showQrModal ?? true
        });
      }
      if (!provider_) {
        if (!providerPromise) providerPromise = initProvider();
        provider_ = await providerPromise;
        provider_?.events.setMaxListeners(Number.POSITIVE_INFINITY);
      }
      return provider_;
    },
    async getChainId() {
      const provider = await this.getProvider();
      return provider.chainId;
    },
    async isAuthorized() {
      try {
        const [accounts, provider] = await Promise.all([this.getAccounts(), this.getProvider()]);
        if (!accounts.length) return false;
        const isChainsStale = await this.isChainsStale();
        if (isChainsStale && provider.session) {
          await provider.disconnect().catch(() => {
          });
          return false;
        }
        return true;
      } catch {
        return false;
      }
    },
    async switchChain({ addEthereumChainParameter, chainId }) {
      const provider = await this.getProvider();
      if (!provider) throw new ProviderNotFoundError();
      const chain = config.chains.find((x) => x.id === chainId);
      if (!chain) throw new SwitchChainError(new ChainNotConfiguredError());
      try {
        await Promise.all([
          new Promise((resolve) => {
            const listener2 = ({ chainId: currentChainId }) => {
              if (currentChainId === chainId) {
                config.emitter.off("change", listener2);
                resolve();
              }
            };
            config.emitter.on("change", listener2);
          }),
          provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: numberToHex(chainId) }]
          })
        ]);
        const requestedChains = await this.getRequestedChainsIds();
        this.setRequestedChainsIds([...requestedChains, chainId]);
        return chain;
      } catch (err) {
        const error2 = err;
        if (/(user rejected)/i.test(error2.message)) throw new UserRejectedRequestError(error2);
        try {
          let blockExplorerUrls;
          if (addEthereumChainParameter?.blockExplorerUrls)
            blockExplorerUrls = addEthereumChainParameter.blockExplorerUrls;
          else blockExplorerUrls = chain.blockExplorers?.default.url ? [chain.blockExplorers?.default.url] : [];
          let rpcUrls;
          if (addEthereumChainParameter?.rpcUrls?.length) rpcUrls = addEthereumChainParameter.rpcUrls;
          else rpcUrls = [...chain.rpcUrls.default.http];
          const addEthereumChain = {
            blockExplorerUrls,
            chainId: numberToHex(chainId),
            chainName: addEthereumChainParameter?.chainName ?? chain.name,
            iconUrls: addEthereumChainParameter?.iconUrls,
            nativeCurrency: addEthereumChainParameter?.nativeCurrency ?? chain.nativeCurrency,
            rpcUrls
          };
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [addEthereumChain]
          });
          const requestedChains = await this.getRequestedChainsIds();
          this.setRequestedChainsIds([...requestedChains, chainId]);
          return chain;
        } catch (error3) {
          throw new UserRejectedRequestError(error3);
        }
      }
    },
    onAccountsChanged(accounts) {
      if (accounts.length === 0) this.onDisconnect();
      else
        config.emitter.emit("change", {
          accounts: accounts.map((x) => getAddress(x))
        });
    },
    onChainChanged(chain) {
      const chainId = Number(chain);
      config.emitter.emit("change", { chainId });
    },
    async onConnect(connectInfo) {
      const chainId = Number(connectInfo.chainId);
      const accounts = await this.getAccounts();
      config.emitter.emit("connect", { accounts, chainId });
    },
    async onDisconnect(_error) {
      this.setRequestedChainsIds([]);
      config.emitter.emit("disconnect");
      const provider = await this.getProvider();
      if (accountsChanged) {
        provider.removeListener("accountsChanged", accountsChanged);
        accountsChanged = void 0;
      }
      if (chainChanged) {
        provider.removeListener("chainChanged", chainChanged);
        chainChanged = void 0;
      }
      if (disconnect) {
        provider.removeListener("disconnect", disconnect);
        disconnect = void 0;
      }
      if (sessionDelete) {
        provider.removeListener("session_delete", sessionDelete);
        sessionDelete = void 0;
      }
      if (!connect) {
        connect = this.onConnect.bind(this);
        provider.on("connect", connect);
      }
    },
    onDisplayUri(uri) {
      config.emitter.emit("message", { type: "display_uri", data: uri });
    },
    onSessionDelete() {
      this.onDisconnect();
    },
    getNamespaceChainsIds() {
      if (!provider_) return [];
      const chainIds = provider_.session?.namespaces[NAMESPACE]?.accounts?.map(
        (account) => Number.parseInt(account.split(":")[1] || "")
      );
      return chainIds ?? [];
    },
    async getRequestedChainsIds() {
      return await config.storage?.getItem(this.requestedChainsStorageKey) ?? [];
    },
    /**
     * Checks if the target chains match the chains that were
     * initially requested by the connector for the WalletConnect session.
     * If there is a mismatch, this means that the chains on the connector
     * are considered stale, and need to be revalidated at a later point (via
     * connection).
     *
     * There may be a scenario where a dapp adds a chain to the
     * connector later on, however, this chain will not have been approved or rejected
     * by the wallet. In this case, the chain is considered stale.
     */
    async isChainsStale() {
      if (!isNewChainsStale) return false;
      const connectorChains = config.chains.map((x) => x.id);
      const namespaceChains = this.getNamespaceChainsIds();
      if (namespaceChains.length && !namespaceChains.some((id) => connectorChains.includes(id))) return false;
      const requestedChains = await this.getRequestedChainsIds();
      return !connectorChains.every((id) => requestedChains.includes(id));
    },
    async setRequestedChainsIds(chains) {
      await config.storage?.setItem(this.requestedChainsStorageKey, chains);
    },
    get requestedChainsStorageKey() {
      return `${this.id}.requestedChains`;
    }
  }));
}
function extractRpcUrls(parameters) {
  const { chain } = parameters;
  const fallbackUrl = chain.rpcUrls.default.http[0];
  if (!parameters.transports) return [fallbackUrl];
  const transport = parameters.transports?.[chain.id]?.({ chain });
  const transports = transport?.value?.transports || [transport];
  return transports.map(({ value }) => value?.url || fallbackUrl);
}

// src/getDefaultConnectors.ts
function getDefaultConnectors(config) {
  const connectors = [];
  const shouldUseSafeConnector = !(typeof window === "undefined") && window?.parent !== window;
  if (shouldUseSafeConnector) {
    connectors.push(
      safe({
        allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/]
      })
    );
  }
  connectors.push(
    injected({ target: "metaMask" }),
    coinbaseWallet({
      appName: config.appName,
      overrideIsMetaMask: false
    })
  );
  if (config.walletConnectProjectId) {
    connectors.push(
      walletConnect({
        showQrModal: false,
        projectId: config.walletConnectProjectId
      })
    );
  }
  return connectors;
}

// src/createWagmiConfig.ts
function createWagmiConfig(config) {
  const connectors = config.connectors ?? getDefaultConnectors(config);
  const configParams = getDefaultConfig({
    chains: config.chains,
    transports: config.transports,
    pollingInterval: config.pollingInterval,
    appName: config.appName,
    walletConnectProjectId: config.walletConnectProjectId,
    enableFamily: false,
    connectors
  });
  return createConfig(configParams);
}
function withFeeCache(chain, options = { refreshInterval: 1e4 }) {
  if (chain.fees?.estimateFeesPerGas) {
    throw new Error("withFeeCache: estimateFeesPerGas already defined in chain config");
  }
  const client = createClient({
    chain,
    transport: http()
  });
  return {
    ...chain,
    fees: {
      ...chain.fees,
      estimateFeesPerGas: cachedFeesPerGas(client, options)
    }
  };
}
async function internal_validateSigner({
  client,
  worldAddress,
  userAddress,
  sessionAddress,
  signerAddress
}) {
  const ownerAddress = await readContract(client, {
    address: sessionAddress,
    abi: simpleAccountAbi,
    functionName: "owner"
  });
  if (ownerAddress.toLowerCase() !== signerAddress.toLowerCase()) {
    throw new Error(`Session account owner (${ownerAddress}) does not match message signer (${signerAddress}).`);
  }
  const hasDelegation = await getDelegation({
    client,
    worldAddress,
    sessionAddress,
    userAddress,
    blockTag: "latest"
  });
  if (!hasDelegation) {
    throw new Error(`Session account (${sessionAddress}) does not have delegation for user account (${userAddress}).`);
  }
}
var simpleAccountAbi = [
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
];

export { AccountButton2 as AccountButton, EntryKitProvider, createBundlerClient, createWagmiConfig, defineCall, defineConfig, getBundlerTransport, getDefaultConnectors, getFundsQueryOptions, internal_validateSigner, useAccountModal, useEntryKitConfig, useFunds, useSessionClientReady as useSessionClient, withFeeCache };
//# sourceMappingURL=internal.js.map
//# sourceMappingURL=internal.js.map
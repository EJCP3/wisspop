/**
 * Bootstrap de DOM para tests de core/*.test.js con `node --test`.
 *
 * El nombre no empieza con `test-` ni termina en `.test.js` a propósito: es
 * un helper, no una suite — con cualquiera de esos dos patrones, la
 * detección automática de `node --test` lo confunde con una suite vacía y
 * lo "corre" igual (sin aserciones, sin fallar, solo ruido y tiempo perdido).
 *
 * GSAP mira `typeof document` en el momento del `import`, así que `window`/
 * `document` tienen que existir ANTES de esa línea — y como los `import`
 * estáticos de ES modules se izan por encima de cualquier código del archivo,
 * la única forma es un `import()` dinámico después de llamar a `setupDom()`.
 * Por eso cada test hace:
 *
 *   import { setupDom } from "./dom-test-setup.js";
 *   setupDom();
 *   const { gsap } = await import("gsap");
 *   const { Flip } = await import("gsap/Flip"); // si hace falta
 *
 * jsdom no calcula layout real: todo `getBoundingClientRect` da 0x0. Los
 * tests que necesitan geometría la simulan pisando ese método a mano — la
 * lógica de posicionamiento en sí (`place.js`) ya se prueba sin DOM.
 */
import { JSDOM } from "jsdom";

export function setupDom() {
  const dom = new JSDOM("<!doctype html><body></body>", { url: "http://localhost/" });
  const { window } = dom;

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.getComputedStyle = window.getComputedStyle.bind(window);
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Node = window.Node;

  // jsdom no implementa matchMedia. `reducedMotion()` en el core lo llama tal
  // cual, así que alcanza con un stub que siempre dice "no reducido" —
  // los tests que sí quieren reduced-motion pisan `matches` en el objeto.
  const mm = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.matchMedia = window.matchMedia || mm;
  globalThis.matchMedia = window.matchMedia;

  // jsdom no dispara rAF solo: sin esto, cualquier `await new Promise(r =>
  // requestAnimationFrame(r))` del core (flip.js) se queda colgado para
  // siempre — el mismo síntoma que el panel del navegador sin compositar.
  window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 0);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame;

  // flip.js/morph.js llaman `addEventListener("keydown", …)` e
  // `innerWidth`/`innerHeight` a secas — en un browser real eso resuelve al
  // `window` global implícito. En Node no hay ningún global así de por sí,
  // hay que engancharlo a mano.
  globalThis.addEventListener = window.addEventListener.bind(window);
  globalThis.removeEventListener = window.removeEventListener.bind(window);
  Object.defineProperty(globalThis, "innerWidth", { get: () => window.innerWidth, configurable: true });
  Object.defineProperty(globalThis, "innerHeight", { get: () => window.innerHeight, configurable: true });

  return { window, document: window.document };
}

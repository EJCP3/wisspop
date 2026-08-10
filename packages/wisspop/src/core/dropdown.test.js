/** node --test src/core/dropdown.test.js */
import assert from "node:assert/strict";
import { test } from "node:test";
import { setupDom } from "./dom-test-setup.js";

setupDom();
const { gsap } = await import("gsap");
const { enterDropdownAnimation, leaveDropdownAnimation } = await import("./dropdown.js");

const nuevoEl = () => {
  const el = document.createElement("div");
  document.body.append(el);
  return el;
};

/**
 * Se intercepta la llamada a gsap.{to,fromTo} para inspeccionar las vars que
 * el core realmente arma, en vez de leer el CSS resultante: jsdom no
 * serializa fielmente las propiedades de transform individuales de GSAP 3.13
 * (`scale`, `rotate`) y da falsos negativos por una limitación del motor de
 * CSS de jsdom, no del código. Las vars sí son el contrato real.
 */
function espiar(metodo, fn) {
  const orig = gsap[metodo];
  let capturado;
  gsap[metodo] = (...args) => {
    capturado = args;
    return orig.apply(gsap, args);
  };
  try {
    fn();
  } finally {
    gsap[metodo] = orig;
  }
  return capturado;
}

test("enterDropdownAnimation: vars por defecto (scaleY 0→1, back.out, 0.35s)", () => {
  const [, from, to] = espiar("fromTo", () => enterDropdownAnimation(nuevoEl()));
  assert.deepEqual(from, { scaleY: 0, scaleX: 0.88, opacity: 0, transformOrigin: "top center" });
  assert.equal(to.scaleY, 1);
  assert.equal(to.scaleX, 1);
  assert.equal(to.opacity, 1);
  assert.equal(to.duration, 0.35);
  assert.equal(to.ease, "back.out(1.6)");
  assert.equal(to.clearProps, "transform,opacity");
});

test("enterDropdownAnimation: transformOrigin custom se respeta (RF dropdown direccional)", () => {
  const [, from] = espiar("fromTo", () =>
    enterDropdownAnimation(nuevoEl(), null, { transformOrigin: "bottom center" }),
  );
  assert.equal(from.transformOrigin, "bottom center");
});

test("enterDropdownAnimation: llama a `done` y limpia el transform inline al terminar", () => {
  const el = nuevoEl();
  let llamado = false;
  // Hace falta el tween en sí (no solo sus vars) para completarlo con
  // `.progress(1)` sin esperar tiempo real — mismo truco que se usó para
  // verificar a mano los flips de FlipModal esta sesión.
  let capturedTween;
  const orig = gsap.fromTo;
  gsap.fromTo = (...args) => (capturedTween = orig.apply(gsap, args));
  enterDropdownAnimation(el, () => (llamado = true));
  gsap.fromTo = orig;

  capturedTween.progress(1);
  assert.ok(llamado, "el callback done no se llamó");
  // clearProps: "transform,opacity" — si no limpia, un elemento reabierto sin
  // pasar por el core hereda un `transform`/`opacity` colgado de la última
  // apertura (misma clase de bug que el `clearProps` que faltaba en flip.js).
  assert.equal(el.style.transform, "");
  assert.equal(el.style.opacity, "");
});

test("leaveDropdownAnimation: vars por defecto (scaleY→0, power3.in, 0.2s)", () => {
  const [, vars] = espiar("to", () => leaveDropdownAnimation(nuevoEl()));
  assert.equal(vars.scaleY, 0);
  assert.equal(vars.scaleX, 0.9);
  assert.equal(vars.opacity, 0);
  assert.equal(vars.duration, 0.2);
  assert.equal(vars.ease, "power3.in");
  assert.equal(vars.transformOrigin, "top center");
});

test("leaveDropdownAnimation: transformOrigin custom se respeta", () => {
  const [, vars] = espiar("to", () =>
    leaveDropdownAnimation(nuevoEl(), null, { transformOrigin: "left center" }),
  );
  assert.equal(vars.transformOrigin, "left center");
});

test("leaveDropdownAnimation: llama a `done` al terminar", () => {
  const el = nuevoEl();
  let llamado = false;
  let capturedTween;
  const orig = gsap.to;
  gsap.to = (...args) => (capturedTween = orig.apply(gsap, args));
  leaveDropdownAnimation(el, () => (llamado = true));
  gsap.to = orig;

  capturedTween.progress(1);
  assert.ok(llamado, "el callback done no se llamó");
});

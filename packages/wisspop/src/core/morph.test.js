/** node --test src/core/morph.test.js */
import assert from "node:assert/strict";
import { test } from "node:test";
import { setupDom } from "./dom-test-setup.js";

setupDom();
const { gsap } = await import("gsap");
const { createMorph } = await import("./morph.js");

function hacerloVisible(el) {
  Object.defineProperty(el, "offsetWidth", { value: 100, configurable: true });
  Object.defineProperty(el, "offsetHeight", { value: 40, configurable: true });
}

function stubRect(el, rect) {
  el.getBoundingClientRect = () => ({ right: rect.left + rect.width, bottom: rect.top + rect.height, ...rect });
}

/** Arma box + content + overlay, con mount/unmount contando llamadas. */
function armarEscenario({ conFoco = false, titulo = "heading" } = {}) {
  document.body.innerHTML = "";

  const box = document.createElement("div");
  const content = document.createElement("div");
  const overlay = document.createElement("div");
  content.innerHTML =
    (titulo === "heading" ? `<h2>Título</h2>` : "") + (conFoco ? `<button id="btn-foco">ok</button>` : "");
  box.append(content);
  if (conFoco) hacerloVisible(content.querySelector("#btn-foco"));
  stubRect(box, { top: 0, left: 0, width: 300, height: 200 });

  let mountCalls = 0;
  let unmountCalls = 0;
  const mount = () => {
    mountCalls++;
    document.body.append(overlay, box);
  };
  const unmount = () => {
    unmountCalls++;
    overlay.remove();
    box.remove();
  };

  return { box, content, overlay, mount, unmount, mountCalls: () => mountCalls, unmountCalls: () => unmountCalls };
}

// ── RNF-2 · Reentrada segura ────────────────────────────────────────────

test("RNF-2: open() no dispara una segunda transición si ya está abriendo/abierto", async () => {
  const esc = armarEscenario();
  const morph = createMorph(esc, { duration: 0, closeDuration: 0, mount: esc.mount, unmount: esc.unmount });

  await morph.open({ top: 10, left: 10, width: 40, height: 20 });
  assert.equal(morph.state, "open");
  assert.equal(esc.mountCalls(), 1);

  await morph.open({ top: 10, left: 10, width: 40, height: 20 });
  assert.equal(esc.mountCalls(), 1, "un segundo open() mientras está abierto no tiene que volver a montar");
});

test("RNF-2: close() no hace nada si no está abierto", async () => {
  const esc = armarEscenario();
  const morph = createMorph(esc, { duration: 0, closeDuration: 0, mount: esc.mount, unmount: esc.unmount });
  await morph.close();
  assert.equal(morph.state, "closed");
  assert.equal(esc.unmountCalls(), 0);
});

// ── Ciclo completo ───────────────────────────────────────────────────────

test("ciclo completo open→close: estados y mount/unmount", async () => {
  const esc = armarEscenario();
  const morph = createMorph(esc, { duration: 0, closeDuration: 0, mount: esc.mount, unmount: esc.unmount });

  await morph.open({ top: 10, left: 10, width: 40, height: 20 });
  assert.equal(morph.state, "open");
  assert.equal(esc.mountCalls(), 1);

  await morph.close();
  assert.equal(morph.state, "closed");
  assert.equal(esc.unmountCalls(), 1);
  assert.ok(!esc.box.isConnected, "el panel se desmonta al cerrar");
});

// ── RF-1 · Animación anclada al origen ──────────────────────────────────

test("RF-1: el panel arranca EXACTAMENTE con el rect del origen, antes de animar", async () => {
  const esc = armarEscenario();
  const geometrias = [];
  const morph = createMorph(esc, {
    duration: 0,
    mount: esc.mount,
    unmount: esc.unmount,
    onGeom: (g) => geometrias.push({ ...g }),
  });

  const origin = { top: 55, left: 77, width: 40, height: 20, radius: 4 };
  await morph.open(origin);

  // `applyGeom()` se llama con el rect del origen ANTES del único `await`
  // que separa esa línea de la tween final (design.md: "de golpe, no
  // desvanecido") — así que el primer valor grabado, cronológicamente, tiene
  // que ser el frame 0 exacto del origen, sin importar cuántos updates más
  // haya después.
  assert.ok(geometrias.length > 0, "tiene que haber escrito geometría antes de animar");
  const frame0 = geometrias[0];
  assert.equal(frame0.top, origin.top);
  assert.equal(frame0.left, origin.left);
  assert.equal(frame0.w, origin.width);
  assert.equal(frame0.h, origin.height);
  assert.equal(frame0.radius, origin.radius);
});

// ── design.md §4 · El origen se vuelve a medir al cerrar ────────────────

test("el cierre usa la posición ACTUAL del origen, no la que tenía al abrir (evita el salto)", async () => {
  const esc = armarEscenario();
  const origin = document.createElement("div");
  document.body.append(origin);
  stubRect(origin, { top: 10, left: 10, width: 40, height: 20 });

  let ultimaGeom = null;
  const morph = createMorph(esc, {
    duration: 0,
    closeDuration: 0,
    mount: esc.mount,
    unmount: esc.unmount,
    onGeom: (g) => (ultimaGeom = g),
  });

  // `placement` por defecto es "center": el reposo de OPEN centra en la
  // ventana y no depende del origen — por eso esta prueba no valida nada de
  // la geometría al abrir (RF-1 ya lo cubre). Lo que importa acá es el
  // cierre, que siempre vuelve exactamente al `rect` del origen.
  await morph.open(origin);

  // El origen "scrollea" mientras el panel está abierto.
  stubRect(origin, { top: 400, left: 250, width: 40, height: 20 });

  await morph.close();
  assert.equal(ultimaGeom.top, 400, "el cierre tiene que releer la posición ACTUAL, no la guardada al abrir");
  assert.equal(ultimaGeom.left, 250);
});

// ── A11Y ──────────────────────────────────────────────────────────────

test("A11Y-4: role=dialog, aria-modal, aria-labelledby desde el heading", async () => {
  const esc = armarEscenario({ titulo: "heading" });
  const morph = createMorph(esc, { duration: 0, mount: esc.mount, unmount: esc.unmount });
  await morph.open({ top: 0, left: 0, width: 10, height: 10 });

  assert.equal(esc.box.getAttribute("role"), "dialog");
  assert.equal(esc.box.getAttribute("aria-modal"), "true");
  const h2 = esc.content.querySelector("h2");
  assert.equal(esc.box.getAttribute("aria-labelledby"), h2.id);
});

test("A11Y-3: trapFocus enfoca el primer elemento focusable del panel", async () => {
  const esc = armarEscenario({ conFoco: true });
  const morph = createMorph(esc, { duration: 0, mount: esc.mount, unmount: esc.unmount });
  await morph.open({ top: 0, left: 0, width: 10, height: 10 });

  assert.equal(document.activeElement, esc.content.querySelector("#btn-foco"));
});

test("A11Y-2: restoreFocus devuelve el foco a quien abrió, al cerrar", async () => {
  const esc = armarEscenario({ conFoco: true });
  const disparador = document.createElement("button");
  document.body.append(disparador);
  hacerloVisible(disparador);
  disparador.focus();

  const morph = createMorph(esc, { duration: 0, closeDuration: 0, mount: esc.mount, unmount: esc.unmount });
  await morph.open({ top: 0, left: 0, width: 10, height: 10 });
  assert.notEqual(document.activeElement, disparador);

  await morph.close();
  assert.equal(document.activeElement, disparador);
});

test("A11Y-1: Escape cierra el panel", async () => {
  const esc = armarEscenario();
  const morph = createMorph(esc, { duration: 0, closeDuration: 0, mount: esc.mount, unmount: esc.unmount });
  await morph.open({ top: 0, left: 0, width: 10, height: 10 });

  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(morph.state, "closed");
});

// ── RF-5 · changeView aplica la mutación antes de animar ────────────────

test("RF-5: changeView aplica `mutate` ANTES de la animación (el DOM correcto queda montado igual)", async () => {
  const esc = armarEscenario();
  const morph = createMorph(esc, { duration: 0, mount: esc.mount, unmount: esc.unmount });
  await morph.open({ top: 0, left: 0, width: 10, height: 10 });

  let mutoAntesDeTerminar = false;
  const cambio = morph.changeView(() => {
    esc.content.innerHTML = "<p>vista nueva</p>";
    mutoAntesDeTerminar = true;
  });
  // La mutación ya se aplicó de forma síncrona dentro de `mutate`, antes de
  // que `changeView` termine — si gsap no llegara a correr, el DOM ya está bien.
  assert.ok(mutoAntesDeTerminar);
  assert.ok(esc.content.textContent.includes("vista nueva"));
  await cambio;
});

test("onState avisa 'closed' aunque el cierre lo inicie el CORE, no el consumidor", async () => {
  // De esto depende poder reabrir en Vue/React: el wrapper baja su `v-model`
  // desde `onState`. Si un cierre que arranca adentro —Escape, el gesto de
  // arrastre— no avisara, el padre se quedaría en `true` con el panel cerrado
  // y el watcher no vería cambio al volver a pedir `true`: no abría más.
  const esc = armarEscenario();
  const estados = [];
  const morph = createMorph(esc, {
    duration: 0,
    closeDuration: 0,
    closeOnEscape: true,
    mount: esc.mount,
    unmount: esc.unmount,
    onState: (s) => estados.push(s),
  });

  await morph.open({ top: 0, left: 0, width: 10, height: 10 });
  assert.equal(morph.state, "open");

  // Nadie llama a close(): lo dispara el core desde su propio listener.
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(morph.state, "closed");
  assert.ok(estados.includes("closed"), `onState nunca avisó el cierre (recibió: ${estados.join(" → ")})`);
});

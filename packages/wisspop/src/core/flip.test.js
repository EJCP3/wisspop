/** node --test src/core/flip.test.js */
import assert from "node:assert/strict";
import { test } from "node:test";
import { setupDom } from "./dom-test-setup.js";

setupDom();
const { gsap } = await import("gsap");
const { Flip } = await import("gsap/Flip");
gsap.registerPlugin(Flip);
const { createFlip } = await import("./flip.js");

/**
 * jsdom no calcula layout: todo `getBoundingClientRect` da 0x0, así que un
 * elemento "focusable" según el filtro del core (offsetWidth/offsetHeight/
 * getClientRects) nunca lo es a menos que se lo pise a mano acá.
 */
function hacerloVisible(el) {
  Object.defineProperty(el, "offsetWidth", { value: 100, configurable: true });
  Object.defineProperty(el, "offsetHeight", { value: 40, configurable: true });
}

/** Arma trigger + modal + overlay con un par de elementos `data-flip-id`. */
function armarEscenario({ conFoco = false, titulo = "heading" } = {}) {
  document.body.innerHTML = "";

  const trigger = document.createElement("div");
  trigger.setAttribute("data-flip-id", "demo-card");
  trigger.innerHTML = `<span data-flip-id="demo-title">t</span>`;
  document.body.append(trigger);

  const overlay = document.createElement("div");
  const modal = document.createElement("div");
  const tituloHtml =
    titulo === "heading"
      ? `<h2 data-flip-id="demo-title">Título</h2>`
      : titulo === "wisspop-title"
        ? `<span data-flip-id="demo-title" data-wisspop-title>Título</span>`
        : "";
  modal.innerHTML = `<div data-flip-id="demo-card">${tituloHtml}${
    conFoco ? `<button id="btn-foco">ok</button>` : ""
  }</div>`;
  if (conFoco) hacerloVisible(modal.querySelector("#btn-foco"));

  let mountCalls = 0;
  let unmountCalls = 0;
  const mount = () => {
    mountCalls++;
    document.body.append(overlay, modal);
  };
  const unmount = () => {
    unmountCalls++;
    overlay.remove();
    modal.remove();
  };

  return {
    trigger,
    overlay,
    modal,
    mount,
    unmount,
    mountCalls: () => mountCalls,
    unmountCalls: () => unmountCalls,
  };
}

/** Fuerza a completarse cualquier timeline de Flip en curso — mismo truco que
 * se usó para verificar a mano las animaciones de FlipModal en el navegador:
 * GSAP deja la timeline en `el._flip`, y `.progress(1)` la corre entera sin
 * necesitar tiempo real ni requestAnimationFrame. */
function completarFlips() {
  const nodos = [...document.querySelectorAll("[data-flip-id]")];
  const tls = new Set(nodos.map((n) => n._flip).filter(Boolean));
  tls.forEach((tl) => tl.progress(1));
  return tls.size;
}

// ── RNF-2 · Reentrada segura ────────────────────────────────────────────

test("RNF-2: open() no dispara una segunda transición si ya está abriendo/abierto", async () => {
  const esc = armarEscenario();
  const flip = createFlip(esc, { flipId: "demo", duration: 0, mount: esc.mount, unmount: esc.unmount });

  await flip.open();
  assert.equal(flip.state, "open");
  assert.equal(esc.mountCalls(), 1);

  await flip.open(); // ya está abierto: no debe volver a montar
  assert.equal(esc.mountCalls(), 1);
});

test("RNF-2: close() no hace nada si no está abierto", async () => {
  const esc = armarEscenario();
  const flip = createFlip(esc, { flipId: "demo", duration: 0, mount: esc.mount, unmount: esc.unmount });

  await flip.close(); // nunca se abrió
  assert.equal(flip.state, "closed");
  assert.equal(esc.unmountCalls(), 0);
});

// ── Ciclo completo con duration:0 (equivalente a reduced-motion) ────────

test("ciclo completo open→close: estados, mount/unmount y visibilidad del trigger", async () => {
  const esc = armarEscenario();
  const flip = createFlip(esc, { flipId: "demo", duration: 0, mount: esc.mount, unmount: esc.unmount });

  await flip.open();
  assert.equal(flip.state, "open");
  assert.equal(esc.trigger.style.visibility, "hidden", "el trigger tiene que ocultarse, no desmontarse");
  assert.ok(esc.trigger.isConnected, "el trigger NO se saca del DOM — si no, la página salta (bug de esta sesión)");

  await flip.close();
  assert.equal(flip.state, "closed");
  assert.equal(esc.trigger.style.visibility, "", "el trigger vuelve a ser visible");
  assert.equal(esc.unmountCalls(), 1);
  assert.ok(!esc.modal.isConnected, "el modal se desmonta al cerrar");
});

// ── A11Y ──────────────────────────────────────────────────────────────

test("A11Y-4: role=dialog, aria-modal, aria-labelledby desde el heading", async () => {
  const esc = armarEscenario({ titulo: "heading" });
  const flip = createFlip(esc, { flipId: "demo", duration: 0, mount: esc.mount, unmount: esc.unmount });
  await flip.open();

  assert.equal(esc.modal.getAttribute("role"), "dialog");
  assert.equal(esc.modal.getAttribute("aria-modal"), "true");
  const h2 = esc.modal.querySelector("h2");
  assert.equal(esc.modal.getAttribute("aria-labelledby"), h2.id);
});

test("A11Y-4: aria-labelledby prioriza [data-wisspop-title] sobre un heading", async () => {
  const esc = armarEscenario({ titulo: "wisspop-title" });
  const flip = createFlip(esc, { flipId: "demo", duration: 0, mount: esc.mount, unmount: esc.unmount });
  await flip.open();

  const titleEl = esc.modal.querySelector("[data-wisspop-title]");
  assert.equal(esc.modal.getAttribute("aria-labelledby"), titleEl.id);
});

test("A11Y-4: ariaLabel explícito gana y no toca aria-labelledby", async () => {
  const esc = armarEscenario({ titulo: "heading" });
  const flip = createFlip(esc, {
    flipId: "demo",
    duration: 0,
    mount: esc.mount,
    unmount: esc.unmount,
    ariaLabel: "Detalle",
  });
  await flip.open();

  assert.equal(esc.modal.getAttribute("aria-label"), "Detalle");
  assert.equal(esc.modal.hasAttribute("aria-labelledby"), false);
});

test("A11Y-3: trapFocus enfoca el primer elemento focusable del modal", async () => {
  const esc = armarEscenario({ conFoco: true });
  const flip = createFlip(esc, { flipId: "demo", duration: 0, mount: esc.mount, unmount: esc.unmount });
  await flip.open();

  assert.equal(document.activeElement, esc.modal.querySelector("#btn-foco"));
});

test("A11Y-2: restoreFocus devuelve el foco al elemento que abrió, al cerrar", async () => {
  const esc = armarEscenario({ conFoco: true });
  const disparador = document.createElement("button");
  document.body.append(disparador);
  hacerloVisible(disparador);
  disparador.focus();
  assert.equal(document.activeElement, disparador);

  const flip = createFlip(esc, { flipId: "demo", duration: 0, mount: esc.mount, unmount: esc.unmount });
  await flip.open();
  assert.notEqual(document.activeElement, disparador, "el foco se movió adentro del modal");

  await flip.close();
  assert.equal(document.activeElement, disparador, "A11Y-2: el foco vuelve a quien abrió");
});

test("A11Y-1: Escape cierra el panel cuando closeOnEscape está activo", async () => {
  const esc = armarEscenario();
  const flip = createFlip(esc, { flipId: "demo", duration: 0, mount: esc.mount, unmount: esc.unmount });
  await flip.open();
  assert.equal(flip.state, "open");

  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(flip.state, "closed");
});

test("closeOnEscape:false no cierra con Escape", async () => {
  const esc = armarEscenario();
  const flip = createFlip(esc, {
    flipId: "demo",
    duration: 0,
    closeOnEscape: false,
    trapFocus: false,
    mount: esc.mount,
    unmount: esc.unmount,
  });
  await flip.open();

  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(flip.state, "open");
});

// ── RNF-1 · Sin fugas de estilo (regresión: clearProps de Flip.to) ──────

test("RNF-1: cerrar con Flip.to no deja estilos inline pegados en los nodos del modal", async () => {
  const esc = armarEscenario();
  const cardTrigger = esc.trigger;
  const cardModal = () => esc.modal.querySelector('[data-flip-id="demo-card"]');

  // Sin layout real, todos los rects son 0x0 y Flip no tiene ninguna
  // diferencia real que animar ni que limpiar — el bug pasaría inadvertido.
  // Los dos rects se pisan ANTES de abrir (Flip.from/Flip.to capturan la
  // geometría de forma síncrona, en el momento en que se llaman adentro de
  // open()/close(); pisar el rect después ya no llega a tiempo).
  cardTrigger.getBoundingClientRect = () => ({ top: 100, left: 50, width: 80, height: 60, right: 130, bottom: 160 });
  cardModal().getBoundingClientRect = () => ({ top: 0, left: 0, width: 300, height: 400, right: 300, bottom: 400 });

  // Línea de base: cómo está el nodo ANTES de que cualquier Flip lo toque.
  // `null` (sin atributo `style`) y `""` (`style=""`) son equivalentes — un
  // `removeProperty()` sin nada que sacar igual deja el atributo creado y
  // vacío, no hace desaparecer el atributo en sí.
  const estiloOriginal = cardModal().getAttribute("style") || "";

  const flip = createFlip(esc, { flipId: "demo", duration: 0.3, mount: esc.mount, unmount: esc.unmount });

  await flip.open();
  const nTls = completarFlips();
  assert.ok(nTls > 0, "la apertura tiene que haber arrancado un Flip");
  assert.equal(flip.state, "open");
  assert.equal(
    cardModal().getAttribute("style"),
    estiloOriginal,
    "tampoco al ABRIR debe quedar remanente — Flip.from tiene el mismo gap",
  );

  await flip.close();
  completarFlips();
  assert.equal(flip.state, "closed");

  // `clearProps` (default en Flip.from, explícito en Flip.to) no revierte
  // `padding`/`border-*-radius` cuando se combinan `absolute:` + `props:
  // "borderRadius"` — GSAP los escribe por un canal aparte (bookkeeping de
  // "hacerlo absoluto" + expansión de las 4 esquinas), fuera de la cadena de
  // props que el propio `clearProps` recorre, así que quedan pegados en
  // `0px` pase lo que pase. `limpiarResiduoDeFlip()` los barre a mano justo
  // después de cada `onComplete`, tanto al abrir como al cerrar.
  assert.equal(
    cardModal().getAttribute("style"),
    estiloOriginal,
    "no debe quedar NINGÚN remanente inline — ni siquiera el gap conocido de GSAP, ya limpiado a mano",
  );
});

test("RNF-1: el padding/border-radius que puso el CONSUMIDOR sobrevive al flip (no un removeProperty a ciegas)", async () => {
  // Regresión real: la primera versión de la limpieza de residuo hacía
  // `el.style.removeProperty('padding')` sin condición — que sí saca el
  // remanente de GSAP, pero de paso se lleva puesto el `padding: 1.5rem`
  // que el consumidor había puesto a mano en su propio contenido (el
  // FlipModal de ejemplo en docs, exactamente este caso). Apareció recién
  // al mirar la demo real: el jsdom no tenía ningún elemento con padding
  // propio para exponerlo.
  const esc = armarEscenario();
  const cardModal = () => esc.modal.querySelector('[data-flip-id="demo-card"]');
  cardModal().style.padding = "24px";
  cardModal().style.borderRadius = "16px";

  esc.trigger.getBoundingClientRect = () => ({ top: 100, left: 50, width: 80, height: 60, right: 130, bottom: 160 });
  cardModal().getBoundingClientRect = () => ({ top: 0, left: 0, width: 300, height: 400, right: 300, bottom: 400 });

  const flip = createFlip(esc, { flipId: "demo", duration: 0.3, mount: esc.mount, unmount: esc.unmount });

  await flip.open();
  completarFlips();
  assert.equal(cardModal().style.padding, "24px", "el padding del consumidor sigue ahí después de ABRIR");
  assert.equal(cardModal().style.borderRadius, "16px", "el border-radius del consumidor sigue ahí después de ABRIR");

  await flip.close();
  completarFlips();
  assert.equal(cardModal().style.padding, "24px", "el padding del consumidor sigue ahí después de CERRAR");
  assert.equal(cardModal().style.borderRadius, "16px", "el border-radius del consumidor sigue ahí después de CERRAR");
});

test("al CERRAR la caja conserva su tamaño durante el vuelo (la × no se despega de la tarjeta)", async () => {
  // `absolute:` saca la tarjeta del flujo, así que la caja que la contiene
  // colapsa a su tamaño natural durante todo el viaje. Lo que no es target del
  // flip —la × de `closeButton`, anclada a la esquina de la caja, y el
  // contenido propio del consumidor— se iba con ella y quedaba flotando lejos
  // de la tarjeta. `open()` congelaba el tamaño por esto mismo; `close()` se lo
  // había perdido, así que el defecto solo se veía al cerrar.
  const esc = armarEscenario();
  esc.trigger.getBoundingClientRect = () => ({ top: 100, left: 50, width: 80, height: 60, right: 130, bottom: 160 });
  esc.modal.getBoundingClientRect = () => ({ top: 0, left: 0, width: 300, height: 400, right: 300, bottom: 400 });

  const flip = createFlip(esc, { flipId: "demo", duration: 0.3, mount: esc.mount, unmount: esc.unmount });

  await flip.open();
  completarFlips();

  await flip.close(); // vuelve antes de que termine el vuelo: acá es donde importa
  assert.equal(esc.modal.style.minWidth, "300px", "la caja mantiene su ancho mientras la tarjeta viaja de vuelta");
  assert.equal(esc.modal.style.minHeight, "400px", "y su alto");

  completarFlips();
  assert.equal(esc.modal.style.minWidth, "", "y lo suelta al terminar, sin dejar residuo para la próxima apertura");
  assert.equal(esc.modal.style.minHeight, "");
});

// ── swipeToClose ────────────────────────────────────────────────────────

/** Un pointerdown → move → up sobre `el`, en px. jsdom no trae PointerEvent. */
function arrastrar(el, dx, dy) {
  const ev = (tipo, x, y) => {
    const e = new window.Event(tipo, { bubbles: true });
    // Sin `target`: es de solo lectura y `dispatchEvent` ya lo apunta a `el`.
    Object.assign(e, { clientX: x, clientY: y, pointerId: 1 });
    return e;
  };
  el.dispatchEvent(ev("pointerdown", 0, 0));
  el.dispatchEvent(ev("pointermove", dx, dy));
  el.dispatchEvent(ev("pointerup", dx, dy));
}

test("swipeToClose: un arrastre pasado el umbral cierra el flip", async () => {
  const esc = armarEscenario();
  const flip = createFlip(esc, {
    flipId: "demo",
    duration: 0,
    swipeToClose: true,
    swipeThreshold: 90,
    mount: esc.mount,
    unmount: esc.unmount,
  });

  await flip.open();
  assert.equal(flip.state, "open");
  assert.ok(esc.modal.classList.contains("wisspop-swipe"), "la caja queda marcada como arrastrable");

  arrastrar(esc.modal, 150, 0); // > 90
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(flip.state, "closed", "pasado el umbral, cierra");
});

test("swipeToClose: por debajo del umbral NO cierra", async () => {
  const esc = armarEscenario();
  const flip = createFlip(esc, {
    flipId: "demo",
    duration: 0,
    swipeToClose: true,
    swipeThreshold: 90,
    mount: esc.mount,
    unmount: esc.unmount,
  });

  await flip.open();
  arrastrar(esc.modal, 20, 0); // < 90 y sin velocidad de fling
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(flip.state, "open", "un arrastre corto devuelve el panel a su lugar");
});

test("swipeToClose: apagado (default) no engancha el gesto", async () => {
  const esc = armarEscenario();
  const flip = createFlip(esc, { flipId: "demo", duration: 0, mount: esc.mount, unmount: esc.unmount });

  await flip.open();
  assert.ok(!esc.modal.classList.contains("wisspop-swipe"));
  arrastrar(esc.modal, 300, 0);
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(flip.state, "open", "sin la opción, arrastrar no hace nada");
});

test("swipeToClose: la próxima apertura NO arranca en el punto donde se soltó", async () => {
  // Vanilla arma la caja una sola vez y la reusa, así que el desplazamiento
  // del arrastre sobrevivía al cierre y el modal volvía a abrirse corrido —
  // un poco más lejos con cada gesto. Vue/React lo tapaban porque recrean el
  // DOM en cada apertura.
  //
  // Con `duration: 0` el cierre ni siquiera llega a `Flip.to`, así que su
  // `clearProps` no puede ser lo que lo limpie: tiene que limpiarlo la apertura.
  const esc = armarEscenario();
  const card = () => esc.modal.querySelector('[data-flip-id="demo-card"]');
  const flip = createFlip(esc, {
    flipId: "demo",
    duration: 0,
    swipeToClose: true,
    swipeThreshold: 90,
    mount: esc.mount,
    unmount: esc.unmount,
  });

  await flip.open();
  arrastrar(esc.modal, 150, 40);
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(flip.state, "closed");

  await flip.open();
  assert.equal(gsap.getProperty(card(), "x"), 0, "la tarjeta vuelve a abrir sin el desplazamiento del gesto");
  assert.equal(gsap.getProperty(card(), "y"), 0);
});

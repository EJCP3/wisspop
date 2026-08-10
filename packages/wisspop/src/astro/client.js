/**
 * Runtime de los componentes .astro.
 *
 * Astro no tiene runtime propio: el componente solo emite un `<template>` con
 * el contenido del slot y las opciones serializadas. Esto lo levanta y se lo
 * pasa al mismo adaptador vanilla que usa cualquier consumidor sin framework —
 * el `<template>` es solo el transporte del markup del servidor al cliente.
 */
import { createModal, createFlipModal } from "../vanilla/index.js";

/**
 * Qué viaja desde el botón. Un nodo explícito gana; si no, el único hijo del
 * botón (icono, imagen, span con icono+texto); si no, su texto.
 */
const carga = (btn) =>
  btn.querySelector("[data-wisspop-label]") ??
  (btn.children.length === 1 ? btn.firstElementChild : btn.textContent.trim());

function montar(kind) {
  document.querySelectorAll(`template[data-wisspop="${kind}"]`).forEach((tpl) => {
    if (tpl._wisspop) return;

    const { trigger: sel, ...opts } = JSON.parse(tpl.dataset.opts);
    const botones = [...document.querySelectorAll(sel)];

    if (kind === "flip" && !botones[0]) {
      return console.warn("[wisspop] sin trigger para el flip:", sel);
    }

    // `tpl.content` es un DocumentFragment: el adaptador lo appendea y con eso
    // los nodos pasan del template al panel, sin clonar ni serializar.
    const modal =
      kind === "flip"
        ? createFlipModal({ ...opts, trigger: botones[0], content: tpl.content })
        : createModal({ ...opts, content: tpl.content });

    tpl._wisspop = modal;

    // Delegado: el consumidor puede reemplazar el contenido (changeView,
    // resync) sin volver a cablear nada.
    const raiz = kind === "flip" ? modal.box : modal.content;
    raiz.addEventListener("click", (e) => {
      if (e.target.closest("[data-wisspop-close]")) modal.close();
    });

    // Sin `flyingTextClass` no hay elemento viajero, y pasarle un label al core
    // lo dejaría escondiendo el `[data-wisspop-title]` sin nada que lo supla.
    const conVuelo = opts.flyingTextClass != null;
    for (const btn of botones) {
      btn.addEventListener("click", () =>
        kind === "flip" ? modal.open() : modal.open(btn, conVuelo ? carga(btn) : undefined),
      );
    }
  });
}

/** Idempotente: `astro:page-load` la vuelve a disparar con ViewTransitions. */
export function initWissPop(kind) {
  montar(kind);
  document.addEventListener("astro:page-load", () => montar(kind));
}

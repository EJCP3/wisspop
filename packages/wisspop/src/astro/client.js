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
  (btn.children.length === 1 ? btn.firstElementChild : btn.textContent?.trim());

/**
 * Monta una instancia de modal para un template específico si no está montado aún.
 * @param {HTMLTemplateElement} tpl
 * @returns {any}
 */
export function montarTemplate(tpl) {
  if (tpl._wisspop) return tpl._wisspop;

  const kind = tpl.dataset.wisspop || "morph";
  const { trigger: sel, ...opts } = JSON.parse(tpl.dataset.opts || "{}");
  const botones = sel ? [...document.querySelectorAll(sel)] : [];

  if (kind === "flip" && !botones[0]) {
    console.warn("[wisspop] sin trigger para el flip:", sel);
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
  if (raiz) {
    raiz.addEventListener("click", (e) => {
      if (e.target.closest("[data-wisspop-close]")) modal.close();
    });
  }

  // Sin `flyingTextClass` no hay elemento viajero, y pasarle un label al core
  // lo dejaría escondiendo el `[data-wisspop-title]` sin nada que lo supla.
  const conVuelo = opts.flyingTextClass != null;
  for (const btn of botones) {
    btn.addEventListener("click", () =>
      kind === "flip" ? modal.open() : modal.open(btn, conVuelo ? carga(btn) : undefined),
    );
  }

  return modal;
}

function montar(kind) {
  const selector = kind ? `template[data-wisspop="${kind}"]` : `template[data-wisspop]`;
  document.querySelectorAll(selector).forEach((tpl) => {
    montarTemplate(tpl);
  });
}

let delegadoInstalado = false;

function asegurarDelegacionGlobal() {
  if (delegadoInstalado || typeof document === "undefined") return;
  delegadoInstalado = true;

  // Delegación de eventos para disparadores dinámicos o dentro de submodales
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!target || typeof target.closest !== "function") return;

    // 1. Botón de cierre delegado
    const closeBtn = target.closest("[data-wisspop-close]");
    if (closeBtn) {
      // Si el botón está dentro de un wisspop-box abierto, el listener del contenedor ya lo maneja,
      // pero esto sirve como fallback para estructuras personalizadas.
      return;
    }

    // 2. Disparador con data-wisspop-trigger="id"
    const triggerBtn = target.closest("[data-wisspop-trigger]");
    if (!triggerBtn) return;

    const modalId = triggerBtn.getAttribute("data-wisspop-trigger");
    if (!modalId) return;

    const tpl = document.querySelector(`template[data-id="${modalId}"]`);
    if (!tpl) return;

    const modal = montarTemplate(tpl);
    if (!modal) return;

    const opts = JSON.parse(tpl.dataset.opts || "{}");
    const kind = tpl.dataset.wisspop || "morph";
    const conVuelo = opts.flyingTextClass != null;

    // Solo abrir si no fue manejado por el listener directo ya asociado
    if (kind === "flip") {
      modal.open();
    } else {
      modal.open(triggerBtn, conVuelo ? carga(triggerBtn) : undefined);
    }
  });
}

/** Idempotente: `astro:page-load` y `astro:after-swap` la vuelven a disparar con ViewTransitions. */
export function initWissPop(kind) {
  asegurarDelegacionGlobal();
  montar(kind);

  if (typeof document !== "undefined") {
    document.addEventListener("astro:page-load", () => montar(kind), { once: false });
    document.addEventListener("astro:after-swap", () => montar(kind), { once: false });
  }
}


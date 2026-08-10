/**
 * Adaptador vanilla: arma el DOM que el core espera y lo monta/desmonta.
 *
 * El core recibe elementos ya montados — cuando hay un framework, eso lo hace
 * el framework. Sin framework, lo hace esto. Es la única diferencia.
 */
import { createMorph } from "../core/morph.js";
import { createFlip } from "../core/flip.js";
export { enterDropdownAnimation, leaveDropdownAnimation } from "../core/dropdown.js";
export { createFlip };
// Ritmo global: fija los defaults para toda la app de una vez. Ver core/index.js.
export { setDefaults } from "../core/index.js";
import "../styles/wisspop.css";

const el = (className) => {
  const node = document.createElement("div");
  node.className = className;
  return node;
};

// × en trazo, para heredar color con `currentColor` igual que los demás iconos.
const CLOSE_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';

/**
 * @param {object} opts Todo lo de `createMorph`, más:
 * @param {string|Node} [opts.content] HTML o nodo a poner adentro del panel
 * @param {string} [opts.modalClass]
 * @param {string} [opts.overlayClass]
 * @param {string} [opts.flyingTextClass] Si está, se crea el texto viajero
 * @param {boolean} [opts.closeOnOverlayClick=true]
 * @param {boolean} [opts.closeButton=false] Botón × propio, para cuando el
 *   consumidor no quiere armar el suyo. Flota sobre el contenido, no ocupa
 *   espacio en el layout.
 * @param {string} [opts.closeButtonClass]
 * @param {boolean} [opts.closeOnEscape=true] Cerrar al presionar la tecla Escape
 * @param {boolean} [opts.trapFocus=true] Atrapado de foco dentro del modal
 * @param {boolean} [opts.restoreFocus=true] Devolver foco al origen al cerrar
 * @param {boolean} [opts.lockScroll=false] Bloquear scroll del body mientras está abierto (desactivado por defecto)
 * @param {string} [opts.ariaLabel]
 * @param {string} [opts.ariaLabelledby]
 */
export function createModal(opts = {}) {
  const {
    content,
    modalClass = "",
    overlayClass = "",
    flyingTextClass,
    closeOnOverlayClick = true,
    closeButton = false,
    closeButtonClass = "",
    ...coreOpts
  } = opts;

  const overlay = el(`wisspop-overlay ${overlayClass}`);
  const box = el(`wisspop-box ${modalClass}`);
  const inner = el("wisspop-content");
  box.append(inner);

  if (typeof content === "string") inner.innerHTML = content;
  else if (content) inner.append(content);

  const flying = flyingTextClass != null ? el(`wisspop-flying-text ${flyingTextClass}`) : null;

  const core = createMorph(
    { box, content: inner, overlay, flyingText: flying },
    {
      ...coreOpts,
      mount: () => document.body.append(overlay, ...(flying ? [flying] : []), box),
      unmount: () => [overlay, box, flying].forEach((n) => n?.remove()),
    },
  );

  if (closeOnOverlayClick) overlay.addEventListener("click", () => core.close());

  if (closeButton) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `wisspop-close ${closeButtonClass}`.trim();
    btn.setAttribute("aria-label", "Cerrar");
    btn.innerHTML = CLOSE_ICON;
    btn.addEventListener("click", () => core.close());
    box.append(btn);
  }

  return Object.assign(core, { box, content: inner, overlay, flyingText: flying });
}

/**
 * Adaptador Vanilla para FlipModal
 * @param {object} opts Opciones para createFlip, más `trigger` y `content`
 */
export function createFlipModal(opts = {}) {
  const {
    trigger,
    content,
    modalClass = "",
    overlayClass = "",
    closeOnOverlayClick = true,
    closeButton = false,
    closeButtonClass = "",
    ...coreOpts
  } = opts;

  const overlay = el(`wisspop-overlay ${overlayClass}`);
  // Wrapper de centrado (cubre toda la pantalla, solo centra)
  const wrapper = el("wisspop-flip-box");
  // Box real del modal (tamaño del contenido)
  const box = el(`wisspop-box ${modalClass}`);
  wrapper.append(box);

  if (typeof content === "string") box.innerHTML = content;
  else if (content) box.append(content);

  const core = createFlip(
    { trigger, modal: box, overlay },
    {
      ...coreOpts,
      mount: () => document.body.append(overlay, wrapper),
      unmount: () => [overlay, wrapper].forEach((n) => n?.remove()),
    },
  );

  if (closeOnOverlayClick) {
    overlay.addEventListener("click", () => core.close());
    wrapper.addEventListener("click", (e) => {
      if (e.target === wrapper) core.close();
    });
  }

  if (closeButton) {
    const btn = document.createElement("button");
    btn.type = "button";
    // Sin clase de fade: el core la reconoce por `.wisspop-close` y le da su
    // propio ritmo (entra al final del vuelo, creciendo desde su centro).
    // Antes se sumaba al grupo genérico, que desplaza en Y — un movimiento que
    // en la × se lee como que entra desde fuera del panel.
    btn.className = ["wisspop-close", closeButtonClass].filter(Boolean).join(" ");
    btn.setAttribute("aria-label", "Cerrar");
    btn.innerHTML = CLOSE_ICON;
    btn.addEventListener("click", () => core.close());
    box.append(btn);
  }

  return Object.assign(core, { box, wrapper, overlay });
}


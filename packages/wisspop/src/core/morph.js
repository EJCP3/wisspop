/**
 * WissPop core — animación anclada al origen. Sin framework.
 *
 * Recibe elementos del DOM ya montados (o getters que los devuelvan) y expone
 * { open, close, changeView, resync, destroy }. No sabe de Vue ni de React: lo
 * único que le delega al wrapper es montar/desmontar el DOM (`mount`/`unmount`)
 * y, opcionalmente, escribir la geometría (`onGeom`).
 *
 * Las decisiones no obvias están explicadas en design.md; donde una línea existe
 * por un bug concreto, la referencia está al lado.
 */
import { gsap } from "gsap";
import { activarGesto as gestoDeArrastre } from "./gesto.js";
import { placeBox, clamp, coversOrigin, followsOrigin } from "./place.js";

export { placeBox };

/** @typedef {import("./place.js").Rect} Rect */
/** @typedef {import("./place.js").Geom} Geom */

const DEFAULTS = {
  /** @type {"top"|"bottom"|"center"|"drawer-left"} */
  placement: "center",
  /** @type {"left"|"center"|"right"} */
  align: "center",
  /** px entre el origen y el panel (solo placement top/bottom) */
  gap: 16,
  /** px mínimos entre el panel y el borde de la ventana (RF-6) */
  margin: 16,
  /** ancho final en px. null = lo decide el CSS del panel */
  width: null,
  /** radio final en px. null = lo decide el CSS del panel */
  radius: null,
  duration: 0.55,
  closeDuration: 0.7,
  ease: "back.out(1.1)",
  closeEase: "power3.inOut",
  /** el contenido entra con blur(4px)→0 además de opacity/y (false por defecto para fluidez móvil) */
  contentBlur: false,
  /** @type {"slide-up"|"slide-down"|"scale"|"fade"|"none"} animación CSS nativa del contenido */
  contentAnimation: "slide-up",
  /** si true, añade efecto de cascada escalonada nativa a los hijos directos del contenido */
  contentStagger: false,
  /** debajo de este ancho el panel ocupa toda la pantalla (RF-7) */
  mobileBreakpoint: 640,
  fullscreenOnMobile: false,
  /**
   * Cuánto se mete el elemento viajero desde el borde izquierdo del origen.
   * Solo se usa cuando el contenido viajero es texto suelto: si le pasás un
   * nodo que vive dentro del botón, su posición se mide y este número sobra.
   */
  labelOffsetX: 24,
  /**
   * Cómo se escala el elemento viajero.
   * - `"text"` — anima `font-size`. Lo único que mantiene el texto nítido en
   *   cada frame; un icono medido en `em` viaja junto con él.
   * - `"box"` — anima `width`/`height`. Para imágenes y SVG, que no escalan con
   *   el tamaño de fuente.
   * - `null` (default) — automático: `box` si el contenido no tiene texto.
   * @type {"text" | "box" | null}
   */
  flyingMode: null,
  /** radio del origen cuando `open` recibe un Rect literal sin `radius` */
  originRadius: 0,
  /**
   * Desvanecer el elemento origen mientras el panel está abierto. Por defecto
   * solo cuando el panel termina cubriéndolo (ver `coversOrigin`): si el botón
   * sigue visible al lado de su propio panel, se ven los dos a la vez y la
   * transición deja de leerse como que uno se convirtió en el otro.
   * @type {boolean | null}
   */
  hideOrigin: null,
  /**
   * Cerrar arrastrando el panel con el mouse o el dedo, como una notificación
   * de celular. Descartado así el panel no vuelve al origen: se va para donde
   * lo tiraron, porque el gesto ya dice a dónde va.
   */
  swipeToClose: false,
  /** px de arrastre para que el gesto cuente como descarte. */
  swipeThreshold: 90,

  /** Cerrar al presionar la tecla Escape (A11Y-1) */
  closeOnEscape: true,
  /** Atrapar la navegación por teclado (Tab) dentro del modal (A11Y-3) */
  trapFocus: true,
  /** Devolver el foco al elemento que abrió el panel al cerrar (A11Y-2) */
  restoreFocus: true,
  /** Bloquear el scroll en document.body mientras está abierto (opcional, default false) */
  lockScroll: false,
  /** Valor de aria-label para el modal (A11Y-4) */
  ariaLabel: null,
  /** ID del elemento para aria-labelledby (A11Y-4) */
  ariaLabelledby: null,

  /** @type {null | (() => void | Promise<void>)} montar el DOM antes de medir */
  mount: null,
  /** @type {null | (() => void)} desmontar al terminar el cierre */
  unmount: null,
  /**
   * @type {null | ((g: Geom) => void)}
   * Dónde volcar la geometría en cada frame. Por defecto se escribe en
   * `box.style`. En Vue/React hay que pasar un writer que actualice el estado
   * reactivo: si GSAP escribe el style directo, un re-render del framework lo
   * pisa a mitad de animación (design.md §2).
   */
  onGeom: null,
  /** @type {null | ((state: "closed"|"opening"|"open"|"closing") => void)} */
  onState: null,
};

/**
 * Cambia los defaults de todos los paneles que se creen a partir de acá.
 * Pensado para fijar el ritmo de la app en un solo lugar —`duration`,
 * `closeDuration`, `ease`, `closeEase`— sin repetirlo en cada componente.
 *
 * No toca los que ya existen: el core copia sus opciones al crearse.
 * Solo acepta claves que el core conoce; una mal escrita se ignora en vez de
 * quedarse ahí sin efecto y sin aviso.
 */
export function setDefaults(overrides) {
  for (const clave of Object.keys(overrides)) {
    if (clave in DEFAULTS) DEFAULTS[clave] = overrides[clave];
  }
}

const resolve = (x) => (typeof x === "function" ? x() : x);

const reducedMotion = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

let activeScrollLocks = 0;
let originalOverflow = "";
let originalPaddingRight = "";

function acquireScrollLock() {
  if (typeof document === "undefined") return;
  if (activeScrollLocks === 0) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    originalOverflow = document.body.style.overflow;
    originalPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      const currentPadding = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }
  }
  activeScrollLocks++;
}

function releaseScrollLock() {
  if (typeof document === "undefined" || activeScrollLocks === 0) return;
  activeScrollLocks--;
  if (activeScrollLocks === 0) {
    document.body.style.overflow = originalOverflow;
    document.body.style.paddingRight = originalPaddingRight;
  }
}

/**
 * Métricas que el elemento volador tiene que igualar en cada punta del viaje.
 *
 * `lineHeight` importa tanto como el `font-size`: el volador se posiciona por la
 * esquina de su caja, así que si su alto de línea no coincide con el del
 * destino, el glifo cae en otro lado dentro de esa caja y el aterrizaje queda
 * corrido aunque las coordenadas sean exactas. Un `line-height: normal` no es
 * un número — se resuelve al 1.2 que usan los navegadores.
 */
function textMetrics(cs, fallbackSize) {
  const fontSize = cs ? parseFloat(cs.fontSize) || fallbackSize : fallbackSize;
  return {
    fontSize,
    lineHeight: (cs && parseFloat(cs.lineHeight)) || fontSize * 1.2,
    fontWeight: (cs && parseFloat(cs.fontWeight)) || 400,
    ...visualMetrics(cs),
  };
}

/**
 * Lo que hace que la copia se vea como el original en el frame 0.
 *
 * Al clonar un nodo se pierde todo lo que le llegaba por selectores con
 * ancestro (`.boton .icono`, `.card img`): la copia vive dentro del elemento
 * viajero, no dentro del botón. Si no se reponen, en el instante del relevo la
 * copia aparece con otro color u otro redondeo y se ve un parpadeo justo donde
 * la transición tiene que ser invisible.
 */
function visualMetrics(cs) {
  if (!cs) return { color: null, radius: 0, letterSpacing: null, fontFamily: null, fontStyle: null };
  return {
    color: cs.color,
    radius: parseFloat(cs.borderTopLeftRadius) || 0,
    letterSpacing: cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing,
    fontFamily: cs.fontFamily,
    fontStyle: cs.fontStyle,
  };
}

/**
 * Carga el contenido del elemento viajero y decide cómo se escala.
 *
 * `payload` puede ser un string (texto suelto) o un nodo, que se clona: así el
 * original se queda en el botón y la copia es la que viaja. Si ese nodo está
 * montado, su rect **es** el punto de partida exacto y no hace falta adivinarlo
 * con `labelOffsetX`.
 *
 * @returns {{ from: DOMRect | null, mode: "text" | "box" }}
 */
function prepareFlying(flying, payload, override, originCs) {
  flying.replaceChildren();
  let from = null;
  let style = visualMetrics(originCs);

  if (payload instanceof Node) {
    const clon = payload.cloneNode(true);
    if (payload.isConnected && payload.getBoundingClientRect) {
      from = payload.getBoundingClientRect();
      const cs = getComputedStyle(payload);
      // Los estilos del nodo real, no los del botón que lo contiene: es esa
      // copia la que tiene que verse idéntica al despegar.
      style = visualMetrics(cs);
      // Estas viven en el nodo mismo, no se heredan del contenedor. Sin
      // reponerlas, una miniatura recortada con `cover` despega estirada con el
      // `fill` por defecto: se ve como si la imagen cambiara de zoom de golpe.
      for (const prop of ["objectFit", "objectPosition"]) {
        clon.style[prop] = cs[prop];
      }
    }
    // Si el clon es un elemento de botón/origen, limpiar fondos, bordes y padding para
    // que no se dupliquen sobre la caja que ya anima con el fondo del origen.
    if (clon instanceof HTMLElement) {
      clon.style.background = "transparent";
      clon.style.backgroundColor = "transparent";
      clon.style.backgroundImage = "none";
      clon.style.border = "none";
      clon.style.boxShadow = "none";
      clon.style.outline = "none";
      clon.style.padding = "0";
    }
    flying.append(clon);
  } else {
    flying.textContent = String(payload);
  }

  // Tipografía que no se anima: se repone una vez y queda. Si no, la copia
  // hereda la del `body` y el texto cambia de forma en el relevo.
  gsap.set(flying, {
    ...(style.fontFamily ? { fontFamily: style.fontFamily } : {}),
    ...(style.fontStyle ? { fontStyle: style.fontStyle } : {}),
    ...(style.letterSpacing ? { letterSpacing: style.letterSpacing } : {}),
  });

  // Sin texto que escalar (una imagen, un SVG) el tamaño tiene que ir por
  // width/height: `font-size` no mueve un `<img>`. Con texto va por font-size,
  // que es lo único que lo mantiene nítido en cada frame (design.md §6).
  const mode = override ?? (flying.textContent.trim() ? "text" : "box");
  flying.classList.toggle("wisspop-flying-box", mode === "box");
  return { from, mode, style };
}

/**
 * Normaliza el origen: elemento, selector o Rect literal → rect + radio + font-size.
 * El radio se acota a la mitad de la dimensión menor porque es lo máximo que
 * una caja puede mostrar; un `border-radius: 999px` sin acotar arranca la
 * animación con una forma que el botón real no tiene.
 * @returns {{ rect: Rect, radius: number, fontSize: number } | null}
 */
function readOrigin(origin, originRadius) {
  const el = typeof origin === "string" ? document.querySelector(origin) : origin;
  if (!el) return null;

  // `textMetrics()` trae su propio `radius` (el de `visualMetrics`, para el
  // texto viajero — otro concepto, mismo nombre de campo). Va PRIMERO en el
  // spread para que el `radius` real del origen, calculado abajo, sea el que
  // gana — al revés, el de `textMetrics` lo pisaba en silencio y el radio del
  // origen siempre terminaba en 0 (bug encontrado por el test de RF-1).
  if (!(el instanceof HTMLElement)) {
    const r = /** @type {Rect} */ (el);
    return {
      el: null,
      rect: r,
      ...textMetrics(null, 14),
      radius: clamp(r.radius ?? originRadius, 0, Math.min(r.width, r.height) / 2),
      bgColor: null,
    };
  }

  const rect = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  let radius = parseFloat(cs.borderRadius) || 0;
  if (cs.borderRadius.includes("%")) {
    radius = (radius / 100) * Math.min(rect.width, rect.height);
  }
  return {
    el,
    rect,
    ...textMetrics(cs, 14),
    radius: Math.min(radius, rect.width / 2, rect.height / 2),
    bgColor: cs.backgroundColor,
  };
}

/**
 * @param {{ box: HTMLElement | (() => HTMLElement), content?, overlay?, flyingText? }} els
 * @param {Partial<typeof DEFAULTS>} [options]
 */
export function createMorph(els, options = {}) {
  const base = { ...DEFAULTS, ...options };
  /**
   * Opciones de la apertura en curso. `open()` acepta overrides por llamada, así
   * que la misma instancia puede abrirse centrada o sobre el botón sin
   * recrearla. Quedan fijas hasta que cierre: el cierre tiene que deshacer
   * exactamente la apertura que ocurrió, no la configuración base.
   */
  let opts = base;

  /** @type {"closed"|"opening"|"open"|"closing"} */
  let state = "closed";
  /** @type {Geom} */
  const geom = { w: 0, h: 0, top: 0, left: 0, radius: 0 };
  /** @type {{ ref: any, origin: ReturnType<typeof readOrigin>, target: Geom, title: any } | null} */
  let saved = null;
  /** @type {ResizeObserver | null} */
  let observer = null;

  const setState = (s) => {
    state = s;
    // La clase deja que el CSS resuelva lo que depende del estado sin que el
    // consumidor cablee nada: sobre todo ocultar el `[data-wisspop-title]`
    // mientras el texto viajero todavía está en camino (design.md §6).
    resolve(els.box)?.classList.toggle("wisspop-open", s === "open");
    opts.onState?.(s);
  };

  const writeGeom =
    opts.onGeom ||
    ((g) => {
      const el = resolve(els.box);
      el.style.width = `${g.w}px`;
      el.style.height = `${g.h}px`;
      el.style.top = `${g.top}px`;
      el.style.left = `${g.left}px`;
      el.style.borderRadius = `${g.radius}px`;
    });
  const applyGeom = () => writeGeom({ ...geom });

  /**
   * Mide el tamaño final real del panel.
   *
   * width/height se borran (""), NO se ponen en "auto": un inline `auto` gana
   * sobre las clases CSS, así que en un panel con ancho declarado por CSS se
   * medía el ancho intrínseco del contenido y al limpiar los estilos al final
   * la caja saltaba de golpe al ancho real (design.md §3).
   */
  function measure() {
    const box = resolve(els.box);
    const prev = {
      width: box.style.width,
      height: box.style.height,
      top: box.style.top,
      left: box.style.left,
    };

    Object.assign(box.style, {
      width: opts.width ? `${opts.width}px` : "",
      height: "",
      top: "-9999px",
      left: "-9999px",
    });
    const rect = box.getBoundingClientRect();
    const w = Math.ceil(rect.width);
    box.style.width = `${w}px`;
    box.style.height = "auto";
    // Rect y no `scrollHeight`: scrollHeight NO incluye los bordes, y el alto
    // se aplica como border-box. Con un borde de 1px la caja quedaba 2px corta
    // y mostraba una barra de scroll permanente en un panel que entraba justo.
    // Usamos Math.ceil para evitar desbordes por redondeo subpixel en pantallas HiDPI.
    const rectH = box.getBoundingClientRect();
    const h = Math.ceil(rectH.height);
    const cs = getComputedStyle(box);
    const radius = opts.radius ?? (parseFloat(cs.borderTopLeftRadius) || 0);
    const bgColor = cs.backgroundColor;

    Object.assign(box.style, prev);
    return { w, h, radius, bgColor };
  }

  /**
   * Dónde aterriza el texto viajero: aplica la geometría final al DOM directo,
   * lee el `[data-wisspop-title]` del contenido y revierte. Medir en vez de un
   * offset constante es lo que permite que el título esté en cualquier parte
   * del contenido del consumidor (design.md §3).
   */
  function measureTitle(target) {
    const box = resolve(els.box);
    const title = box.querySelector("[data-wisspop-title]");
    if (!title) return null;

    const prev = {
      width: box.style.width,
      height: box.style.height,
      top: box.style.top,
      left: box.style.left,
    };
    Object.assign(box.style, {
      width: `${target.w}px`,
      height: `${target.h}px`,
      top: `${target.top}px`,
      left: `${target.left}px`,
    });

    const rect = title.getBoundingClientRect();
    const cs = getComputedStyle(title);

    Object.assign(box.style, prev);
    return {
      top: rect.top,
      left: rect.left,
      w: rect.width,
      h: rect.height,
      ...textMetrics(cs, 30),
    };
  }

  /**
   * Las dos puntas del vuelo. Cada una devuelve las vars de GSAP para ese
   * extremo, así apertura y cierre son el mismo par al revés y no hay dos
   * ramas que se puedan desincronizar.
   */
  function varsEnOrigen(o, fly, mode) {
    const rect = fly.rect;
    // Con el rect del nodo real no hace falta adivinar dónde empieza.
    const top = rect ? rect.top : o.rect.top + (o.rect.height - o.lineHeight) / 2;
    const left = rect ? rect.left : o.rect.left + opts.labelOffsetX;
    // Color y radio van en los DOS modos: son justo lo que se ve saltar si la
    // copia no arranca igual que el original.
    const base = {
      top,
      left,
      borderRadius: `${fly.style.radius}px`,
      ...(fly.style.color ? { color: fly.style.color } : {}),
    };
    return mode === "box"
      ? { ...base, width: rect?.width ?? o.rect.width, height: rect?.height ?? o.rect.height }
      : {
          ...base,
          fontSize: o.fontSize,
          lineHeight: `${o.lineHeight}px`,
          fontWeight: o.fontWeight,
        };
  }

  function varsEnDestino(title, target, mode) {
    const base = {
      top: title?.top ?? target.top,
      left: title?.left ?? target.left,
      borderRadius: `${title?.radius ?? 0}px`,
      ...(title?.color ? { color: title.color } : {}),
    };
    return mode === "box"
      ? { ...base, width: title?.w ?? target.w, height: title?.h ?? target.h }
      : {
          ...base,
          fontSize: title?.fontSize ?? 30,
          lineHeight: `${title?.lineHeight ?? 36}px`,
          fontWeight: title?.fontWeight ?? 400,
        };
  }

  /**
   * El origen se movió (scroll, resize, relayout) y el panel tiene que
   * acompañarlo. Sin animación a propósito: tiene que seguirlo 1:1, cualquier
   * tween lo dejaría arrastrándose un frame por detrás del botón.
   */
  function reposicionar() {
    if (state !== "open" || !saved || !followsOrigin(opts.placement)) return;
    const o = readOrigin(saved.ref, opts.originRadius);
    if (!o) return;
    saved.origin = o;
    saved.target = placeBox(o.rect, saved.target, opts, innerWidth, innerHeight);
    Object.assign(geom, saved.target);
    applyGeom();
    updateScrollability();
  }

  /**
   * Descarte por gesto, estilo notificación de celular. Pointer Events cubre
   * mouse, dedo y lápiz con el mismo código.
   */
  /**
   * El bookkeeping de puntero vive en `gesto.js`, compartido con FlipModal.
   * Acá queda solo lo propio de Morph: cuándo se descarta y hacia dónde.
   */
  function activarGesto(box, overlay) {
    if (!opts.swipeToClose) return null;
    return gestoDeArrastre({
      zona: box,
      overlay,
      umbral: opts.swipeThreshold,
      estaAbierto: () => state === "open",
      alDescartar: ({ dx, dy, dist }) => {
        // Se extrapola el gesto para que salga de pantalla en su dirección.
        const escala = (Math.max(innerWidth, innerHeight) * 1.2) / dist;
        close({ x: dx * escala, y: dy * escala });
      },
    });
  }

  /** @type {null | (() => void)} */
  let soltarGesto = null;

  /** RF-4: el contenido cambió de alto con el panel abierto. */
  function syncHeight(duration = 0.25) {
    const box = resolve(els.box);
    const content = resolve(els.content);
    if (state !== "open" || !saved || !content) return;
    if (opts.fullscreenOnMobile && innerWidth < opts.mobileBreakpoint) return;

    // Se remide con `measure()` y no con `content.scrollHeight`: hay que
    // soltar el alto de la caja para que el contenido colapse a su alto real,
    // si no la medición nunca puede dar menos que el alto actual.
    const next = placeBox(saved.origin.rect, measure(), opts, innerWidth, innerHeight);
    if (Math.abs(next.h - saved.target.h) < 1) return;

    saved.target = next;
    if (box) box.style.willChange = "height, top";
    gsap.to(geom, {
      h: next.h,
      top: next.top,
      duration: reducedMotion() ? 0 : duration,
      ease: "power3.inOut",
      onUpdate: applyGeom,
      onComplete: () => {
        if (box) {
          box.style.willChange = "auto";
          updateScrollability();
        }
      },
    });
  }

  function updateScrollability() {
    const box = resolve(els.box);
    if (!box || state !== "open") return;
    // Solo habilitar scroll vertical si el contenido realmente excede la altura de la caja por más de 1.5px (evitar ruido subpixel)
    if (box.scrollHeight > box.clientHeight + 1.5) {
      box.style.overflowX = "hidden";
      box.style.overflowY = "auto";
    } else {
      box.style.overflow = "hidden";
    }
  }

  let isScrollLocked = false;

  const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function setupAria(box) {
    if (!box) return;
    if (!box.hasAttribute("role")) box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    if (opts.ariaLabel) {
      box.setAttribute("aria-label", opts.ariaLabel);
    } else if (opts.ariaLabelledby) {
      box.setAttribute("aria-labelledby", opts.ariaLabelledby);
    } else {
      const titleEl =
        box.querySelector("[data-wisspop-title]") ||
        box.querySelector("h1, h2, h3, h4, h5, h6");
      if (titleEl) {
        if (!titleEl.id) {
          titleEl.id = `wisspop-title-${Math.random().toString(36).slice(2, 9)}`;
        }
        box.setAttribute("aria-labelledby", titleEl.id);
      }
    }
  }

  function setupFocus(box) {
    if (!box) return;
    if (!box.hasAttribute("tabindex")) box.setAttribute("tabindex", "-1");
    if (opts.trapFocus) {
      const focusables = Array.from(box.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0
      );
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        box.focus();
      }
    }
  }

  function handleKeydown(e) {
    if (state !== "open") return;
    if (opts.closeOnEscape && e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (opts.trapFocus && e.key === "Tab") {
      const box = resolve(els.box);
      if (!box) return;
      const focusables = Array.from(box.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0
      );
      if (focusables.length === 0) {
        e.preventDefault();
        box.focus();
        return;
      }
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === firstEl || !box.contains(document.activeElement)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl || !box.contains(document.activeElement)) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
  }

  /**
   * @param {HTMLElement | string | Rect} origin
   * @param {string | Node} [label] lo que viaja
   * @param {Partial<typeof DEFAULTS>} [overrides] solo para esta apertura
   */
  async function open(origin, label, overrides) {
    if (state !== "closed") return; // RNF-2
    opts = overrides ? { ...base, ...overrides } : base;

    const o = readOrigin(origin, opts.originRadius);
    if (!o) return console.warn("[wisspop] origen no encontrado:", origin);

    // Si no se pasó un label explícito, auto-detectar si el botón disparador tiene icono o contenido
    let flyingPayload = label;
    if (flyingPayload == null && o.el instanceof HTMLElement) {
      const hasIcon = o.el.querySelector("svg, img, [data-wisspop-icon]");
      if (hasIcon) {
        flyingPayload = o.el;
      } else if (o.el.textContent?.trim()) {
        flyingPayload = o.el.textContent.trim();
      }
    }

    setState("opening");
    await opts.mount?.();

    const box = resolve(els.box);
    const content = resolve(els.content);
    const overlay = resolve(els.overlay);
    const flying = flyingPayload != null ? resolve(els.flyingText) : null;
    const d = reducedMotion() ? 0 : opts.duration;

    // El título del destino se esconde SOLO si hay una copia viajando que lo
    // esté supliendo. Sin copia (un modal común, sin texto viajero) la regla
    // lo dejaba invisible toda la animación y lo encendía de golpe al final,
    // porque `.wisspop-open` llega recién ahí: el título aparecía tarde y de
    // un tirón en vez de entrar con el resto del contenido.
    box?.classList.toggle("wisspop-has-flying", !!flying);

    if (opts.lockScroll && !isScrollLocked) {
      acquireScrollLock();
      isScrollLocked = true;
    }
    setupAria(box);

    const medido = measure();
    const target = placeBox(o.rect, medido, opts, innerWidth, innerHeight);
    const title = flying ? measureTitle(target) : null;
    saved = {
      ref: origin,
      origin: o,
      target,
      title,
      bgColor: medido.bgColor,
      previousActiveElement: typeof document !== "undefined" ? document.activeElement : null,
    };

    // Durante la animación el contenido no entra en la caja y el navegador
    // dibujaría una barra de scroll que aparece y desaparece (design.md §7).
    box.style.overflow = "hidden";
    box.style.pointerEvents = "none";
    box.style.visibility = "";
    box.style.willChange = "width, height, top, left, border-radius";

    if (opts.contentAnimation && opts.contentAnimation !== "none") {
      box.classList.add(`wisspop-anim-${opts.contentAnimation}`);
    }
    if (opts.contentStagger) {
      box.classList.add("wisspop-stagger");
    }

    const isFullscreen =
      opts.placement === "fullscreen" ||
      (opts.fullscreenOnMobile &&
        typeof window !== "undefined" &&
        window.innerWidth < opts.mobileBreakpoint);
    const activeEase =
      isFullscreen && typeof opts.ease === "string" && opts.ease.includes("back")
        ? "power3.out"
        : opts.ease;

    Object.assign(geom, {
      w: o.rect.width,
      h: o.rect.height,
      top: o.rect.top,
      left: o.rect.left,
      radius: o.radius,
    });
    applyGeom();

    // De golpe, no desvanecido. La caja arranca exactamente sobre el rect y el
    // radio del origen y ya es opaca, así que lo tapa por completo: no hay nada
    // que se vea desaparecer. Con un fade, en cambio, durante todo el
    // solapamiento se ven los dos — y si hay texto viajero, se ve el label del
    // botón y su copia voladora separándose. Eso era el "saltito".
    if (o.el && (opts.hideOrigin ?? coversOrigin(opts.placement))) {
      gsap.set(o.el, { opacity: 0 });
    }

    // Opaca desde el frame 1, con el fondo del origen. Si la caja hiciera
    // fade-in, para cuando se ve ya estaría a media distancia y la animación se
    // leería como que el panel apareció, no como que el botón se transformó.
    gsap.set(box, { autoAlpha: 1, ...(o.bgColor ? { backgroundColor: o.bgColor } : {}) });
    if (o.bgColor && medido.bgColor) {
      gsap.to(box, { backgroundColor: medido.bgColor, duration: d * 0.6, ease: "power2.out" });
    }

    const animType = opts.contentAnimation || "slide-up";
    let contentFrom = {
      autoAlpha: 0,
      filter: opts.contentBlur ? "blur(4px)" : "none",
    };
    let contentTo = {
      autoAlpha: 1,
      filter: opts.contentBlur ? "blur(0px)" : "none",
      duration: d * 0.65,
      delay: d * 0.35,
      ease: "power2.out",
    };

    if (animType === "slide-up") {
      contentFrom.y = 24;
      contentFrom.scale = 1;
      contentTo.y = 0;
      contentTo.scale = 1;
      contentTo.ease = "power3.out";
    } else if (animType === "slide-down") {
      contentFrom.y = -24;
      contentFrom.scale = 1;
      contentTo.y = 0;
      contentTo.scale = 1;
      contentTo.ease = "power3.out";
    } else if (animType === "scale") {
      contentFrom.y = 0;
      contentFrom.scale = 0.85;
      contentFrom.transformOrigin = "center center";
      contentTo.y = 0;
      contentTo.scale = 1;
      contentTo.ease = "back.out(1.7)";
    } else if (animType === "fade") {
      contentFrom.y = 0;
      contentFrom.scale = 1;
      contentTo.y = 0;
      contentTo.scale = 1;
      contentTo.ease = "power2.out";
    } else if (animType === "none") {
      contentFrom.autoAlpha = 1;
      contentFrom.y = 0;
      contentFrom.scale = 1;
      contentTo = null;
    }

    if (content) {
      gsap.set(content, contentFrom);
    }
    if (overlay) {
      gsap.set(overlay, { autoAlpha: 0 });
      gsap.to(overlay, { autoAlpha: 1, duration: d, ease: "power2.out" });
    }

    if (flying) {
      const { from, mode, style } = prepareFlying(
        flying,
        flyingPayload,
        opts.flyingMode,
        o.el ? getComputedStyle(o.el) : null,
      );
      const fly = { mode, payload: flyingPayload, rect: from, style };
      saved.fly = fly;

      // El color también viaja. Si arranca con el color de destino, en el
      // instante del despegue el glifo cambia de color de golpe y deja de
      // leerse como el mismo objeto moviéndose: se lee como que uno se apagó y
      // otro se encendió en otro lado.
      gsap.set(flying, { ...varsEnOrigen(o, fly, mode), opacity: 1 });
      gsap.to(flying, {
        ...varsEnDestino(title, target, mode),
        duration: d,
        ease: activeEase,
        // El relevo tiene que ser atómico: primero se muestra el original y
        // recién después se oculta la copia, en el mismo bloque síncrono. Si se
        // ocultara la copia y el título apareciera un tick más tarde, quedaría
        // un frame sin ninguno de los dos — el parpadeo del final de la entrada.
        onComplete: () => {
          resolve(els.box)?.classList.add("wisspop-open");
          gsap.set(flying, { opacity: 0 });
        },
      });
    }

    // El contenido entra según la animación elegida (slide-up, slide-down, scale, fade)
    if (content && contentTo) {
      gsap.to(content, contentTo);
    }

    // Cascada de elementos hijos (`contentStagger`)
    if (opts.contentStagger && content) {
      const items = content.querySelectorAll(".stagger-item, .cmd-item, .payment-card, [data-stagger]");
      const targets = items.length > 0
        ? items
        : (content.firstElementChild?.children?.length > 1
            ? content.firstElementChild.children
            : content.children);

      if (targets && targets.length > 0) {
        gsap.set(targets, { autoAlpha: 0, y: 20 });
        gsap.to(targets, {
          autoAlpha: 1,
          y: 0,
          stagger: 0.05,
          duration: 0.45,
          delay: d * 0.35,
          ease: "power3.out",
        });
      }
    }

    await gsap.to(geom, {
      ...target,
      duration: d,
      ease: activeEase,
      onUpdate: applyGeom,
    });

    box.style.willChange = "auto";
    box.style.pointerEvents = "";
    setState("open");

    setupFocus(box);
    if (opts.closeOnEscape || opts.trapFocus) {
      addEventListener("keydown", handleKeydown);
    }

    if (content && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => syncHeight());
      observer.observe(content);
    }
    // `capture` para enterarse también del scroll de contenedores internos, que
    // no burbujea. `passive` porque solo se lee y se reposiciona.
    addEventListener("scroll", reposicionar, { capture: true, passive: true });
    addEventListener("resize", reposicionar, { passive: true });
    soltarGesto = activarGesto(box, overlay);

    // Esperar a que concluyan las micro-animaciones o transforms CSS de entrada
    // antes de activar scroll condicional SOLO si el contenido realmente lo necesita.
    const animDelay = opts.contentStagger ? 350 : (opts.contentAnimation && opts.contentAnimation !== "none" ? 220 : 50);
    setTimeout(() => {
      updateScrollability();
    }, animDelay);
  }

  /** @param {{x:number,y:number}} [fling] dirección del gesto que lo descartó */
  async function close(fling) {
    if (state !== "open") return; // RNF-2
    setState("closing");
    removeEventListener("keydown", handleKeydown);
    observer?.disconnect();
    observer = null;
    removeEventListener("scroll", reposicionar, { capture: true });
    removeEventListener("resize", reposicionar);
    soltarGesto?.();
    soltarGesto = null;

    const box = resolve(els.box);
    const content = resolve(els.content);
    const overlay = resolve(els.overlay);
    const flying = resolve(els.flyingText);
    const d = reducedMotion() ? 0 : opts.closeDuration;
    const prevActive = saved?.previousActiveElement;

    // El origen pudo moverse mientras el panel estaba abierto (scroll, hover,
    // cambio de tema). Volver a leerlo evita el salto al final (design.md §4).
    const o = readOrigin(saved.ref, opts.originRadius) ?? saved.origin;
    box.style.overflow = "hidden";
    box.style.pointerEvents = "none";
    box.style.willChange = "width, height, top, left, border-radius";

    // El origen NO vuelve acá: vuelve de golpe al final, cuando la caja ya
    // ocupa su rect exacto y desaparece. Si reapareciera durante el viaje, se
    // vería debajo del panel que todavía está volviendo.
    if (overlay) gsap.to(overlay, { autoAlpha: 0, duration: d * 0.75, ease: "power2.in" });
    if (content) {
      const animType = opts.contentAnimation || "slide-up";
      let closeVars = {
        autoAlpha: 0,
        filter: opts.contentBlur ? "blur(4px)" : "none",
        duration: d * 0.36,
        ease: "power2.in",
      };
      if (animType === "slide-up") closeVars.y = 16;
      else if (animType === "slide-down") closeVars.y = -16;
      else if (animType === "scale") closeVars.scale = 0.88;

      gsap.to(content, closeVars);
    }
    if (fling) {
      // Descartado con el gesto: no vuelve al origen. El gesto ya dijo a dónde
      // va, y hacerlo volver al botón contradiría lo que la mano acaba de hacer.
      if (flying) gsap.to(flying, { opacity: 0, duration: d * 0.3 });
      await gsap.to(box, {
        x: fling.x,
        y: fling.y,
        opacity: 0,
        duration: d * 0.6,
        ease: "power2.in",
      });
    } else {
      if (flying && saved?.fly) {
        const { mode, payload, style } = saved.fly;
        // Re-medir el elemento del origen en caso de que la página se haya desplazado
        const liveOriginNode = (o.el && o.el.querySelector(".con-icono, [data-wisspop-icon]")) || (payload instanceof Node && payload.isConnected ? payload : null);
        const rect = liveOriginNode ? liveOriginNode.getBoundingClientRect() : null;

        // Re-medir el título en el destino actual
        const liveTitle = box?.querySelector("[data-wisspop-title]");
        const currentTitle = liveTitle
          ? {
              top: liveTitle.getBoundingClientRect().top,
              left: liveTitle.getBoundingClientRect().left,
              w: liveTitle.getBoundingClientRect().width,
              h: liveTitle.getBoundingClientRect().height,
              ...textMetrics(getComputedStyle(liveTitle), 30),
            }
          : saved.title;

        gsap.set(flying, { ...varsEnDestino(currentTitle, saved.target, mode), opacity: 1 });
        gsap.to(flying, {
          ...varsEnOrigen(o, { rect, style }, mode),
          duration: d,
          ease: opts.closeEase || "power2.inOut",
        });
      }

      // La caja se mantiene opaca todo el viaje y vuelve al fondo del origen. No
      // se desvanece: tiene que llegar a tapar al botón, igual que a la ida.
      if (o.bgColor && saved.bgColor) {
        gsap.to(box, { backgroundColor: o.bgColor, duration: d, ease: opts.closeEase });
      }

      await gsap.to(geom, {
        w: o.rect.width,
        h: o.rect.height,
        top: o.rect.top,
        left: o.rect.left,
        radius: o.radius,
        duration: d,
        ease: opts.closeEase,
        onUpdate: applyGeom,
      });
    }

    // Sin esto el panel cerrado sigue interceptando clics (design.md §8).
    if (flying) gsap.set(flying, { opacity: 0, clearProps: "all" });
    if (box) {
      box.style.willChange = "auto";
      box.style.visibility = "hidden";
      box.style.opacity = "0";
      box.style.pointerEvents = "none";
      box.classList.remove(
        "wisspop-anim-slide-up",
        "wisspop-anim-slide-down",
        "wisspop-anim-scale",
        "wisspop-anim-fade",
        "wisspop-stagger",
      );
      gsap.set(box, { clearProps: "transform,width,height,top,left,borderRadius,backgroundColor,willChange" });
    }
    if (content) gsap.set(content, { clearProps: "all" });
    saved = null;
    setState("closed");
    // Devolver el origen y desmontar en el mismo bloque síncrono: el navegador
    // no pinta entre estas dos líneas, así que el relevo es atómico y no hay
    // ningún frame con los dos visibles ni con ninguno.
    if (o.el) gsap.set(o.el, { clearProps: "opacity" });
    opts.unmount?.();

    if (isScrollLocked) {
      releaseScrollLock();
      isScrollLocked = false;
    }

    if (opts.restoreFocus && prevActive && typeof prevActive.focus === "function" && prevActive.isConnected) {
      try {
        prevActive.focus();
      } catch {}
    }
  }

  /**
   * RF-5: cambiar el contenido sin cerrar. La mutación va primero y sin esperar
   * a la animación: si GSAP no llegara a correr, el DOM correcto ya está montado.
   * `mutate` puede ser async — el wrapper le mete el nextTick/flush de su framework.
   */
  async function changeView(mutate) {
    await mutate?.();
    const content = resolve(els.content);
    syncHeight(0.25);
    if (content && !reducedMotion()) {
      gsap.fromTo(
        content,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.2, ease: "power2.out", clearProps: "transform" },
      );
    }
  }

  return {
    open,
    close,
    changeView,
    /** El contenido cambió de alto (ej. apareció un error). */
    resync: (duration) => syncHeight(duration ?? 0.2),
    destroy() {
      removeEventListener("keydown", handleKeydown);
      if (isScrollLocked) {
        releaseScrollLock();
        isScrollLocked = false;
      }
      observer?.disconnect();
      observer = null;
      removeEventListener("scroll", reposicionar, { capture: true });
      removeEventListener("resize", reposicionar);
      soltarGesto?.();
      soltarGesto = null;
      // Si se destruye a mitad de la apertura, el origen quedaría invisible
      // para siempre y sin nadie que lo devuelva.
      if (saved?.origin.el) gsap.set(saved.origin.el, { clearProps: "opacity" });
      gsap.killTweensOf([geom, resolve(els.box), resolve(els.content), resolve(els.overlay), resolve(els.flyingText)].filter(Boolean));
      saved = null;
      state = "closed"; // sin notificar: desmontar no es "se cerró"
    },
    get state() {
      return state;
    },
  };
}

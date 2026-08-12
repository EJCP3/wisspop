/**
 * WissPop core — FlipModal. Transición FLIP de elementos compartidos sin framework.
 *
 * Utiliza GSAP Flip plugin para trasladar e interpolar elementos marcados con
 * `data-flip-id` del elemento trigger al modal y viceversa, manteniendo identidad visual.
 */
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { activarGesto } from "./gesto.js";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Flip);
}

const DEFAULTS = {
  flipId: "",
  duration: 0.45,
  ease: "power3.inOut",
  overlayDuration: 0.5,
  stagger: 0.04,
  /**
   * Cerrar arrastrando la tarjeta. A diferencia de Morph, acá el panel NO se
   * va para donde lo tiraron: vuelve al trigger. El contrato del flip es que
   * la tarjeta es el mismo elemento que el trigger, y una copia saliendo
   * volando mientras el original reaparece en su sitio rompe justo eso.
   * Como Flip mide el rect vigente, el punto donde se soltó es el punto de
   * partida del vuelo de vuelta: no hay dos animaciones encadenadas.
   */
  swipeToClose: false,
  /** px de arrastre para que el gesto cuente como descarte. */
  swipeThreshold: 90,
  closeOnEscape: true,
  trapFocus: true,
  restoreFocus: true,
  lockScroll: false,
  ariaLabel: null,
  ariaLabelledby: null,
  mount: null,
  unmount: null,
  onState: null,
};

/** Ver `setDefaults` en morph.js — mismo contrato, para las opciones del flip. */
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
 * @param {{ trigger: HTMLElement | (() => HTMLElement), modal: HTMLElement | (() => HTMLElement), overlay?: HTMLElement | (() => HTMLElement) }} els
 * @param {Partial<typeof DEFAULTS>} [options]
 */
export function createFlip(els, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  let state = "closed";
  let previousActiveElement = null;
  let isScrollLocked = false;
  /** @type {null | (() => void)} soltar los listeners del gesto */
  let soltarGesto = null;

  const setState = (s) => {
    state = s;
    const modal = resolve(els.modal);
    modal?.classList.toggle("wisspop-open", s === "open");
    opts.onState?.(s);
  };

  /** Query flip targets scoped to a container (including root itself) */
  const getTargets = (container) => {
    const root = resolve(container);
    if (!root) return [];
    const sel = opts.flipId
      ? `[data-flip-id="${opts.flipId}"], [data-flip-id^="${opts.flipId}-"]`
      : `[data-flip-id]`;
    const results = gsap.utils.toArray(root.querySelectorAll(sel));
    // Also include the root element itself if it matches
    if (root.matches && root.matches(sel) && !results.includes(root)) {
      results.unshift(root);
    }
    return results;
  };

  /** Query fade items scoped to a container */
  const getFadeItems = (container, type) => {
    const root = resolve(container);
    if (!root) return [];
    return gsap.utils.toArray(root.querySelectorAll(`.${type}-fade-item-${opts.flipId}`));
  };

  /**
   * La × de `closeButton`. La anima el core y no cada adaptador, y aparte del
   * resto del contenido secundario, porque no está en la misma situación:
   *
   * - Los demás están DENTRO de la tarjeta que viaja, así que crecen con ella.
   *   La × está anclada a la esquina de la CAJA, que ya tiene el tamaño final
   *   desde el frame 0. Mientras la tarjeta es chica esa esquina le queda
   *   lejos, y la × se ve flotando fuera del modal.
   * - Por eso entra al final del vuelo, cuando la tarjeta ya llegó a su
   *   tamaño y la esquina de las dos coincide.
   * - Y por eso crece en el eje Z (escala desde su propio centro) en vez de
   *   deslizarse en Y: un desplazamiento la haría entrar desde fuera del
   *   panel, que es justo lo que se quiere evitar.
   */
  const getCloseButton = (container) => resolve(container)?.querySelector(".wisspop-close") ?? null;

  /**
   * La tarjeta de nivel superior: la que `absolute:` saca del flujo y la que
   * el usuario percibe como "el modal". Estaba escrito igual en `open` y en
   * `close`; una sola definición para que no se puedan desincronizar.
   */
  const TOP_SELECTOR = opts.flipId
    ? `[data-flip-id="${opts.flipId}"], [data-flip-id="${opts.flipId}-card"], [data-flip-id^="${opts.flipId}-container"]`
    : `[data-flip-id]`;

  /**
   * Qué se arrastra con el dedo. La TARJETA, no la caja:
   *
   * - La caja en Vue/React se centra con `transform: translate(-50%,-50%)`, y
   *   `gsap.set(caja, {x, y})` no lo preserva —lo reemplaza—, así que al primer
   *   movimiento pegaría un salto de medio ancho. En vanilla la caja es
   *   `position: relative` dentro de un flex y no tiene transform: el mismo
   *   parche serviría en un adaptador y rompería el otro.
   * - La tarjeta, en cambio, es idéntica en los tres y no tiene transform propio.
   * - Y es lo que realmente se ve: la caja es un envoltorio transparente.
   *
   * La × va también, o se quedaría clavada mientras la tarjeta se mueve.
   */
  const getArrastrables = () => {
    const root = resolve(els.modal);
    if (!root) return [];
    return [...root.querySelectorAll(TOP_SELECTOR), getCloseButton(els.modal)].filter(Boolean);
  };

  // `absolute:` (para sacar el elemento del flujo mientras vuela) y `props:
  // "borderRadius"` dejan un remanente inline que ni `clearProps: true` ni
  // `clearProps: "<lista exacta>"` limpian: `padding`/`border-*-radius`
  // quedan pegados en `0px` para siempre. No es un bug de esta librería —
  // GSAP los escribe por un canal aparte (el bookkeeping de "hacerlo
  // absoluto" y la expansión de las cuatro esquinas del radio), fuera de la
  // cadena de props que el propio `clearProps` de la tween recorre.
  //
  // Sacarlas sin más (`removeProperty`) fue el primer intento, y se llevaba
  // puesto el `padding`/`border-radius` que el CONSUMIDOR sí había puesto a
  // mano — el FlipModal de ejemplo con `padding: 1.5rem` en el div perdía
  // ese padding en cuanto terminaba de abrir. Por eso se captura el valor
  // ORIGINAL antes de que Flip toque nada y se restaura ese valor exacto al
  // terminar — no un remove a ciegas.
  const RESIDUO_ABSOLUTE = [
    "padding",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "borderTopLeftRadius",
    "borderTopRightRadius",
    "borderBottomLeftRadius",
    "borderBottomRightRadius",
  ];
  const capturarEstiloOriginal = (targets) =>
    targets.map((el) => ({ el, original: Object.fromEntries(RESIDUO_ABSOLUTE.map((p) => [p, el.style[p]])) }));
  const restaurarEstiloOriginal = (capturado) => {
    for (const { el, original } of capturado) {
      for (const prop of RESIDUO_ABSOLUTE) {
        if (original[prop]) el.style[prop] = original[prop];
        else el.style.removeProperty(prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`));
      }
    }
  };

  const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function setupAria(modal) {
    if (!modal) return;
    if (!modal.hasAttribute("role")) modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    if (opts.ariaLabel) {
      modal.setAttribute("aria-label", opts.ariaLabel);
    } else if (opts.ariaLabelledby) {
      modal.setAttribute("aria-labelledby", opts.ariaLabelledby);
    } else {
      const titleEl =
        modal.querySelector("[data-wisspop-title]") ||
        modal.querySelector("h1, h2, h3, h4, h5, h6");
      if (titleEl) {
        if (!titleEl.id) {
          titleEl.id = `wisspop-title-${Math.random().toString(36).slice(2, 9)}`;
        }
        modal.setAttribute("aria-labelledby", titleEl.id);
      }
    }
  }

  function setupFocus(modal) {
    if (!modal) return;
    if (!modal.hasAttribute("tabindex")) modal.setAttribute("tabindex", "-1");
    if (opts.trapFocus) {
      const focusables = Array.from(modal.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0
      );
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        modal.focus();
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
      const modal = resolve(els.modal);
      if (!modal) return;
      const focusables = Array.from(modal.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0
      );
      if (focusables.length === 0) {
        e.preventDefault();
        modal.focus();
        return;
      }
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === firstEl || !modal.contains(document.activeElement)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl || !modal.contains(document.activeElement)) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
  }

  // ── OPEN ──────────────────────────────────────────────────────────────
  async function open() {
    if (state !== "closed") return;
    setState("opening");

    previousActiveElement = typeof document !== "undefined" ? document.activeElement : null;
    const trigger = resolve(els.trigger);
    const d = reducedMotion() ? 0 : opts.duration;

    if (opts.lockScroll && !isScrollLocked) {
      acquireScrollLock();
      isScrollLocked = true;
    }

    // 1. Fade out trigger secondary items while trigger is still visible
    const triggerFadeItems = getFadeItems(els.trigger, "trigger");
    if (triggerFadeItems.length && d > 0) {
      gsap.to(triggerFadeItems, { autoAlpha: 0, duration: 0.08, ease: "none" });
      await new Promise((r) => setTimeout(r, 40));
    }

    // 2. Capture trigger state while it's STILL VISIBLE in the DOM
    const triggerTargets = getTargets(els.trigger);
    const flipState = Flip.getState(triggerTargets, { props: "borderRadius" });

    // 3. Mount the modal into the DOM (overlay + box)
    await opts.mount?.();
    const modal = resolve(els.modal);
    const overlay = resolve(els.overlay);
    // Oculta hasta el paso 9 a propósito. El mount deja la tarjeta ya en su
    // tamaño y posición FINAL (grande, centrada) — recién en el paso 9
    // `Flip.from` la invierte de golpe a la posición chica del trigger y
    // arranca el viaje. Entre medio hay un `await` de un frame real (paso 8,
    // para que el layout esté calculado), y sin ocultarla ahí el navegador
    // llega a pintar la tarjeta grande antes de que Flip la esconda de vuelta:
    // un flash del modal completo seguido de un salto hacia atrás, justo
    // antes de crecer. Se revela recién cuando `Flip.from` ya la invirtió,
    // en el mismo tick — el mismo truco que usa `morph.js` con `gsap.set`,
    // adaptado a que acá quien fija el estado inicial es el propio Flip.
    if (modal) modal.style.visibility = "hidden";

    // Borrar el desplazamiento que dejó un cierre por gesto, ANTES de medir
    // nada. Los adaptadores que recrean el DOM en cada apertura (Vue, React)
    // no lo notaban, pero vanilla arma la caja una sola vez y la reusa: el
    // modal volvía a abrirse en el punto donde lo habían soltado, y cada
    // arrastre corría un poco más el siguiente.
    //
    // No alcanza con el `clearProps` del vuelo de cierre: con `duration: 0`
    // —reduced-motion— el cierre sale por `finishClose` sin llegar a correr
    // `Flip.to`, y la × ni siquiera está entre sus targets.
    // `clearProps` y no `{x: 0, y: 0}`: poner el desplazamiento en cero deja
    // igual un `transform` inline escrito, y RNF-1 pide que el panel no filtre
    // ni un estilo. Acá se quita la propiedad; si nunca hubo arrastre, no hace
    // nada.
    gsap.set(getArrastrables(), { clearProps: "transform" });
    setupAria(modal);

    // 4. Now hide the trigger so both aren't visible at once
    if (trigger) {
      trigger.style.visibility = "hidden";
    }

    // 5. Animate overlay (now it's in the DOM)
    if (overlay && d > 0) {
      gsap.set(overlay, { autoAlpha: 0 });
      gsap.to(overlay, { autoAlpha: 1, duration: opts.overlayDuration, ease: "power2.out" });
    } else if (overlay) {
      gsap.set(overlay, { autoAlpha: 1 });
    }

    // 6. Hide modal fade items before animation
    const modalFadeItems = getFadeItems(els.modal, "modal");
    if (modalFadeItems.length && d > 0) {
      gsap.set(modalFadeItems, { autoAlpha: 0, y: 8 });
    }
    const closeBtn = getCloseButton(els.modal);
    if (closeBtn && d > 0) {
      // El `x`/`y` ya lo limpió el reset de arrastre de más arriba.
      gsap.set(closeBtn, { autoAlpha: 0, scale: 0.4 });
    }

    // Force browser layout reflow so modal targets have computed geometry
    await new Promise((r) => requestAnimationFrame(r));

    // 7. Get targets in the modal (now mounted and layout-computed)
    const modalTargets = getTargets(els.modal);

    // El gesto se engancha a la caja pero mueve la tarjeta. Se activa recién
    // con el panel abierto: durante el vuelo la tarjeta la maneja Flip, y un
    // `gsap.set` de arrastre encima le pisaría la animación.
    const engancharGesto = () => {
      if (!opts.swipeToClose) return;
      soltarGesto = activarGesto({
        zona: modal,
        mueve: getArrastrables(),
        overlay,
        umbral: opts.swipeThreshold,
        estaAbierto: () => state === "open",
        // Sin fling: el cierre normal. Flip mide el rect vigente, así que la
        // tarjeta arranca su vuelo desde donde la soltó el dedo.
        alDescartar: () => close(),
      });
    };

    if (d === 0) {
      // Sin Flip.from acá abajo (reduced-motion): nadie más va a revelarla.
      if (modal) modal.style.visibility = "";
      if (modalFadeItems.length) gsap.set(modalFadeItems, { autoAlpha: 1, y: 0 });
      if (closeBtn) gsap.set(closeBtn, { autoAlpha: 1, scale: 1 });
      setState("open");
      setupFocus(modal);
      if (opts.closeOnEscape || opts.trapFocus) addEventListener("keydown", handleKeydown);
      engancharGesto();
      return;
    }

    if (modal) {
      const rect = modal.getBoundingClientRect();
      if (rect.width > 0) modal.style.minWidth = `${rect.width}px`;
      if (rect.height > 0) modal.style.minHeight = `${rect.height}px`;
    }

    const finishOpen = () => {
      if (modal) {
        modal.style.minWidth = "";
        modal.style.minHeight = "";
      }
      setState("open");
      setupFocus(modal);
      if (opts.closeOnEscape || opts.trapFocus) addEventListener("keydown", handleKeydown);
      engancharGesto();
    };

    // 8. El contenido secundario entra MIENTRAS la caja viaja, no después.
    // Mismas proporciones que morph.js (delay 37.5% / duración 62.5%): termina
    // de revelarse justo cuando la caja termina de crecer, sea cual sea
    // `duration`. Encadenado detrás del `onComplete` la apertura eran dos
    // etapas de 0.45s + 0.22s que se sentían a tirones al lado del resto.
    if (modalFadeItems.length) {
      gsap.to(modalFadeItems, {
        autoAlpha: 1,
        y: 0,
        duration: d * 0.625,
        delay: d * 0.375,
        stagger: opts.stagger,
        ease: "power2.out",
      });
    }

    // La × recién sobre el final (80%): antes de eso su esquina —la de la
    // caja— todavía no coincide con la de la tarjeta, y aparecería flotando
    // fuera del panel. Crece desde su propio centro, sin desplazamiento.
    if (closeBtn) {
      gsap.to(closeBtn, {
        autoAlpha: 1,
        scale: 1,
        duration: d * 0.35,
        delay: d * 0.8,
        ease: "back.out(2)",
      });
    }

    // 9. Run FLIP animation from trigger → modal
    const estiloOriginalModal = capturarEstiloOriginal(modalTargets);
    // Se revela en el mismo tick que `Flip.from`: la llamada invierte la
    // tarjeta a la posición del trigger de forma síncrona antes de animar, así
    // que no hay paint entre "visible" y "ya invertida" — nunca se ve grande.
    if (modal) modal.style.visibility = "";
    Flip.from(flipState, {
      targets: modalTargets,
      duration: d,
      ease: opts.ease,
      absolute: TOP_SELECTOR,
      // Ancho/alto reales, no scale (design.md §5): con scale el border-radius
      // se deforma y las imágenes quedan borrosas durante el viaje.
      props: "borderRadius",
      zIndex: 100,
      onComplete: () => {
        restaurarEstiloOriginal(estiloOriginalModal);
        finishOpen();
      },
    });
  }

  // ── CLOSE ─────────────────────────────────────────────────────────────
  async function close() {
    if (state !== "open") return;
    setState("closing");
    removeEventListener("keydown", handleKeydown);
    // Se suelta ANTES de medir: si no, un segundo arrastre durante el vuelo
    // le escribiría transforms a la tarjeta que Flip ya está animando.
    soltarGesto?.();
    soltarGesto = null;

    const overlay = resolve(els.overlay);
    const trigger = resolve(els.trigger);
    const modal = resolve(els.modal);
    const d = reducedMotion() ? 0 : opts.duration;

    // 1. Fade out overlay
    if (overlay && d > 0) {
      gsap.to(overlay, { autoAlpha: 0, duration: opts.overlayDuration, ease: "power2.inOut" });
    }

    // 2. El contenido secundario se va ANTES que la tarjeta, espejo de la
    // entrada. Era `0.12s` lineal fijo: no escalaba con `duration` —con un
    // cierre lento la × se cortaba en seco al principio y la tarjeta seguía
    // viajando sola— y sin curva ni escalonado se sentía un corte, no una
    // salida. Ahora usa la misma proporción que la entrada (37.5%), el mismo
    // escalonado y el `y` de vuelta, así abrir y cerrar son el mismo gesto.
    const modalFadeItems = getFadeItems(els.modal, "modal");
    const closeBtn = getCloseButton(els.modal);
    // La × se va primero y rápido: es lo único anclado a la caja, así que en
    // cuanto la tarjeta arranca a encogerse queda suelta en el aire. Sale por
    // donde entró —escala, no desplazamiento— para que el gesto sea el mismo.
    if (closeBtn && d > 0) {
      gsap.to(closeBtn, { autoAlpha: 0, scale: 0.4, duration: d * 0.25, ease: "power2.in" });
    }
    if (modalFadeItems.length && d > 0) {
      gsap.to(modalFadeItems, {
        autoAlpha: 0,
        y: 8,
        duration: d * 0.375,
        stagger: opts.stagger,
        ease: "power2.in",
      });
      await new Promise((r) => setTimeout(r, 40));
    }

    // 3. Medir el destino SIN tocar el trigger. Sigue en `visibility: hidden`,
    // así que conserva su lugar en el layout —nada de la página se mueve— y su
    // geometría ya es válida: `getBoundingClientRect` mide igual un elemento
    // oculto por `visibility`.
    const triggerFadeItems = getFadeItems(els.trigger, "trigger");
    const triggerTargets = getTargets(els.trigger);
    const triggerState = Flip.getState(triggerTargets, { props: "borderRadius" });

    // 4. Lo que viaja es el modal, no el trigger — simétrico con la apertura.
    // Animar el trigger lo obligaba a salir del flujo (`absolute`) y su fila
    // colapsaba a 0: toda la página de abajo saltaba 230px hacia arriba durante
    // el cierre y otros 230 de vuelta al terminar. Sin `absolute` el salto era
    // el mismo pero al revés, empujando hacia abajo mientras crecía en flujo.
    // El modal vive en un wrapper `position: fixed`, fuera del flujo: puede
    // viajar y cambiar de tamaño sin mover una sola línea de la página.
    const modalTargets = getTargets(els.modal);

    const finishClose = () => {
      if (modal) {
        modal.style.minWidth = "";
        modal.style.minHeight = "";
        // Esconderla ACÁ y no confiar en el desmontaje: `clearProps` acaba de
        // devolverle a la tarjeta su tamaño de modal, y `unmount` en Vue/React
        // solo marca estado reactivo —el nodo se borra uno o dos frames
        // después—. En el medio se alcanzaba a pintar el modal entero: el
        // parpadeo al final del cierre. En vanilla no se veía porque ahí
        // `unmount` es un `.remove()` síncrono.
        modal.style.visibility = "hidden";
      }
      // Relevo atómico: el trigger reaparece y el modal se desmonta en el mismo
      // bloque síncrono, así no hay ningún frame con los dos ni con ninguno
      // (misma regla que el relevo del texto viajero, design.md §6).
      if (trigger) trigger.style.visibility = "";
      opts.unmount?.();
      if (triggerFadeItems.length) {
        if (d > 0) {
          gsap.to(triggerFadeItems, { autoAlpha: 1, duration: 0.18, ease: "power2.out" });
        } else {
          gsap.set(triggerFadeItems, { autoAlpha: 1 });
        }
      }
      if (isScrollLocked) {
        releaseScrollLock();
        isScrollLocked = false;
      }
      setState("closed");
      if (opts.restoreFocus && previousActiveElement && typeof previousActiveElement.focus === "function" && previousActiveElement.isConnected) {
        try { previousActiveElement.focus(); } catch {}
      }
    };

    if (d === 0) {
      finishClose();
      return;
    }

    // `absolute` saca la tarjeta del flujo, así que la caja que la contiene
    // colapsa a su tamaño natural (casi cero) durante todo el viaje. Todo lo
    // que NO es un target del flip —la × de `closeButton`, anclada a la esquina
    // de la caja, y cualquier contenido propio del consumidor— se iba con ella
    // y quedaba flotando lejos de la tarjeta que viaja. `open()` ya congelaba
    // el tamaño por esto mismo; el cierre se lo había perdido.
    if (modal) {
      const rect = modal.getBoundingClientRect();
      if (rect.width > 0) modal.style.minWidth = `${rect.width}px`;
      if (rect.height > 0) modal.style.minHeight = `${rect.height}px`;
    }

    // 5. El modal viaja hasta la geometría del trigger. `absolute` acá solo
    // toca elementos del modal, que ya están fuera del flujo de la página.
    const estiloOriginalModal = capturarEstiloOriginal(modalTargets);
    Flip.to(triggerState, {
      targets: modalTargets,
      duration: d,
      ease: opts.ease,
      absolute: TOP_SELECTOR,
      // Ídem apertura: width/height reales, no scale (design.md §5).
      props: "borderRadius",
      zIndex: 100,
      // `Flip.from` lo asume solo; `Flip.to` NO — hay que pedirlo explícito.
      // El adaptador crea el box una sola vez y lo reusa en cada apertura, así
      // que sin esto los nodos del modal quedan con la geometría del trigger
      // pegada inline (`width: 256px`, `position: absolute`, transforms) y la
      // siguiente apertura arranca con esa basura: la tarjeta salía chica, el
      // texto desbordado y la × suelta en el aire.
      clearProps: true,
      onComplete: () => {
        restaurarEstiloOriginal(estiloOriginalModal);
        finishClose();
      },
    });
  }

  return {
    open,
    close,
    destroy() {
      removeEventListener("keydown", handleKeydown);
      soltarGesto?.();
      soltarGesto = null;
      if (isScrollLocked) {
        releaseScrollLock();
        isScrollLocked = false;
      }
      state = "closed";
    },
    get state() {
      return state;
    },
  };
}

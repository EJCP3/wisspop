/**
 * Wrapper React de MorphModal — mismo contrato que WissPopMorph.vue.
 *
 * `createPortal` reemplaza a `<Teleport>`, `useRef` reemplaza a `ref()`, y
 * `useImperativeHandle` reemplaza a `defineExpose` (design.md §1). El resto
 * es igual: la geometría entra por `onGeom` a estado reactivo, nunca se
 * escribe `boxEl.style` directo — un re-render de React pisaría a GSAP a
 * mitad de camino, igual que pasaba en Vue (design.md §2).
 */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createMorph } from "../core/morph.js";
import { useDomMount } from "./use-dom-mount.js";
import { soloDefinidos } from "../shared/solo-definidos.js";

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const WissPopMorph = forwardRef(function WissPopMorph(
  {
    open: isOpen = false,
    onClose,
    /** HTMLElement | selector CSS | Rect literal */
    originRef = null,
    placement = "center",
    align = "center",
    gap = 16,
    /**
     * Velocidad y curva. Sin default propio A PROPÓSITO: si el wrapper mandara
     * siempre un valor, pisaría al del core y `setDefaults()` no serviría de
     * nada. Sin pasar nada manda el core (0.55 / 0.7, o lo que fije setDefaults).
     * El cierre tiene su propio ritmo: no es la apertura al revés.
     */
    duration,
    ease,
    closeDuration,
    closeEase,
    contentBlur = false,
    /**
     * Texto viajero. `null` (default) no monta nada; con cualquier string
     * —incluso vacío— se crea el elemento que viaja, misma condición que usa
     * `createModal` de vanilla.
     */
    flyingTextClass = null,
    /**
     * Qué viaja del origen al panel: un string o un nodo (se clona, el original
     * se queda en el botón). Es el default del `label` de `open()`, para que el
     * camino declarativo por la prop `open` también pueda tener viajero.
     */
    label = null,
    labelOffsetX = 24,
    /** `"text"` · `"box"` · `null` (automático). Ver DEFAULTS del core. */
    flyingMode = null,
    // Los estilos son del consumidor: la librería solo se ocupa del movimiento.
    modalClass = "",
    overlayClass = "",
    // Botón × propio, para cuando no querés armar el tuyo con el `close` del children-render-prop.
    closeButton = false,
    closeButtonClass = "",
    closeOnEscape = true,
    trapFocus = true,
    restoreFocus = true,
    lockScroll = false,
    ariaLabel = null,
    ariaLabelledby = null,
    children,
    /**
     * Todo lo que el wrapper no declara se reenvía al core, igual que el
     * `...coreOpts` de vanilla. Enumerar a mano dejaba opciones afuera en
     * silencio: `swipeToClose` y `fullscreenOnMobile` llegaban `undefined`
     * mientras las demos los pasaban. En React no hace falta normalizar nada:
     * las props ya son camelCase y valores JS reales.
     */
    ...opcionesExtra
  },
  ref,
) {
  const { visible, mount, unmount } = useDomMount();
  const [boxStyle, setBoxStyle] = useState({});
  const boxEl = useRef(null);
  const contentEl = useRef(null);
  const overlayEl = useRef(null);
  const flyingEl = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // Por ref y no por dependencia del efecto: un nodo como `label` cambia de
  // identidad en cada render y reabriría el panel en loop.
  const labelRef = useRef(label);
  labelRef.current = label;

  // El core se crea UNA sola vez, con las opciones de configuración de ESE
  // primer render — igual que en Vue, no son reactivas a cambios de prop
  // después de montar. Para eso está la API imperativa (`ref.current.open`),
  // que sí acepta overrides por llamada.
  const coreRef = useRef(null);
  if (!coreRef.current) {
    coreRef.current = createMorph(
      {
        box: () => boxEl.current,
        content: () => contentEl.current,
        overlay: () => overlayEl.current,
        flyingText: () => flyingEl.current,
      },
      {
        // Primero: lo que el wrapper cablea explícitamente siempre gana.
        ...opcionesExtra,
        placement,
        align,
        gap,
        ...soloDefinidos({ duration, ease, closeDuration, closeEase }),
        contentBlur,
        labelOffsetX,
        flyingMode,
        closeOnEscape,
        trapFocus,
        restoreFocus,
        lockScroll,
        ariaLabel,
        ariaLabelledby,
        onGeom: (g) =>
          setBoxStyle({
            width: `${g.w}px`,
            height: `${g.h}px`,
            top: `${g.top}px`,
            left: `${g.left}px`,
            borderRadius: `${g.radius}px`,
          }),
        mount,
        unmount: () => {
          unmount();
          setBoxStyle({});
        },
        // Único lugar donde se avisa, para que un cierre que arranca ADENTRO
        // del core —gesto de arrastre, Escape— también baje la prop `open` del
        // padre. Avisando solo desde `requestClose` quedaba en `true` con el
        // panel cerrado, y el efecto no volvía a correr: no se podía reabrir.
        onState: (s) => {
          if (s === "closed") onCloseRef.current?.();
        },
      },
    );
  }

  const requestClose = () => coreRef.current.close();

  useImperativeHandle(
    ref,
    () => ({
      // `(origin, label, overrides)` — misma firma que Vue y que el core, para
      // que el elemento viajero se pueda elegir en la llamada.
      open: (origin, label, overrides) =>
        coreRef.current.open(origin ?? originRef, label ?? labelRef.current, overrides),
      close: () => coreRef.current.close(),
      changeView: (mutate) => coreRef.current.changeView(mutate),
      resync: (duration) => coreRef.current.resync(duration),
      get state() {
        return coreRef.current.state;
      },
    }),
    [originRef],
  );

  // Sin dependencia de `originRef`: igual que el watcher de Vue, solo
  // reacciona a que `isOpen` cambie, pero lee el `originRef` VIGENTE en ese
  // momento (la closure de este efecto se recrea cada render).
  useEffect(() => {
    if (isOpen) {
      coreRef.current.open(originRef, labelRef.current, {
        placement, align, gap, contentBlur,
        ...soloDefinidos({ duration, ease, closeDuration, closeEase }),
      });
    } else {
      coreRef.current.close();
    }
  }, [isOpen, originRef, placement, align, gap, duration, ease, closeDuration, closeEase, contentBlur]);

  useEffect(() => () => coreRef.current.destroy(), []);

  if (typeof document === "undefined") return null; // RNF-3: nada de DOM en SSR

  return createPortal(
    <>
      {visible && <div ref={overlayEl} className={`wisspop-overlay ${overlayClass}`} onClick={requestClose} />}
      {/* Fuera del panel: el panel es overflow-hidden mientras anima y
          recortaría al viajero durante todo el viaje (design.md §6). */}
      {visible && flyingTextClass != null && (
        <div ref={flyingEl} className={`wisspop-flying-text ${flyingTextClass}`} />
      )}
      {visible && (
        <div
          ref={boxEl}
          className={`wisspop-box ${modalClass}`}
          style={boxStyle}
          onClick={(e) => e.stopPropagation()}
        >
          <div ref={contentEl} className="wisspop-content">
            {typeof children === "function" ? children({ close: requestClose }) : children}
          </div>
          {closeButton && (
            <button
              type="button"
              className={`wisspop-close ${closeButtonClass}`}
              aria-label="Cerrar"
              onClick={requestClose}
            >
              <CloseIcon />
            </button>
          )}
        </div>
      )}
    </>,
    document.body,
  );
});

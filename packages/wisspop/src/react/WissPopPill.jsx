/**
 * Wrapper React de PillModal — mismo contrato que WissPopPill.vue.
 * Ver WissPopMorph.jsx para las notas generales de la adaptación a React.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createMorph } from "../core/morph.js";
import { useDomMount } from "./use-dom-mount.js";

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const WissPopPill = forwardRef(function WissPopPill(
  {
    onOpen,
    onClose,
    onOpenChange,
    desktopWidth = 540,
    borderRadius = 40,
    // Los estilos son del consumidor: la librería solo se ocupa del movimiento.
    overlayClass = "",
    modalClass = "",
    flyingTextClass = "",
    dataTheme = null,
    labelOffsetX = 24,
    mobileBreakpoint = 640,
    /**
     * Velocidad y curva del viaje optimizadas para movimientos orgánicos y nítidos.
     */
    duration = 0.38,
    ease = "power3.out",
    closeDuration = 0.32,
    closeEase = "power3.inOut",
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
    /** Ver WissPopMorph.jsx: se reenvía al core, igual que `...coreOpts` de vanilla. */
    ...opcionesExtra
  },
  ref,
) {
  const { visible, mount, unmount } = useDomMount();
  const [titleReady, setTitleReady] = useState(false);
  const [boxStyle, setBoxStyle] = useState({});
  const boxEl = useRef(null);
  const contentEl = useRef(null);
  const overlayEl = useRef(null);
  const flyingEl = useRef(null);
  const callbacks = useRef({ onOpen, onClose, onOpenChange });
  callbacks.current = { onOpen, onClose, onOpenChange };

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
        placement: "center",
        width: desktopWidth,
        radius: borderRadius,
        originRadius: 999,
        fullscreenOnMobile: true,
        mobileBreakpoint,
        labelOffsetX,
        duration,
        ease,
        closeDuration,
        closeEase,
        contentBlur: false,
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
        // El título real vive en opacity:0 hasta que el texto viajero aterriza
        // — estado reactivo, no un `gsap.set` inline: al volver de una
        // sub-vista el título se recrea desde cero (design.md §6).
        onState: (s) => {
          setTitleReady(s === "open");
          if (s === "opening") {
            callbacks.current.onOpenChange?.(true);
            callbacks.current.onOpen?.();
          }
          if (s === "closed") {
            callbacks.current.onOpenChange?.(false);
            callbacks.current.onClose?.();
          }
        },
      },
    );
  }

  const open = (origin, label, overrides) => coreRef.current.open(origin, label, overrides);
  const close = () => coreRef.current.close();

  useImperativeHandle(ref, () => ({
    open,
    close,
    changeView: (mutate) => coreRef.current.changeView(mutate),
    resync: (duration) => coreRef.current.resync(duration),
    get state() {
      return coreRef.current.state;
    },
  }));

  useEffect(() => () => coreRef.current.destroy(), []);

  if (typeof document === "undefined") return null; // RNF-3: nada de DOM en SSR

  return createPortal(
    <>
      {visible && <div ref={overlayEl} className={`wisspop-overlay ${overlayClass}`} onClick={close} />}

      {/* Vive FUERA del panel: el panel es overflow-hidden mientras anima, así
          que un texto de adentro quedaría recortado durante todo el viaje
          (design.md §6). */}
      {visible && <div ref={flyingEl} className={`wisspop-flying-text ${flyingTextClass}`} />}

      {visible && (
        <div
          ref={boxEl}
          className={`wisspop-box ${modalClass}`}
          style={boxStyle}
          data-theme={dataTheme}
          onClick={(e) => e.stopPropagation()}
        >
          <div ref={contentEl} className="wisspop-content">
            {typeof children === "function" ? children({ titleReady, close }) : children}
          </div>
          {closeButton && (
            <button
              type="button"
              className={`wisspop-close ${closeButtonClass}`}
              aria-label="Cerrar"
              onClick={close}
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

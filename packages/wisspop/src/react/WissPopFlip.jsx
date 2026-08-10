/**
 * Wrapper React de FlipModal — mismo contrato que WissPopFlip.vue.
 * Ver WissPopMorph.jsx para las notas generales de la adaptación a React.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { createPortal } from "react-dom";
import { createFlip } from "../core/flip.js";
import { useDomMount } from "./use-dom-mount.js";
import { soloDefinidos } from "../shared/solo-definidos.js";

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const WissPopFlip = forwardRef(function WissPopFlip(
  {
    open: isOpen = false,
    onOpen,
    onClose,
    onOpenChange,
    flipId,
    triggerClickable = true,
    /**
     * Velocidad y curva. Sin default propio: manda el core, así `setDefaults()`
     * puede fijar el ritmo global. Ver WissPopMorph.jsx.
     */
    duration,
    ease,
    overlayDuration,
    stagger,
    overlayClass = "",
    modalClass = "",
    closeButton = false,
    closeButtonClass = "",
    closeOnEscape = true,
    trapFocus = true,
    restoreFocus = true,
    lockScroll = false,
    ariaLabel = null,
    ariaLabelledby = null,
    /** render prop: (open) => ReactNode — lo que dispara el flip */
    trigger,
    /** render prop: (close) => ReactNode — el contenido del modal */
    children,
    /** Ver WissPopMorph.jsx: se reenvía al core, igual que `...coreOpts` de vanilla. */
    ...opcionesExtra
  },
  ref,
) {
  if (!flipId) throw new Error("[WissPopFlip] flipId es obligatorio");

  const { visible, mount, unmount } = useDomMount();
  const triggerEl = useRef(null);
  const boxEl = useRef(null);
  const overlayEl = useRef(null);
  const callbacks = useRef({ onOpen, onClose, onOpenChange });
  callbacks.current = { onOpen, onClose, onOpenChange };

  const coreRef = useRef(null);
  if (!coreRef.current) {
    coreRef.current = createFlip(
      {
        trigger: () => triggerEl.current,
        modal: () => boxEl.current,
        overlay: () => overlayEl.current,
      },
      {
        // Primero: lo que el wrapper cablea explícitamente siempre gana.
        ...opcionesExtra,
        flipId,
        ...soloDefinidos({ duration, ease, overlayDuration, stagger }),
        closeOnEscape,
        trapFocus,
        restoreFocus,
        lockScroll,
        ariaLabel,
        ariaLabelledby,
        mount,
        unmount,
        onState: (s) => {
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

  const open = () => coreRef.current.open();
  const close = () => coreRef.current.close();

  useImperativeHandle(ref, () => ({
    open,
    close,
    get state() {
      return coreRef.current.state;
    },
  }));

  useEffect(() => {
    if (isOpen) open();
    else close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => () => coreRef.current.destroy(), []);

  return (
    <div className="wisspop-flip-trigger-wrapper">
      {/*
        Sin `display:none` (ni ocultarlo con una clase condicional): eso lo
        saca del layout y la página de abajo salta mientras el modal está
        abierto (bug encontrado y arreglado esta sesión). El core lo oculta
        con `visibility: hidden`, que conserva su lugar.
      */}
      <div
        ref={triggerEl}
        className={`wisspop-flip-trigger${triggerClickable ? " wisspop-clickable" : ""}`}
        onClick={triggerClickable ? open : undefined}
      >
        {trigger?.(open)}
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          <>
            {visible && <div ref={overlayEl} className={`wisspop-overlay ${overlayClass}`} onClick={close} />}
            {visible && (
              <div
                ref={boxEl}
                className={`wisspop-box wisspop-flip-box ${modalClass}`}
                onClick={(e) => e.stopPropagation()}
              >
                {children?.(close)}
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
        )}
    </div>
  );
});

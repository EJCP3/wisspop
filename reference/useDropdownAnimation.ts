import { gsap } from 'gsap'

/**
 * GSAP morph-from-button animation para dropdowns del panel de filtros.
 * Imita el UiMorphModal: el panel "nace" del borde inferior del botón
 * y se "retrae" hacia él al cerrarse. Sin Teleport, sin conflictos.
 */
export function useDropdownAnimation() {
  const onEnter = (el: Element, done: () => void) => {
    // Inicia colapsado en el borde superior (donde está el botón)
    // y se expande hacia abajo con spring elástico
    gsap.fromTo(
      el,
      {
        scaleY: 0,
        scaleX: 0.88,
        opacity: 0,
        transformOrigin: 'top center',
      },
      {
        scaleY: 1,
        scaleX: 1,
        opacity: 1,
        duration: 0.35,
        ease: 'back.out(1.6)',
        clearProps: 'transform,opacity',
        onComplete: done,
      }
    )
  }

  const onLeave = (el: Element, done: () => void) => {
    // Se retrae hacia arriba (de vuelta al botón) y desaparece
    gsap.to(el, {
      scaleY: 0,
      scaleX: 0.9,
      opacity: 0,
      transformOrigin: 'top center',
      duration: 0.2,
      ease: 'power3.in',
      onComplete: done,
    })
  }

  return { onEnter, onLeave }
}

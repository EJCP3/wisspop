/**
 * WissPop core — Dropdown animation helper.
 *
 * Animación elástica de scaleY 0 -> 1 con spring de rebote (power2/back.out).
 * Ideal para select dropdowns y popovers ligeros.
 */
import { gsap } from "gsap";

/**
 * @param {Element} el
 * @param {() => void} [done]
 * @param {{ transformOrigin?: string, duration?: number, ease?: string }} [opts]
 */
export function enterDropdownAnimation(el, done, opts = {}) {
  const {
    transformOrigin = "top center",
    duration = 0.35,
    ease = "back.out(1.6)",
  } = opts;

  gsap.fromTo(
    el,
    {
      scaleY: 0,
      scaleX: 0.88,
      opacity: 0,
      transformOrigin,
    },
    {
      scaleY: 1,
      scaleX: 1,
      opacity: 1,
      duration,
      ease,
      clearProps: "transform,opacity",
      onComplete: done,
    },
  );
}

/**
 * @param {Element} el
 * @param {() => void} [done]
 * @param {{ transformOrigin?: string, duration?: number, ease?: string }} [opts]
 */
export function leaveDropdownAnimation(el, done, opts = {}) {
  const {
    transformOrigin = "top center",
    duration = 0.2,
    ease = "power3.in",
  } = opts;

  gsap.to(el, {
    scaleY: 0,
    scaleX: 0.9,
    opacity: 0,
    transformOrigin,
    duration,
    ease,
    onComplete: done,
  });
}

/**
 * WissPop core — gesto de arrastre para descartar.
 *
 * Vive acá y no dentro de `morph.js` porque el FlipModal necesita exactamente
 * el mismo bookkeeping de puntero con otra resolución al soltar: Morph tira el
 * panel fuera de pantalla —el gesto ya dice a dónde va—, y Flip lo devuelve al
 * trigger, porque su contrato es que la tarjeta ES el trigger y una copia
 * saliendo volando mientras el original reaparece en su sitio rompe justo eso.
 *
 * La lógica de puntero de acá abajo es la de `morph.js` sin un cambio: cada
 * rareza que tiene costó un bug y está comentada en su lugar.
 */
import { gsap } from "gsap";

/**
 * @param {object} cfg
 * @param {HTMLElement} cfg.zona Dónde se escucha el gesto y se captura el puntero.
 * @param {HTMLElement[]} [cfg.mueve] Qué se traslada. Por defecto, la propia `zona`.
 * @param {HTMLElement} [cfg.overlay] Se desvanece con el avance del arrastre.
 * @param {number} cfg.umbral px de recorrido para que cuente como descarte.
 * @param {() => boolean} cfg.estaAbierto
 * @param {(gesto: { dx: number, dy: number, dist: number }) => void} cfg.alDescartar
 * @returns {() => void} soltar los listeners
 */
export function activarGesto({ zona, mueve, overlay, umbral, estaAbierto, alDescartar }) {
  if (!zona) return () => {};
  const arrastrables = (mueve?.length ? mueve : [zona]).filter(Boolean);

  zona.classList.add("wisspop-swipe");
  let inicio = null;

  const abajo = (e) => {
    if (!estaAbierto()) return;
    // No robarle el gesto a lo que el usuario esté usando adentro.
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    inicio = { x: e.clientX, y: e.clientY, t: performance.now(), arrastrando: false, id: e.pointerId };
    // La captura del puntero se pide en `mover`, no acá — ver por qué abajo.
  };

  const mover = (e) => {
    if (!inicio) return;
    const dx = e.clientX - inicio.x;
    const dy = e.clientY - inicio.y;
    // Umbral antes de considerarlo arrastre: si no, un clic con un temblor de
    // 2px movería el panel y los botones de adentro dejarían de responder.
    if (!inicio.arrastrando && Math.hypot(dx, dy) < 8) return;
    if (!inicio.arrastrando) {
      inicio.arrastrando = true;
      // Recién ahora, con el arrastre ya confirmado, se captura el puntero.
      // Capturarlo desde el pointerdown (como estaba antes) retargetea
      // también el `click` de compatibilidad al contenedor una vez que hay
      // captura activa: cualquier botón de adentro —cerrar, guardar,
      // `data-close`— dejaba de recibir el clic mientras el gesto estaba
      // activo, aunque el usuario nunca hubiera arrastrado nada.
      try {
        zona.setPointerCapture(e.pointerId);
      } catch {}
    }
    gsap.set(arrastrables, { x: dx, y: dy });
    if (overlay) {
      const avance = Math.min(1, Math.hypot(dx, dy) / (umbral * 2));
      gsap.set(overlay, { opacity: 1 - avance });
    }
  };

  const volver = () => {
    gsap.to(arrastrables, { x: 0, y: 0, duration: 0.35, ease: "power3.out" });
    if (overlay) gsap.to(overlay, { opacity: 1, duration: 0.25 });
  };

  // El navegador se quedó con el puntero (drag nativo, gesto del sistema). No
  // hay gesto que interpretar: el panel vuelve a su lugar.
  const cancelado = () => {
    const arrastraba = inicio?.arrastrando;
    inicio = null;
    if (arrastraba) volver();
  };

  // Con `user-select: none` casi no ocurre, pero una imagen o un enlace
  // adentro siguen siendo arrastrables por defecto y robarían el gesto.
  const noArrastrarNativo = (e) => {
    if (inicio) e.preventDefault();
  };

  const arriba = (e) => {
    if (!inicio) return;
    const { arrastrando, t } = inicio;
    const dx = e.clientX - inicio.x;
    const dy = e.clientY - inicio.y;
    inicio = null;
    if (!arrastrando) return;

    const dist = Math.hypot(dx, dy);
    const velocidad = dist / Math.max(1, performance.now() - t);
    // La velocidad sola no alcanza: un temblor corto y rápido da una
    // velocidad altísima sobre 10px y descartaría el panel sin que el usuario
    // haya hecho un gesto. Se le exige además un recorrido mínimo.
    if (dist > umbral || (dist > 30 && velocidad > 0.6)) {
      alDescartar({ dx, dy, dist });
    } else {
      volver();
    }
  };

  zona.addEventListener("pointerdown", abajo);
  zona.addEventListener("pointermove", mover);
  zona.addEventListener("pointerup", arriba);
  zona.addEventListener("pointercancel", cancelado);
  zona.addEventListener("dragstart", noArrastrarNativo);
  return () => {
    zona.classList.remove("wisspop-swipe");
    zona.removeEventListener("pointerdown", abajo);
    zona.removeEventListener("pointermove", mover);
    zona.removeEventListener("pointerup", arriba);
    zona.removeEventListener("pointercancel", cancelado);
    zona.removeEventListener("dragstart", noArrastrarNativo);
  };
}

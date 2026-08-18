/**
 * Geometría final del panel. Pura y sin DOM a propósito: es la única parte con
 * ramas de verdad, así que vive sola y se testea con `node core/place.test.js`.
 */

/** @typedef {{ top:number, left:number, width:number, height:number, radius?:number }} Rect */
/** @typedef {{ w:number, h:number, top:number, left:number, radius:number }} Geom */

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

/**
 * Si el panel termina cubriendo al origen, hay que ocultar el origen: verlos a
 * los dos a la vez rompe la ilusión de que uno se convirtió en el otro. Si en
 * cambio queda anclado al lado (un dropdown bajo su botón), el origen tiene que
 * seguir visible.
 */
export const coversOrigin = (placement) =>
  placement === "center" ||
  placement === "origin" ||
  placement === "fullscreen" ||
  placement.startsWith("drawer-");

/**
 * Si la posición del panel depende de dónde está el origen, tiene que seguirlo
 * cuando la página scrollea: un panel anclado que se queda fijo se despega de
 * su botón y deja de leerse como suyo. Un `center` o un drawer no están atados
 * a nada, así que moverlos con el scroll sería lo raro.
 */
export const followsOrigin = (placement) =>
  placement !== "center" && placement !== "fullscreen" && !placement.startsWith("drawer-");

/**
 * `align` es la posición sobre el **eje cruzado**, no una dirección absoluta:
 * con el panel arriba o abajo el eje cruzado es horizontal, y al costado es
 * vertical. Por eso acepta los dos vocabularios — `left`/`top`/`start` pegan al
 * inicio y `right`/`bottom`/`end` al final — y cada uno se lee natural en su
 * colocación sin que haya dos opciones distintas que aprender.
 */
const INICIO = new Set(["left", "top", "start"]);
const FINAL = new Set(["right", "bottom", "end"]);

const enEjeCruzado = (align, inicioOrigen, tamOrigen, tamPanel) =>
  INICIO.has(align)
    ? inicioOrigen
    : FINAL.has(align)
      ? inicioOrigen + tamOrigen - tamPanel
      : inicioOrigen + tamOrigen / 2 - tamPanel / 2;

/**
 * @param {Rect} origin rect del elemento que abre
 * @param {{ w:number, h:number, radius:number }} size tamaño medido del contenido
 * @param {{ placement:string, align:string, gap:number, margin:number, mobileBreakpoint:number, fullscreenOnMobile:boolean }} opts
 * @param {number} vw
 * @param {number} vh
 * @returns {Geom}
 */
export function placeBox(origin, size, opts, vw, vh) {
  const { placement, align, gap, margin } = opts;

  // Fullscreen (PC o Móvil)
  if (placement === "fullscreen" || (opts.fullscreenOnMobile && vw < opts.mobileBreakpoint)) {
    return { top: 0, left: 0, w: vw, h: vh, radius: opts.radius ?? 0 };
  }
  // Drawer: pegado a un borde, ocupando todo el eje largo de ese borde. Ignora
  // `margin` a propósito — un cajón despegado del borde no es un cajón.
  if (placement.startsWith("drawer-")) {
    const lado = placement.slice(7);
    const acostado = lado === "top" || lado === "bottom";
    const w = acostado ? vw : Math.min(size.w, vw);
    const h = acostado ? Math.min(size.h, vh) : vh;
    return {
      w,
      h,
      radius: size.radius,
      top: lado === "bottom" ? vh - h : 0,
      left: lado === "right" ? vw - w : 0,
    };
  }

  let w = Math.min(size.w, vw - margin * 2);
  let h = Math.min(size.h, vh - margin * 2);
  let top;
  let left;

  if (placement === "center" || placement === "origin") {
    // `origin` crece en el lugar: el panel queda centrado sobre el centro del
    // botón en vez de irse al medio de la pantalla. El clamp de abajo lo mete
    // en la ventana si el botón está muy cerca de un borde.
    const enElLugar = placement === "origin";
    top = enElLugar ? origin.top + origin.height / 2 - h / 2 : (vh - h) / 2;
    left = enElLugar ? origin.left + origin.width / 2 - w / 2 : (vw - w) / 2;
  } else if (placement === "left" || placement === "right") {
    // Anclado al costado: el eje principal es horizontal, así que lo que se
    // acota al espacio libre es el ANCHO, y `align` alinea en vertical.
    const libre =
      placement === "left"
        ? origin.left - gap - margin
        : vw - (origin.left + origin.width + gap) - margin;
    w = Math.max(0, Math.min(w, libre));

    left = placement === "left" ? origin.left - w - gap : origin.left + origin.width + gap;
    top = enEjeCruzado(align, origin.top, origin.height, h);
  } else {
    // Anclado arriba o abajo. El panel no puede tapar al origen: se acota al
    // espacio libre de su lado.
    // ponytail: no hace flip al lado opuesto si no entra. Agregarlo cuando
    // aparezca un caso real de botón contra el borde con el panel del lado corto.
    const libre =
      placement === "top"
        ? origin.top - gap - margin
        : vh - (origin.top + origin.height + gap) - margin;
    h = Math.max(0, Math.min(h, libre));

    top = placement === "top" ? origin.top - h - gap : origin.top + origin.height + gap;
    left = enEjeCruzado(align, origin.left, origin.width, w);
  }

  return {
    w,
    h,
    radius: size.radius,
    top: clamp(top, margin, vh - h - margin),
    left: clamp(left, margin, vw - w - margin),
  };
}

// La estructura (position/z-index/overflow) no es decoración: sin ella la
// animación no funciona. Por eso el CSS entra acá y no queda a criterio del
// consumidor, que solo aporta colores y bordes vía `modalClass`.
import "../styles/wisspop.css";

export { default as WissPopMorph } from "./WissPopMorph.vue";
export { default as WissPopPill } from "./WissPopPill.vue";
export { default as WissPopFlip } from "./WissPopFlip.vue";
// DropdownPanel no tiene componente propio: son dos funciones que operan
// sobre un elemento ya existente, sin overlay ni mount/unmount.
export { enterDropdownAnimation, leaveDropdownAnimation } from "../core/dropdown.js";

// Ritmo global: fija los defaults para toda la app de una vez. Ver core/index.js.
export { setDefaults } from "../core/index.js";

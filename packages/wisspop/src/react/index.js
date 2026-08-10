// La estructura (position/z-index/overflow) no es decoración: sin ella la
// animación no funciona. Por eso el CSS entra acá y no queda a criterio del
// consumidor, que solo aporta colores y bordes vía `modalClass`.
import "../styles/wisspop.css";

export { WissPopMorph } from "./WissPopMorph.jsx";
export { WissPopPill } from "./WissPopPill.jsx";
export { WissPopFlip } from "./WissPopFlip.jsx";
// DropdownPanel no necesita un componente propio: son dos funciones que
// operan sobre un elemento ya existente, sin overlay ni mount/unmount — el
// mismo motivo por el que tampoco lo tiene el wrapper de Vue.
export { enterDropdownAnimation, leaveDropdownAnimation } from "../core/dropdown.js";
// Ritmo global: fija los defaults para toda la app de una vez. Ver core/index.js.
export { setDefaults } from "../core/index.js";

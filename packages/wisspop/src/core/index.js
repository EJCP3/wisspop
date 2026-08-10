export { createMorph, placeBox } from "./morph.js";
export { createFlip } from "./flip.js";
export { enterDropdownAnimation, leaveDropdownAnimation } from "./dropdown.js";

import { setDefaults as setMorphDefaults } from "./morph.js";
import { setDefaults as setFlipDefaults } from "./flip.js";

/**
 * Ritmo global. Fija los defaults de una vez para toda la app en vez de repetir
 * `duration`/`closeDuration` en cada componente:
 *
 *     import { setDefaults } from "wisspop";
 *     setDefaults({ duration: 0.8, closeDuration: 1 });
 *
 * Aplica a Morph y a Flip; cada uno toma solo las claves que conoce (`flip` no
 * tiene `closeDuration`, por ejemplo). Una prop puesta en el componente sigue
 * ganando: esto es el piso, no un candado.
 *
 * Llamalo antes de montar. Los paneles ya creados copiaron sus opciones y no
 * se enteran del cambio.
 */
export function setDefaults(overrides) {
  setMorphDefaults(overrides);
  setFlipDefaults(overrides);
}

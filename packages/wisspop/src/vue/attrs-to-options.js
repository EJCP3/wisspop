/**
 * Todo atributo que el componente NO declara como prop se reenvía al core tal
 * cual, igual que el `...coreOpts` del adaptador vanilla.
 *
 * Sin esto los wrappers enumeran a mano cada opción, y la lista se desincroniza
 * del core en silencio: `swipeToClose` y `fullscreenOnMobile` estuvieron
 * llegando a `undefined` en Vue y React mientras las demos los pasaban, así que
 * el gesto de arrastre y el modo pantalla-completa en móvil (RF-7) no existían
 * fuera de vanilla. Reenviar en vez de enumerar hace que eso no pueda repetirse
 * con la próxima opción que se agregue al core.
 *
 * Dos normalizaciones, porque `$attrs` entrega los atributos crudos:
 * - `swipe-to-close` → `swipeToClose`. Vue camelliza las PROPS, no los attrs.
 * - `swipe-to-close` sin valor llega como `""`, que en JS es falsy y el core
 *   leería como "desactivado". Un atributo presente y sin valor es `true`,
 *   igual que en HTML.
 *
 * Lo que no es una opción se descarta: `class`/`style` los maneja el consumidor
 * por `modalClass`/`overlayClass`, y los `onX` son listeners, no configuración.
 */
export function attrsToOptions(attrs) {
  const opciones = {};
  for (const [nombre, valor] of Object.entries(attrs)) {
    if (nombre === "class" || nombre === "style" || /^on[A-Z]/.test(nombre)) continue;
    const clave = nombre.replace(/-([a-z])/g, (_, letra) => letra.toUpperCase());
    opciones[clave] = valor === "" ? true : valor;
  }
  return opciones;
}

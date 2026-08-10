/** node --test src/vue/attrs-to-options.test.js */
import assert from "node:assert/strict";
import { test } from "node:test";
import { attrsToOptions } from "./attrs-to-options.js";

test("camelliza el nombre del atributo: Vue camelliza las props, no los attrs", () => {
  // `swipe-to-close` llegaba tal cual y el core lee `swipeToClose`, así que la
  // opción existía en el objeto y aun así no hacía nada.
  assert.deepEqual(attrsToOptions({ "swipe-to-close": true }), { swipeToClose: true });
  assert.deepEqual(attrsToOptions({ "fullscreen-on-mobile": true }), { fullscreenOnMobile: true });
  assert.deepEqual(attrsToOptions({ "swipe-threshold": 120 }), { swipeThreshold: 120 });
});

test("un atributo presente y sin valor es `true`, no `\"\"`", () => {
  // `<WissPopMorph swipe-to-close />` llega como `""`, que es falsy en JS: el
  // core lo leería como desactivado, justo al revés de lo que pidió el consumidor.
  assert.deepEqual(attrsToOptions({ "swipe-to-close": "" }), { swipeToClose: true });
});

test("respeta un `false` explícito en vez de convertirlo", () => {
  // `:hide-origin="false"` tiene que poder APAGAR algo que por default está
  // encendido; si se colara como `true` no habría forma de desactivarlo.
  assert.deepEqual(attrsToOptions({ "hide-origin": false }), { hideOrigin: false });
});

test("descarta lo que no es configuración del core", () => {
  // `class`/`style` son del consumidor vía modalClass/overlayClass, y los `onX`
  // son listeners: ninguno tiene sentido como opción del core.
  assert.deepEqual(
    attrsToOptions({ class: "foo", style: "color:red", onClick: () => {}, gap: 20 }),
    { gap: 20 },
  );
});

test("un nombre ya camelCase pasa intacto", () => {
  assert.deepEqual(attrsToOptions({ swipeToClose: true, margin: 24 }), { swipeToClose: true, margin: 24 });
});

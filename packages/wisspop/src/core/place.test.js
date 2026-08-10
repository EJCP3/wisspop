/** node core/place.test.js */
import assert from "node:assert/strict";
import { placeBox, followsOrigin, coversOrigin } from "./place.js";

// Los anclados siguen al origen cuando la página scrollea; los que no dependen
// de dónde está el botón se quedan quietos.
for (const p of ["top", "bottom", "left", "right", "origin"]) assert.ok(followsOrigin(p), p);
for (const p of ["center", "drawer-left", "drawer-top"]) assert.ok(!followsOrigin(p), p);
// Y el panel oculta al origen solo cuando lo tapa.
for (const p of ["center", "origin", "drawer-left"]) assert.ok(coversOrigin(p), p);
for (const p of ["top", "bottom", "left", "right"]) assert.ok(!coversOrigin(p), p);

const O = { placement: "bottom", align: "left", gap: 16, margin: 16, mobileBreakpoint: 640, fullscreenOnMobile: false };
const btn = { top: 100, left: 200, width: 120, height: 40 };
const size = { w: 300, h: 400, radius: 12 };
const at = (o, vw = 1000, vh = 800) => placeBox(btn, size, { ...O, ...o }, vw, vh);

// center: centrado exacto en ambos ejes
assert.deepEqual(at({ placement: "center" }), { w: 300, h: 400, radius: 12, top: 200, left: 350 });

// bottom: arranca bajo el borde inferior del botón, respetando gap
assert.equal(at({}).top, 156); // 100 + 40 + 16

// align se aplica sobre el rect del origen, no sobre la ventana
assert.equal(at({ align: "left" }).left, 200);
assert.equal(at({ align: "right" }).left, 20); // 200 + 120 - 300
assert.equal(at({ align: "center" }).left, 110); // 200 + 60 - 150

// top: se apoya sobre el borde superior del botón, con el mismo juego de `align`
assert.equal(at({ placement: "top", align: "left" }).left, 200);
assert.equal(at({ placement: "top", align: "right" }).left, 20);
assert.equal(at({ placement: "top", align: "center" }).left, 110);
assert.equal(at({ placement: "top", align: "left" }).top, 16); // acotado por margin

// --- anclado al costado: el eje principal es X y `align` alinea en vertical ---
const alCostado = (o, vw = 1000, vh = 800) =>
  placeBox(btn, { w: 200, h: 100, radius: 12 }, { ...O, ...o }, vw, vh);

// derecha: pegado al borde derecho del botón, respetando gap
assert.equal(alCostado({ placement: "right", align: "top" }).left, 336); // 200 + 120 + 16
// izquierda: el panel termina donde arranca el botón, menos gap
const izq = alCostado({ placement: "left", align: "top" });
assert.equal(izq.left + izq.w, 200 - 16);

// `align` sobre el eje vertical: inicio, centro y final del botón
assert.equal(alCostado({ placement: "right", align: "top" }).top, 100);
assert.equal(alCostado({ placement: "right", align: "bottom" }).top, 40); // 100 + 40 - 100
assert.equal(alCostado({ placement: "right", align: "center" }).top, 70); // 100 + 20 - 50

// los alias son el mismo eje cruzado, no direcciones absolutas
assert.deepEqual(
  alCostado({ placement: "right", align: "start" }),
  alCostado({ placement: "right", align: "top" }),
);
assert.deepEqual(at({ align: "start" }), at({ align: "left" }));
assert.deepEqual(at({ align: "end" }), at({ align: "right" }));

// al costado se acota el ANCHO al espacio libre, no el alto
assert.equal(alCostado({ placement: "right" }, 460, 800).w, 108); // 460 - (200+120+16) - 16
assert.equal(alCostado({ placement: "left" }, 1000, 800).w, 168); // 200 - 16 - 16

// RF-6: nunca se sale de la ventana por ningún lado
const tight = at({ align: "left" }, 1000, 300);
assert.ok(tight.top + tight.h <= 300 - 16, "se sale por abajo");
assert.equal(at({ align: "right" }, 1000, 800).left, 20);
assert.equal(placeBox({ ...btn, left: -50 }, size, { ...O }, 1000, 800).left, 16);

// el panel no tapa al origen: se acota al espacio libre de su lado
assert.equal(at({}, 1000, 400).h, 228); // 400 - (100+40+16) - 16
assert.equal(at({ placement: "top" }, 1000, 800).h, 68); // 100 - 16 - 16

// más ancho que la ventana → se acota a los márgenes
assert.equal(placeBox(btn, { w: 2000, h: 100, radius: 12 }, { ...O }, 1000, 800).w, 968);

// origin: crece en el lugar, compartiendo el centro con el botón
const chico = { w: 200, h: 100, radius: 12 };
const enElLugar = placeBox(btn, chico, { ...O, placement: "origin" }, 1000, 800);
assert.equal(enElLugar.top + enElLugar.h / 2, btn.top + btn.height / 2); // mismo centro Y
assert.equal(enElLugar.left + enElLugar.w / 2, btn.left + btn.width / 2); // mismo centro X
assert.deepEqual(enElLugar, { w: 200, h: 100, radius: 12, top: 70, left: 160 });
// a diferencia de `center`, NO se va al medio de la pantalla
assert.notDeepEqual(enElLugar, placeBox(btn, chico, { ...O, placement: "center" }, 1000, 800));
// ...pero sigue sin poder salirse: contra un borde se mete adentro con su margen
assert.equal(placeBox({ ...btn, top: 10 }, chico, { ...O, placement: "origin" }, 1000, 800).top, 16);
assert.equal(placeBox({ ...btn, left: 960 }, chico, { ...O, placement: "origin" }, 1000, 800).left, 784);
// un panel más alto que la ventana se acota igual que en `center`
assert.equal(at({ placement: "origin" }, 1000, 300).h, 268);

// drawer: pegado a su borde, ocupando el eje largo. Ignora align y margin.
assert.deepEqual(at({ placement: "drawer-left" }), { top: 0, left: 0, w: 300, h: 800, radius: 12 });
assert.deepEqual(at({ placement: "drawer-right" }), { top: 0, left: 700, w: 300, h: 800, radius: 12 });
assert.deepEqual(at({ placement: "drawer-top" }), { top: 0, left: 0, w: 1000, h: 400, radius: 12 });
assert.deepEqual(at({ placement: "drawer-bottom" }), { top: 400, left: 0, w: 1000, h: 400, radius: 12 });

// los verticales toman todo el ancho; los horizontales, todo el alto
assert.equal(at({ placement: "drawer-top" }).w, 1000);
assert.equal(at({ placement: "drawer-left" }).h, 800);
// el eje corto se acota a la ventana si el contenido es más grande
assert.equal(placeBox(btn, { w: 300, h: 900, radius: 12 }, { ...O, placement: "drawer-bottom" }, 1000, 800).h, 800);
assert.equal(placeBox(btn, { w: 1200, h: 400, radius: 12 }, { ...O, placement: "drawer-right" }, 1000, 800).w, 1000);
// el `align` no los toca: no hay eje cruzado que alinear
assert.deepEqual(at({ placement: "drawer-top", align: "end" }), at({ placement: "drawer-top", align: "start" }));

// RF-7: bajo el breakpoint ocupa toda la pantalla, sin radio
assert.deepEqual(at({ fullscreenOnMobile: true }, 375, 812), { top: 0, left: 0, w: 375, h: 812, radius: 0 });
// ...y sobre el breakpoint el flag no cambia nada
assert.deepEqual(at({ fullscreenOnMobile: true, placement: "center" }), at({ placement: "center" }));

console.log("ok");

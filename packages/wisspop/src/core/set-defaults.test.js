/** node --test src/core/set-defaults.test.js */
import assert from "node:assert/strict";
import { test } from "node:test";
import { setupDom } from "./dom-test-setup.js";

setupDom();
const { setDefaults } = await import("./index.js");
const { createFlip } = await import("./flip.js");

/**
 * El ritmo global se observa por dónde termina: un flip con `duration: 0`
 * cierra de una y llama a `unmount` en el acto, uno con duración real deja
 * una animación corriendo y no desmonta todavía. Es la señal más chica que
 * distingue "el default llegó" de "no llegó", sin depender de tiempo real.
 */
function armar() {
  document.body.innerHTML = "";
  const trigger = document.createElement("div");
  trigger.setAttribute("data-flip-id", "demo-card");
  document.body.append(trigger);
  const modal = document.createElement("div");
  modal.innerHTML = `<div data-flip-id="demo-card"></div>`;
  let desmontado = false;
  return {
    els: {
      trigger,
      modal,
      mount: () => document.body.append(modal),
      unmount: () => {
        desmontado = true;
        modal.remove();
      },
    },
    desmontado: () => desmontado,
  };
}

test("setDefaults fija el ritmo de los paneles que se creen después", async () => {
  const a = armar();
  setDefaults({ duration: 0 });
  const flip = createFlip(
    { trigger: a.els.trigger, modal: a.els.modal },
    { flipId: "demo", mount: a.els.mount, unmount: a.els.unmount },
  );

  await flip.open();
  await flip.close();
  // Sin el default global el core usaría 0.45 y el cierre seguiría animando.
  assert.equal(a.desmontado(), true, "el `duration: 0` global llegó al core sin pasarlo por opciones");

  setDefaults({ duration: 0.45 }); // dejarlo como estaba para el resto de la suite
});

test("una opción explícita le gana al default global", async () => {
  const a = armar();
  setDefaults({ duration: 0.45 });
  const flip = createFlip(
    { trigger: a.els.trigger, modal: a.els.modal },
    { flipId: "demo", duration: 0, mount: a.els.mount, unmount: a.els.unmount },
  );

  await flip.open();
  await flip.close();
  assert.equal(a.desmontado(), true, "el `duration: 0` de la llamada pisa al global de 0.45");
});

test("ignora claves que el core no conoce en vez de guardarlas sin efecto", () => {
  // Un nombre mal escrito quedaría ahí para siempre sin hacer nada, y el
  // consumidor creyendo que configuró algo.
  setDefaults({ duracion: 5, noExiste: true });
  const a = armar();
  const flip = createFlip(
    { trigger: a.els.trigger, modal: a.els.modal },
    { flipId: "demo", duration: 0, mount: a.els.mount, unmount: a.els.unmount },
  );
  assert.equal(flip.state, "closed");
});

test("setDefaults no toca los paneles ya creados", async () => {
  const a = armar();
  setDefaults({ duration: 0 });
  const flip = createFlip(
    { trigger: a.els.trigger, modal: a.els.modal },
    { flipId: "demo", mount: a.els.mount, unmount: a.els.unmount },
  );
  // El core copia sus opciones al crearse: cambiarlas ahora no lo alcanza.
  setDefaults({ duration: 0.45 });

  await flip.open();
  await flip.close();
  assert.equal(a.desmontado(), true, "sigue con el `0` que tenía al crearse");
});

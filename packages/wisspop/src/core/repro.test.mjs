import assert from "node:assert/strict";
import { test } from "node:test";
import { setupDom } from "./dom-test-setup.js";
setupDom();
const { gsap } = await import("gsap");
const { Flip } = await import("gsap/Flip");
gsap.registerPlugin(Flip);
const { createFlip } = await import("./flip.js");

function arrastrar(el, dx, dy) {
  const ev = (t, x, y) => { const e = new window.Event(t, { bubbles: true }); Object.assign(e, { clientX: x, clientY: y, pointerId: 1 }); return e; };
  el.dispatchEvent(ev("pointerdown", 0, 0));
  el.dispatchEvent(ev("pointermove", dx, dy));
  el.dispatchEvent(ev("pointerup", dx, dy));
}
function completarFlips() {
  const tls = new Set([...document.querySelectorAll("[data-flip-id]")].map((n) => n._flip).filter(Boolean));
  tls.forEach((tl) => tl.progress(1));
}

test("REPRO: sobrevive el transform del arrastre al cierre?", async () => {
  document.body.innerHTML = "";
  const trigger = document.createElement("div");
  trigger.setAttribute("data-flip-id", "demo-card");
  document.body.append(trigger);
  const modal = document.createElement("div");
  modal.innerHTML = `<div data-flip-id="demo-card"></div>`;
  const card = () => modal.querySelector('[data-flip-id="demo-card"]');

  trigger.getBoundingClientRect = () => ({ top: 100, left: 50, width: 80, height: 60, right: 130, bottom: 160 });

  const flip = createFlip(
    { trigger, modal },
    { flipId: "demo", duration: 0.3, swipeToClose: true, swipeThreshold: 90,
      mount: () => document.body.append(modal), unmount: () => modal.remove() },
  );

  await flip.open();
  completarFlips();
  console.log("  tras abrir      →", JSON.stringify(card().style.transform));

  arrastrar(modal, 150, 40);
  console.log("  tras arrastrar  →", JSON.stringify(card().style.transform), "| estado:", flip.state);
  await new Promise((r) => setTimeout(r, 60));
  completarFlips();
  await new Promise((r) => setTimeout(r, 10));
  console.log("  tras cerrar     →", JSON.stringify(card().style.transform), "| estado:", flip.state);
  console.log("  gsap x/y        →", gsap.getProperty(card(), "x"), gsap.getProperty(card(), "y"));
});

import { createModal, createFlipModal } from "wisspop/vanilla";

function resolveOrigin(btn) {
  const attr = btn.getAttribute("data-wisspop-origin");
  if (attr) {
    if (attr === "self") return btn;
    if (attr.startsWith("closest:")) return btn.closest(attr.slice(8)) || btn;
    return document.querySelector(attr) || btn;
  }
  return btn.closest(".search-filter-pill") || btn;
}

function resolveLabel(btn, origin) {
  const btnLabel = btn.getAttribute("data-wisspop-label");
  if (btnLabel) {
    if (btnLabel === "self") return origin;
    if (btnLabel.startsWith("closest:")) return btn.closest(btnLabel.slice(8)) || origin;
    return origin.querySelector(btnLabel) || document.querySelector(btnLabel) || btnLabel;
  }
  const originLabel = origin.getAttribute("data-wisspop-label");
  if (originLabel) {
    if (originLabel === "self") return origin;
    return origin.querySelector(originLabel) || originLabel;
  }
  return (
    origin.querySelector("[data-wisspop-label], .search-filter-input-wrap, .con-icono") ??
    (origin.children.length === 1 ? origin.firstElementChild : origin.textContent?.trim())
  );
}

function abrirModalAstro(modal, triggerBtn, conVuelo) {
  const origin = resolveOrigin(triggerBtn);
  modal._lastOrigin = origin;

  const origInput = origin.querySelector("input, textarea");
  const modalInput = modal.content?.querySelector("input, textarea");
  if (origInput && modalInput) {
    modalInput.value = origInput.value;
  }

  const payload = conVuelo ? resolveLabel(triggerBtn, origin) : undefined;
  modal.open(origin, payload);

  if (origInput && modalInput) {
    setTimeout(() => modalInput.focus(), 60);
  }
}

export function montarTemplate(tpl) {
  if (tpl._wisspop) return tpl._wisspop;

  const kind = tpl.dataset.wisspop || "morph";
  const { trigger: sel, ...opts } = JSON.parse(tpl.dataset.opts || "{}");
  const botones = sel ? [...document.querySelectorAll(sel)] : [];

  const modal =
    kind === "flip"
      ? createFlipModal({ ...opts, trigger: botones[0], content: tpl.innerHTML })
      : createModal({ ...opts, content: tpl.content });

  tpl._wisspop = modal;

  const raiz = kind === "flip" ? modal.box : modal.content;
  if (raiz) {
    raiz.addEventListener("click", (e) => {
      if (e.target.closest("[data-wisspop-close]")) {
        const modalInput = modal.content?.querySelector("input, textarea");
        const origInput = modal._lastOrigin?.querySelector("input, textarea");
        if (modalInput && origInput) {
          origInput.value = modalInput.value;
        }
        modal.close();
      }
    });
  }

  return modal;
}

function montar(kind) {
  const selector = kind ? `template[data-wisspop="${kind}"]` : `template[data-wisspop]`;
  document.querySelectorAll(selector).forEach((tpl) => {
    montarTemplate(tpl);
  });
}

let delegadoInstalado = false;

function asegurarDelegacionGlobal() {
  if (delegadoInstalado || typeof document === "undefined") return;
  delegadoInstalado = true;

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!target || typeof target.closest !== "function") return;

    const closeBtn = target.closest("[data-wisspop-close]");
    if (closeBtn) return;

    const triggerBtn = target.closest("[data-wisspop-trigger]");
    if (!triggerBtn) return;

    const modalId = triggerBtn.getAttribute("data-wisspop-trigger");
    if (!modalId) return;

    const tpl = document.querySelector(`template[data-id="${modalId}"]`);
    if (!tpl) return;

    const modal = montarTemplate(tpl);
    if (!modal) return;

    const opts = JSON.parse(tpl.dataset.opts || "{}");
    const kind = tpl.dataset.wisspop || "morph";
    const conVuelo = opts.flyingTextClass != null;

    if (kind === "flip") {
      modal.open();
    } else {
      abrirModalAstro(modal, triggerBtn, conVuelo);
    }
  });
}

export function initWissPop(kind) {
  asegurarDelegacionGlobal();
  montar(kind);

  if (typeof document !== "undefined") {
    document.addEventListener("astro:page-load", () => montar(kind), { once: false });
    document.addEventListener("astro:after-swap", () => montar(kind), { once: false });
  }
}

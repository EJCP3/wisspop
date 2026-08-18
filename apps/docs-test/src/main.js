import { createModal, createFlipModal, enterDropdownAnimation, leaveDropdownAnimation } from "wisspop/vanilla";
import "wisspop/styles/wisspop.css";

const $ = (sel) => document.querySelector(sel);
const menu = (items) => `<ul class="menu">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

/** Abre desde el botón y deja que cualquier `[data-close]` de adentro lo cierre. */
const wire = (btn, modal, label) => {
  btn.addEventListener("click", () => modal.open(btn, label));
  modal.content.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) modal.close();
  });
};

// --- Anclado a un botón ---------------------------------------------------

// Las seis combinaciones, cada una con su botón. El contenedor va centrado en la
// página para que las de costado tengan espacio a los dos lados.
const ANCLADOS = [
  { placement: "top", align: "start", etiqueta: "↑ inicio" },
  { placement: "top", align: "center", etiqueta: "↑ centro" },
  { placement: "top", align: "end", etiqueta: "↑ final" },
  { placement: "left", align: "center", etiqueta: "← izquierda" },
  { placement: "right", align: "center", etiqueta: "derecha →" },
  { placement: "bottom", align: "center", etiqueta: "↓ abajo" },
];

for (const { placement, align, etiqueta } of ANCLADOS) {
  const btn = document.createElement("button");
  btn.textContent = etiqueta;
  btn.dataset.placement = placement;
  btn.dataset.align = align;
  $("#matriz-anclado").append(btn);

  wire(
    btn,
    createModal({
      swipeToClose: true,
      content: menu(
        ["Más recientes", "Más antiguos", "Mayor monto"].map((o) => `<span data-close>${o}</span>`),
      ),
      modalClass: "panel",
      placement,
      align,
    }),
  );
}

// --- Botón circular -------------------------------------------------------

// El `+` del botón viaja hasta el `[data-wisspop-title]` del panel creciendo de
// 21px a 34px. Sin esto el botón se apaga y el panel crece, pero no hay nada
// que el ojo pueda seguir de un lado al otro.
wire(
  $("#btn-fab"),
  createModal({
    swipeToClose: true,
    content: `
      <div class="panel-body" style="width: 22rem">
        <h3><span data-wisspop-title>+</span> Nuevo movimiento</h3>
        <label>Concepto</label><input placeholder="Café" />
        <label>Monto</label><input placeholder="2500" />
        <button data-close>Guardar</button>
      </div>`,
    modalClass: "panel",
    flyingTextClass: "flying-icon",
    placement: "center",
    ease: "power3.out",
    // 0.35 era muy rápido para el salto de un círculo de 52px a un panel de
    // 352px: el viaje terminaba antes de que el ojo lo enganchara.
    duration: 0.65,
    closeDuration: 0.7,
    // El botón es un círculo de 52px: esto centra el glifo en su punto de
    // partida. Es el único número a ojo que queda — el aterrizaje se mide.
    labelOffsetX: 20,
  }),
  "+",
);

// --- Crecer en el lugar ---------------------------------------------------

// `closeButton: true` agrega una × propia flotando arriba a la derecha, sin
// escribir ni marcar nada — para cuando no querés armar tu propio botón.
wire(
  $("#btn-inline"),
  createModal({
    swipeToClose: true,
    closeButton: true,
    content: `
      <div class="panel-body" style="width: 20rem">
        <h3>Renombrar</h3>
        <label>Nombre</label><input placeholder="Supermercado" />
        <button data-close>Listo</button>
      </div>`,
    modalClass: "panel",
    placement: "origin",
  }),
);

// --- Drawer ---------------------------------------------------------------

for (const lado of ["left", "right", "top", "bottom"]) {
  const btn = document.createElement("button");
  btn.textContent = `drawer-${lado}`;
  $("#fila-drawers").append(btn);

  wire(
    btn,
    createModal({
      swipeToClose: true,
      content: menu(
        ["Inicio", "Movimientos", "Presupuestos", "Ajustes"].map(
          (o) => `<span data-close>${o}</span>`,
        ),
      ),
      // El eje corto lo fija el CSS; el largo lo llena el core solo.
      modalClass: `panel drawer drawer-${lado}`,
      placement: `drawer-${lado}`,
    }),
  );
}

// --- Cerrar con el gesto --------------------------------------------------

wire(
  $("#btn-swipe"),
  createModal({
    swipeToClose: true,
    content: `
      <div class="panel-body" style="width: 20rem">
        <h3>Arrastrame</h3>
        <p class="nota">Hacia cualquier lado, con el mouse o el dedo. Si soltás antes del
          umbral, vuelve solo.</p>
        <button data-close>O cerrame así</button>
      </div>`,
    modalClass: "panel",
    placement: "center",
  }),
);

// --- Formatos del elemento viajero ---------------------------------------

// Servida desde apps/docs/public/, que Vite publica en la raíz.
const AVATAR = "/gato.jpg";
$("#avatar").src = AVATAR;

// Iconos outline (Tabler): el trazo toma `currentColor`, el relleno va vacío.
const ico = (d) =>
  `<svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

const CORAZON = ico(
  "M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572",
);
const ESTRELLA = ico(
  "M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245",
);
const INFO = `<svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>`;

const panelFormato = (titulo, cuerpo) => `
  <div class="panel-body" style="width: 21rem">
    <h3>${titulo}</h3>
    <p class="nota">${INFO}<span>${cuerpo}</span></p>
    <button data-close>Cerrar</button>
  </div>`;

/** @param {(btn: HTMLElement) => string | Node} payload qué viaja */
const demoFormato = (btnSel, contenido, payload) => {
  const modal = createModal({
    swipeToClose: true,
    content: contenido,
    modalClass: "panel",
    flyingTextClass: "flying",
    placement: "center",
    ease: "power3.out",
    duration: 0.65,
    closeDuration: 0.7,
  });
  const btn = $(btnSel);
  btn.addEventListener("click", () => modal.open(btn, payload(btn)));
  modal.content.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) modal.close();
  });
};

// 1 · Solo texto — modo `text`: se interpolan font-size, line-height, peso y color.
demoFormato(
  "#btn-f-texto",
  panelFormato(
    "<span data-wisspop-title>Solo texto</span>",
    "No hay nodo que medir, así que el punto de partida sale de <code>labelOffsetX</code>.",
  ),
  () => "Solo texto",
);

// 2 · Texto con icono — sigue en modo `text`. El icono está medido en `em`, así
// que escala con el font-size y los dos viajan como una sola pieza.
demoFormato(
  "#btn-f-mixto",
  panelFormato(
    `<span data-wisspop-title class="con-icono">${CORAZON}<span>Me gusta</span></span>`,
    "El icono va en <code>em</code>: crece junto con el texto sin ninguna cuenta aparte.",
  ),
  (btn) => btn.querySelector(".con-icono"),
);

// 3 · Solo icono — un SVG no tiene texto, así que el core elige `box` solo y
// anima width/height en vez de font-size.
demoFormato(
  "#btn-f-icono",
  panelFormato(
    `<span data-wisspop-title class="ico-destino">${ESTRELLA}</span>`,
    "Sin texto que escalar, el core pasa a <code>box</code>: anima <code>width</code>/<code>height</code>.",
  ),
  (btn) => btn.querySelector("svg"),
);

// 4 · Solo imagen — mismo modo `box`. La miniatura se expande a la foto grande:
// el salto de tamaño es el que hace visible que es la misma imagen viajando.
demoFormato(
  "#btn-f-imagen",
  `<div class="panel-body" style="width: 21rem">
     <span data-wisspop-title class="foto-destino"><img src="${AVATAR}" alt="" /></span>
     <h3>No hace nada, HD</h3>
     <p class="nota">${INFO}<span>Despega desde el rect medido de la miniatura y aterriza en el
       tamaño del destino. Cambia de proporción en el camino y no se deforma:
       de eso se encarga <code>object-fit: cover</code>.</span></p>
     <button data-close>Cerrar</button>
   </div>`,
  (btn) => btn.querySelector("img"),
);

// --- FlipModal ------------------------------------------------------------

const cardTrigger = $("#card-flip-trigger");
if (cardTrigger) {
  const flipModal = createFlipModal({
    trigger: cardTrigger,
    flipId: "demo",
    closeButton: true,
    swipeToClose: true,
    // Sin modalClass: el "panel" (fondo, borde, sombra) va en el propio
    // div con data-flip-id="demo-card" más abajo, no en el wrapper .wisspop-box.
    // El wrapper no es un target de Flip — si el look vive ahí, aparece de
    // golpe en su posición final en vez de viajar con el resto.
    content: `
      <div data-flip-id="demo-card" class="panel" style="padding: 1.5rem; width: 24rem; max-width: 90vw;">
        <img data-flip-id="demo-img" src="${AVATAR}" style="width: 100%; height: 220px; object-fit: cover; border-radius: 0.75rem;" alt="" />
        <h3 data-flip-id="demo-title" style="margin-top: 1rem; font-size: 1.5rem;">Gato Viajero</h3>
        <p class="modal-fade-item-demo" style="margin-top: 0.5rem; color: #aaa; line-height: 1.4;">
          Esta foto y título viajaron directamente desde la tarjeta usando GSAP Flip. Conservan dimensiones reales y border-radius nítido en todo el recorrido.
        </p>
      </div>`,
  });

  cardTrigger.addEventListener("click", () => flipModal.open());
}

// --- Dropdown Panel -------------------------------------------------------

// Un botón por lado. `transformOrigin` ya era parámetro de enter/leave — solo
// faltaba exponerlo acá, como las seis combinaciones de "Anclado a un botón".
//
// La posición se mide del BOTÓN, no de porcentajes fijos: `.row` es
// `display: flex`, así que ocupa el ancho completo de la página aunque sus
// botones ocupen mucho menos — un `left: 110%` para "derecha" es 110% de esa
// fila entera, no del botón, y el panel aparecía lejos, flotando solo.
const GAP = 8;
const DROPDOWN_DIRS = {
  down: { origin: "top center", pos: (b) => ({ top: `${b.offsetTop + b.offsetHeight + GAP}px`, left: `${b.offsetLeft}px` }) },
  up: { origin: "bottom center", pos: (b, row) => ({ bottom: `${row.offsetHeight - b.offsetTop + GAP}px`, left: `${b.offsetLeft}px` }) },
  right: { origin: "left center", pos: (b) => ({ top: `${b.offsetTop}px`, left: `${b.offsetLeft + b.offsetWidth + GAP}px` }) },
  left: { origin: "right center", pos: (b, row) => ({ top: `${b.offsetTop}px`, right: `${row.offsetWidth - b.offsetLeft + GAP}px` }) },
};

const panelDropdown = $("#dropdown-demo-panel");
const filaDropdown = panelDropdown?.closest(".row");
let dropdownDir = null; // dirección abierta, o null si está cerrado

function closeDropdown() {
  const { origin } = DROPDOWN_DIRS[dropdownDir];
  dropdownDir = null;
  leaveDropdownAnimation(panelDropdown, () => (panelDropdown.style.display = "none"), {
    transformOrigin: origin,
  });
}

function openDropdown(dir, btn) {
  dropdownDir = dir;
  const { origin, pos } = DROPDOWN_DIRS[dir];
  Object.assign(panelDropdown.style, {
    top: "",
    bottom: "",
    left: "",
    right: "",
    ...pos(btn, filaDropdown),
    display: "block",
  });
  enterDropdownAnimation(panelDropdown, null, { transformOrigin: origin });
}

if (panelDropdown) {
  for (const dir of Object.keys(DROPDOWN_DIRS)) {
    const btn = $(dir === "down" ? "#btn-dropdown-demo" : `#btn-dropdown-demo-${dir}`);
    if (!btn) continue;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Mismo botón que ya está abierto: cierra. Otro botón: reabre para ese
      // lado directo, sin animación de salida — ya se está por reabrir.
      dropdownDir === dir ? closeDropdown() : openDropdown(dir, btn);
    });
  }

  document.addEventListener("click", (e) => {
    if (!dropdownDir || panelDropdown.contains(e.target)) return;
    if (e.target.closest("[data-dir]")) return; // lo maneja el listener del botón
    closeDropdown();
  });
}

// --- Texto viajero + alto reactivo ---------------------------------------

const campos = (vista) => `
  <label>Email</label><input placeholder="hola@ejemplo.com" />
  <label>Contraseña</label><input type="password" placeholder="••••••••" />
  ${vista === "signup" ? '<label>Repetir contraseña</label><input type="password" placeholder="••••••••" />' : ""}`;

const auth = createModal({
  swipeToClose: true,
  modalClass: "pill-panel",
  flyingTextClass: "flying",
  width: 540,
  radius: 40,
  originRadius: 999,
  fullscreenOnMobile: true,
  duration: 0.45,
  ease: "power3.inOut",
  closeDuration: 0.6,
  contentBlur: false,
});

let vista = "signup";
let error = false;

/**
 * El core no sabe cuándo tu vista terminó de renderizar — eso lo aporta cada
 * adaptador. Sin framework el render es síncrono, así que alcanza con pintar
 * antes de que `changeView` remida.
 */
const pintar = () => {
  auth.content.innerHTML = `
    <div class="pill-body">
      <h2 data-wisspop-title>${vista === "signup" ? "Crear cuenta" : "Iniciar sesión"}</h2>
      ${campos(vista)}
      ${error ? '<p class="error">Las contraseñas no coinciden.</p>' : ""}
      <button data-close>Continuar</button>
      <button class="switch" data-error>${error ? "Ocultar error" : "Mostrar un error (resync)"}</button>
      <button class="switch" data-vista>${vista === "signup" ? "Ya tengo cuenta" : "Quiero crear una cuenta"}</button>
    </div>`;
};

pintar();

auth.content.addEventListener("click", (e) => {
  // RF-4: el contenido cambió de alto sin cambiar de vista.
  if (e.target.closest("[data-error]")) {
    error = !error;
    pintar();
    auth.resync();
  }
  // RF-5: cambiar de vista sin cerrar. La mutación va primero y sin esperar la
  // animación: si GSAP no llegara a correr, el DOM correcto ya está montado.
  if (e.target.closest("[data-vista]")) {
    auth.changeView(() => {
      vista = vista === "signup" ? "login" : "signup";
      error = false;
      pintar();
    });
  }
});

// Una sola instancia, dos posiciones. El tercer argumento de `open()` son
// overrides para esa apertura nada más: `center` la manda al medio de la
// pantalla, `origin` la deja creciendo sobre el botón.
for (const placement of ["center", "origin"]) {
  const btn = $(`#btn-auth-${placement}`);
  btn.addEventListener("click", () => {
    vista = "signup";
    error = false;
    pintar();
    auth.open(btn, "Crear cuenta", { placement });
  });
}

auth.content.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) auth.close();
});

// --- Tipos de animación de contenido (contentAnimation) -------------------

const filaContentAnim = $("#fila-content-anim");
if (filaContentAnim) {
  const animDescriptions = {
    "slide-up": "Entrada suave desplazándose hacia arriba (+12px translateY con cubic-bezier).",
    "slide-down": "Entrada suave desplazándose hacia abajo (-12px translateY con cubic-bezier).",
    "scale": "Efecto de escala suave (scale 0.95 → 1.0) con transición de opacidad.",
    "fade": "Transición pura de opacidad progresiva (opacity 0 → 1).",
    "none": "El contenido se renderiza inmediatamente sin animación CSS interna.",
  };

  filaContentAnim.querySelectorAll("button[data-anim]").forEach((btn) => {
    const animType = btn.dataset.anim;
    const modal = createModal({
      swipeToClose: true,
      closeButton: true,
      placement: "center",
      contentAnimation: animType,
      modalClass: "panel",
      content: `
        <div class="panel-body" style="width: 22rem">
          <h3>Animación: <span class="tag-pill">${animType}</span></h3>
          <p class="nota">${INFO}<span>${animDescriptions[animType]}</span></p>
          <div style="padding: 0.75rem; background: var(--sunken); border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem;">
            <code>contentAnimation: "${animType}"</code>
          </div>
          <button data-close>Cerrar modal</button>
        </div>`,
    });

    btn.addEventListener("click", () => modal.open(btn));
    modal.content.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) modal.close();
    });
  });
}

// --- Cascada de elementos (contentStagger) ---------------------------------

const btnStagger = $("#btn-stagger-demo");
if (btnStagger) {
  const modalStagger = createModal({
    swipeToClose: true,
    closeButton: true,
    placement: "center",
    contentStagger: true,
    modalClass: "panel",
    content: `
      <div class="panel-body" style="width: 24rem">
        <h3>Efecto Cascada (Stagger)</h3>
        <p class="nota">${INFO}<span>Cada hijo entra con un delay escalonado de 30ms.</span></p>
        <div class="stagger-demo-list">
          <div class="stagger-item">
            <span>✨ Notificación del sistema</span>
            <span class="badge">Nuevo</span>
          </div>
          <div class="stagger-item">
            <span>📦 Paquete v0.1.9 publicado</span>
            <span class="badge">NPM</span>
          </div>
          <div class="stagger-item">
            <span>🚀 Optimización GPU 120 FPS</span>
            <span class="badge">Core</span>
          </div>
          <div class="stagger-item">
            <span>📱 Soporte móvil y táctil</span>
            <span class="badge">Móvil</span>
          </div>
          <div class="stagger-item">
            <span>⚡ Animación CSS desacoplada</span>
            <span class="badge">CSS</span>
          </div>
        </div>
        <div style="margin-top: 1rem;">
          <button data-close>Entendido</button>
        </div>
      </div>`,
  });

  btnStagger.addEventListener("click", () => modalStagger.open(btnStagger));
  modalStagger.content.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) modalStagger.close();
  });
}

// --- Curvas y Easing Personalizados (ease / closeEase) ---------------------

const filaEases = $("#fila-eases");
if (filaEases) {
  const easeDetails = {
    "back.out(1.7)": { desc: "Rebote con overshoot elástico al expandirse.", closeEase: "power3.in", dur: 0.65, closeDur: 0.35 },
    "power3.out": { desc: "Desaceleración suave, profesional y fluida.", closeEase: "power2.in", dur: 0.5, closeDur: 0.3 },
    "elastic.out(1, 0.75)": { desc: "Efecto resorte gomoso pronunciado.", closeEase: "power2.inOut", dur: 0.85, closeDur: 0.4 },
    "expo.out": { desc: "Aceleración inicial instantánea con frenada suave.", closeEase: "expo.in", dur: 0.55, closeDur: 0.3 },
  };

  filaEases.querySelectorAll("button[data-ease]").forEach((btn) => {
    const easeType = btn.dataset.ease;
    const config = easeDetails[easeType];

    const modal = createModal({
      swipeToClose: true,
      closeButton: true,
      placement: "center",
      ease: easeType,
      closeEase: config.closeEase,
      duration: config.dur,
      closeDuration: config.closeDur,
      modalClass: "panel",
      content: `
        <div class="panel-body" style="width: 23rem">
          <h3>Curva: <span class="tag-pill">${easeType}</span></h3>
          <p class="nota">${INFO}<span>${config.desc}</span></p>
          <div style="padding: 0.75rem; background: var(--sunken); border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem;">
            <div><code>ease: "${easeType}"</code></div>
            <div style="margin-top: 0.3rem;"><code>closeEase: "${config.closeEase}"</code></div>
          </div>
          <button data-close>Cerrar y ver closeEase</button>
        </div>`,
    });

    btn.addEventListener("click", () => modal.open(btn));
    modal.content.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) modal.close();
    });
  });
}

// --- Rendimiento Móvil y Pantalla Completa (fullscreenOnMobile) ------------

const btnMobilePerf = $("#btn-mobile-perf");
if (btnMobilePerf) {
  const modalMobile = createModal({
    swipeToClose: true,
    closeButton: true,
    placement: "center",
    fullscreenOnMobile: true,
    contentBlur: false,
    modalClass: "panel",
    content: `
      <div class="panel-body" style="width: 24rem; max-width: 100%;">
        <h3>Optimización Móvil (120 FPS)</h3>
        <p class="nota">${INFO}<span>En pantallas menores a 640px, este modal se abre a pantalla completa con aceleración por capa GPU nativa.</span></p>
        <ul style="font-size: 0.85rem; color: var(--muted); padding-left: 1.2rem; margin: 0.75rem 0 1.25rem;">
          <li><strong>GPU Layer Promotion:</strong> <code>transform: translateZ(0)</code></li>
          <li><strong>Layout Containment:</strong> <code>contain: layout paint</code></li>
          <li><strong>Dynamic VRAM:</strong> will-change liberado tras la animación</li>
          <li><strong>Gesture swipe:</strong> arrastre táctil para descartar</li>
        </ul>
        <button data-close>Cerrar modal</button>
      </div>`,
  });

  btnMobilePerf.addEventListener("click", () => modalMobile.open(btnMobilePerf));
  modalMobile.content.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) modalMobile.close();
  });
}

// --- Casos de uso avanzados con elemento viajero ---------------------------

// 1. Checkout y Suscripción (Flying Text + Stagger)
const btnCheckout = $("#btn-demo-checkout");
if (btnCheckout) {
  const modalCheckout = createModal({
    swipeToClose: true,
    closeButton: true,
    placement: "center",
    flyingTextClass: "flying",
    contentStagger: true,
    contentAnimation: "slide-up",
    ease: "power3.out",
    duration: 0.6,
    modalClass: "panel",
    content: `
      <div class="panel-body" style="width: 25rem">
        <h3 style="margin-bottom: 0.25rem;">🛍️ <span data-wisspop-title>Plan Pro — $29/mes</span></h3>
        <p class="nota" style="margin-bottom: 0.75rem;">${INFO}<span>Acceso ilimitado a todas las herramientas de animación.</span></p>
        
        <label>Método de pago preferido</label>
        <div class="payment-options">
          <div class="payment-card">💳 Tarjeta Crédito</div>
          <div class="payment-card">🍏 Apple Pay</div>
          <div class="payment-card">🅿️ PayPal</div>
          <div class="payment-card">⚡ Google Pay</div>
        </div>

        <label>Correo de facturación</label>
        <input type="email" value="alex@acme-design.studio" />

        <button style="width: 100%; background: var(--accent); color: #fff; font-weight: 700; padding: 0.75rem; border: none; border-radius: 10px; margin-top: 0.5rem;" data-close>
          Confirmar Suscripción ($29)
        </button>
      </div>`,
  });

  btnCheckout.addEventListener("click", () =>
    modalCheckout.open(btnCheckout, "Plan Pro — $29/mes"),
  );
  modalCheckout.content.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) modalCheckout.close();
  });
}

// 2. Invitar colaboradores (Flying Text + Scale + Elastic Ease)
const btnInvite = $("#btn-demo-invite");
if (btnInvite) {
  const modalInvite = createModal({
    swipeToClose: true,
    closeButton: true,
    placement: "center",
    flyingTextClass: "flying",
    contentAnimation: "scale",
    ease: "back.out(1.5)",
    duration: 0.55,
    modalClass: "panel",
    content: `
      <div class="panel-body" style="width: 23rem">
        <h3>👥 <span data-wisspop-title>Invitar colaboradores</span></h3>
        <p class="nota">${INFO}<span>Comparte acceso a tus componentes con tu equipo.</span></p>
        
        <label>Correo electrónico</label>
        <input type="email" placeholder="companero@empresa.com" />
        
        <label>Rol asignado</label>
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem;">
          <button style="flex: 1; padding: 0.4rem; font-size: 0.85rem; border-color: var(--accent); color: var(--accent);">Editor</button>
          <button style="flex: 1; padding: 0.4rem; font-size: 0.85rem;">Admin</button>
          <button style="flex: 1; padding: 0.4rem; font-size: 0.85rem;">Lector</button>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button data-close>Cancelar</button>
          <button style="background: var(--accent); color: #fff; font-weight: 600;" data-close>Enviar invitación</button>
        </div>
      </div>`,
  });

  btnInvite.addEventListener("click", () =>
    modalInvite.open(btnInvite, "Invitar colaboradores"),
  );
  modalInvite.content.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) modalInvite.close();
  });
}

// 3. Command Palette / Búsqueda (Flying Text + Slide Down + Trap Focus)
const btnSearch = $("#btn-demo-search");
if (btnSearch) {
  const modalSearch = createModal({
    swipeToClose: true,
    closeButton: true,
    placement: "center",
    flyingTextClass: "flying",
    contentAnimation: "slide-down",
    trapFocus: true,
    modalClass: "panel",
    content: `
      <div class="panel-body" style="width: 26rem">
        <h3 style="font-size: 0.95rem; color: var(--muted); margin-bottom: 0.5rem;">
          🔍 <span data-wisspop-title>Buscar comandos...</span>
        </h3>
        
        <input type="text" placeholder="Escribe un comando o archivo..." autofocus style="font-size: 1rem; padding: 0.75rem; border-radius: 10px;" />
        
        <div class="cmd-list">
          <div class="cmd-item" data-close>
            <span>📄</span>
            <span>Abrir <code>WissPopMorph.astro</code></span>
            <span class="tag-pill" style="margin-left: auto;">Reciente</span>
          </div>
          <div class="cmd-item" data-close>
            <span>✨</span>
            <span>Probar animación <code>contentStagger</code></span>
            <span class="tag-pill" style="margin-left: auto;">Acción</span>
          </div>
          <div class="cmd-item" data-close>
            <span>🎨</span>
            <span>Alternar modo oscuro del visor</span>
            <span class="tag-pill" style="margin-left: auto;">Tema</span>
          </div>
          <div class="cmd-item" data-close>
            <span>🚀</span>
            <span>Desplegar monorepo a producción</span>
            <span class="tag-pill" style="margin-left: auto;">Deploy</span>
          </div>
        </div>
      </div>`,
  });

  btnSearch.addEventListener("click", () =>
    modalSearch.open(btnSearch, "Buscar comandos..."),
  );
  modalSearch.content.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) modalSearch.close();
  });
}

// 4. Confirmación destructiva (Flying Text + Fade)
const btnDelete = $("#btn-demo-delete");
if (btnDelete) {
  const modalDelete = createModal({
    swipeToClose: true,
    closeButton: true,
    placement: "center",
    flyingTextClass: "flying",
    contentAnimation: "fade",
    ease: "power3.out",
    duration: 0.45,
    modalClass: "panel",
    content: `
      <div class="panel-body" style="width: 22rem">
        <h3 style="color: #dc2626;">🗑️ <span data-wisspop-title>Eliminar Proyecto</span></h3>
        <p style="font-size: 0.9rem; color: var(--muted); margin: 0.75rem 0 1.25rem; line-height: 1.4;">
          ¿Estás seguro de que deseas eliminar este proyecto? Esta acción destruirá todas las vistas y no se puede deshacer.
        </p>
        <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
          <button data-close>Cancelar</button>
          <button class="btn-danger" data-close>Sí, eliminar</button>
        </div>
      </div>`,
  });

  btnDelete.addEventListener("click", () =>
    modalDelete.open(btnDelete, "Eliminar Proyecto"),
  );
  modalDelete.content.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) modalDelete.close();
  });
}

// --- Modales a Pantalla Completa (100vw × 100vh) en PC y Móvil ------------

// 1. Dashboard Fullscreen estándar
const btnPcFullscreen = $("#btn-pc-fullscreen");
if (btnPcFullscreen) {
  const modalPcFs = createModal({
    placement: "fullscreen",
    contentAnimation: "scale",
    ease: "power3.out",
    duration: 0.5,
    closeButton: true,
    swipeToClose: true,
    modalClass: "fullscreen-modal",
    content: `
      <div style="display: flex; flex-direction: column; height: 100vh; width: 100vw; box-sizing: border-box; overflow-y: auto;">
        <header class="fs-nav" style="padding-right: 4rem;">
          <h2>🖥️ Panel de Control — 100% Pantalla Completa</h2>
          <span class="tag-pill">100vw × 100vh</span>
        </header>

        <main class="fs-container">
          <p class="lead">
            Este modal ocupa el 100% del ancho y alto de la pantalla (100vw × 100vh) en PC de escritorio y monitores de cualquier resolución.
          </p>

          <div class="fs-grid">
            <div class="fs-card">
              <div style="font-size: 0.85rem; color: var(--muted);">Peticiones / Seg</div>
              <div class="stat">14.2k</div>
              <div style="font-size: 0.8rem; color: #16a34a;">↑ +18.4% vs ayer</div>
            </div>
            <div class="fs-card">
              <div style="font-size: 0.85rem; color: var(--muted);">FPS de Render</div>
              <div class="stat">120 FPS</div>
              <div style="font-size: 0.8rem; color: #16a34a;">⚡ GPU Acelerada</div>
            </div>
            <div class="fs-card">
              <div style="font-size: 0.85rem; color: var(--muted);">Memoria VRAM</div>
              <div class="stat">0 MB</div>
              <div style="font-size: 0.8rem; color: var(--muted);">Liberada a "auto"</div>
            </div>
          </div>

          <div style="background: var(--sunken); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-top: 1.5rem;">
            <h3>Detalles de la configuración</h3>
            <pre><code>createModal({
  placement: "fullscreen",  // 100% viewport en PC y móvil
  contentAnimation: "scale",
  closeButton: true
}).open(boton);</code></pre>
          </div>

          <div style="margin-top: 2rem; display: flex; justify-content: flex-end;">
            <button data-close class="pill">Cerrar vista completa</button>
          </div>
        </main>
      </div>`,
  });

  btnPcFullscreen.addEventListener("click", () => modalPcFs.open(btnPcFullscreen));
  modalPcFs.content.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) modalPcFs.close();
  });
}

// 2. Experiencia Inmersiva Fullscreen con Texto Viajero (Pill)
const btnPcFsPill = $("#btn-pc-fullscreen-pill");
if (btnPcFsPill) {
  const modalPcFsPill = createModal({
    placement: "fullscreen",
    flyingTextClass: "flying",
    contentStagger: true,
    ease: "power3.out",
    duration: 0.6,
    closeButton: true,
    swipeToClose: true,
    modalClass: "fullscreen-modal",
    content: `
      <div style="display: flex; flex-direction: column; height: 100vh; width: 100vw; box-sizing: border-box; overflow-y: auto;">
        <header class="fs-nav" style="padding-right: 4rem;">
          <h2>🚀 <span data-wisspop-title>Experiencia Inmersiva</span></h2>
          <span class="tag-pill">GSAP Flying + Fullscreen</span>
        </header>

        <main class="fs-container">
          <div class="stagger-demo-list" style="margin-top: 1rem;">
            <div class="stagger-item" style="padding: 1.25rem;">
              <span>🌐 1. El botón de origen se expandió al 100% de la pantalla del monitor.</span>
              <span class="badge">Viewport 100vw</span>
            </div>
            <div class="stagger-item" style="padding: 1.25rem;">
              <span>✨ 2. El título voló desde el botón hasta el encabezado superior.</span>
              <span class="badge">GSAP Flying</span>
            </div>
            <div class="stagger-item" style="padding: 1.25rem;">
              <span>⚡ 3. Todas las tarjetas hijas entraron en cascada progresiva de 30ms.</span>
              <span class="badge">Stagger CSS</span>
            </div>
            <div class="stagger-item" style="padding: 1.25rem;">
              <span>🛡️ 4. Al cerrar, regresa limpiamente al botón original sin distorsiones.</span>
              <span class="badge">Morph Core</span>
            </div>
          </div>

          <div style="margin-top: 2.5rem; text-align: center;">
            <button data-close class="pill" style="font-size: 1.1rem; padding: 0.8rem 2rem;">
              Regresar al sitio
            </button>
          </div>
        </main>
      </div>`,
  });

  btnPcFsPill.addEventListener("click", () =>
    modalPcFsPill.open(btnPcFsPill, "Experiencia Inmersiva"),
  );
  modalPcFsPill.content.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) modalPcFsPill.close();
  });
}





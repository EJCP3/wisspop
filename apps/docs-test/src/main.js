import { createModal, createFlipModal, enterDropdownAnimation, leaveDropdownAnimation } from "wisspop/vanilla";

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


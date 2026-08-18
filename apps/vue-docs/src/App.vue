<template>
  <main class="page">
    <header>
      <h1>WissPop — Vue Docs</h1>
      <p class="lead">
        El panel no aparece de la nada: nace del elemento que lo abrió y vuelve a él al cerrarse.
      </p>
      <p class="note">
        Esta página está construida con componentes nativos de Vue 3 (<code>wisspop/vue</code>):
        <code>WissPopMorph</code>, <code>WissPopPill</code> y <code>WissPopFlip</code>.
      </p>
    </header>

    <!-- 1 · Anclado a un botón -->
    <section>
      <h2>Anclado a un botón</h2>
      <p class="hint">
        El panel nace del botón y se abre hacia el lado que le pidas. <code>align</code> es la
        posición sobre el <strong>eje cruzado</strong>: con el panel arriba o abajo alinea en
        horizontal, y al costado alinea en vertical. Por eso acepta los dos vocabularios —
        <code>left</code>/<code>top</code>/<code>start</code> pegan al inicio,
        <code>right</code>/<code>bottom</code>/<code>end</code> al final.
      </p>

      <div class="matriz">
        <button
          v-for="item in ANCLADOS"
          :key="item.placement + item.align"
          :ref="(el) => setAncladoRef(item.placement + item.align, el)"
          @click="openAnclado(item.placement, item.align)"
        >
          {{ item.etiqueta }}
        </button>
      </div>

      <p class="hint">
        Ninguno puede taparse a sí mismo ni salirse: el panel se acota al espacio libre de su
        lado —el alto si va arriba o abajo, el ancho si va al costado— y después al margen de
        la ventana.
      </p>

      <WissPopMorph
        v-model="ancladoOpen"
        :origin-ref="ancladoOrigin"
        :placement="ancladoPlacement"
        :align="ancladoAlign"
        modal-class="panel"
        swipe-to-close
      >
        <template #default="{ close }">
          <ul class="menu">
            <li @click="close">Más recientes</li>
            <li @click="close">Más antiguos</li>
            <li @click="close">Mayor monto</li>
          </ul>
        </template>
      </WissPopMorph>
    </section>

    <!-- 2 · Desde un botón circular -->
    <section>
      <h2>Desde un botón circular</h2>
      <p class="hint">
        El radio del origen se lee del CSS y se acota a la mitad del lado menor, así que un
        círculo se abre como círculo. <code>ease: "power3.out"</code> — sin overshoot, porque
        en un panel grande el rebote se lee como «salió más grande de lo que debía».
      </p>

      <div class="row">
        <button ref="fabBtnRef" class="round" @click="fabOpen = true">+</button>
      </div>

      <WissPopMorph
        v-model="fabOpen"
        :origin-ref="fabBtnRef"
        placement="center"
        ease="power3.out"
        :duration="0.65"
        modal-class="panel"
        swipe-to-close
      >
        <template #default="{ close }">
          <div class="panel-body" style="width: 22rem;">
            <h3><span data-wisspop-title>+</span> Nuevo movimiento</h3>
            <label>Concepto</label>
            <input placeholder="Café" />
            <label>Monto</label>
            <input placeholder="2500" />
            <button @click="close">Guardar</button>
          </div>
        </template>
      </WissPopMorph>
    </section>

    <!-- 3 · Crecer en el lugar -->
    <section>
      <h2>Crecer en el lugar</h2>
      <p class="hint">
        <code>placement: "origin"</code> — el panel comparte el centro con el botón y crece
        ahí mismo, sin viajar al medio de la pantalla. Útil cuando el botón ya está donde el
        usuario está mirando y moverlo rompería el hilo. Si el botón está pegado a un borde,
        el panel se mete en la ventana respetando el margen.
      </p>

      <div class="row">
        <button ref="inlineBtnRef" @click="inlineOpen = true">Renombrar</button>
      </div>

      <WissPopMorph
        v-model="inlineOpen"
        :origin-ref="inlineBtnRef"
        placement="origin"
        modal-class="panel"
        close-button
        swipe-to-close
      >
        <template #default="{ close }">
          <div class="panel-body" style="width: 20rem;">
            <h3>Renombrar</h3>
            <label>Nombre</label>
            <input placeholder="Supermercado" />
            <button @click="close">Listo</button>
          </div>
        </template>
      </WissPopMorph>
    </section>

    <!-- 4 · Drawer -->
    <section>
      <h2>Drawer</h2>
      <p class="hint">
        <code>drawer-left</code> · <code>drawer-right</code> · <code>drawer-top</code> ·
        <code>drawer-bottom</code> — pegado a su borde, ocupando todo el eje largo: los
        laterales toman el alto completo y los de arriba y abajo, el ancho completo. Ignoran
        <code>margin</code> a propósito, porque un cajón despegado del borde no es un cajón.
      </p>

      <div class="row">
        <button
          v-for="lado in ['left', 'right', 'top', 'bottom']"
          :key="lado"
          :ref="(el) => setDrawerBtnRef(lado, el)"
          @click="openDrawer(lado)"
        >
          drawer-{{ lado }}
        </button>
      </div>

      <WissPopMorph
        v-model="drawerOpen"
        :origin-ref="drawerOrigin"
        :placement="drawerPlacement"
        :modal-class="`panel drawer drawer-${drawerLado}`"
        swipe-to-close
      >
        <template #default="{ close }">
          <ul class="menu">
            <li @click="close">Inicio</li>
            <li @click="close">Movimientos</li>
            <li @click="close">Presupuestos</li>
            <li @click="close">Ajustes</li>
          </ul>
        </template>
      </WissPopMorph>
    </section>

    <!-- 5 · Texto viajero -->
    <section>
      <h2>Texto viajero</h2>
      <p class="hint">
        El label del botón sale a 14px, viaja por la pantalla creciendo, y aterriza justo
        encima del elemento marcado con <code>data-wisspop-title</code>, que en ese momento toma
        el relevo. El destino <strong>se mide</strong>: el título puede estar en cualquier
        parte del contenido y no hay ni un offset hardcodeado.
      </p>

      <div class="row">
        <h3>Modal center</h3>
        <button ref="authCenterRef" class="pill" @click="openAuth('center')">Crear cuenta</button>
        <h3>Modal origin</h3>
        <button ref="authOriginRef" class="pill" @click="openAuth('origin')">Crear cuenta</button>
      </div>

      <WissPopPill ref="authPillRef" modal-class="pill-panel">
        <template #default="{ titleReady, close }">
          <div class="pill-body">
            <h2 data-wisspop-title :style="{ opacity: titleReady ? 1 : 0 }">
              {{ authVista === 'signup' ? 'Crear cuenta' : 'Iniciar sesión' }}
            </h2>
            <label>Email</label>
            <input placeholder="hola@ejemplo.com" />
            <label>Contraseña</label>
            <input type="password" placeholder="••••••••" />
            <template v-if="authVista === 'signup'">
              <label>Repetir contraseña</label>
              <input type="password" placeholder="••••••••" />
            </template>
            <p v-if="authError" class="error">Las contraseñas no coinciden.</p>
            <button @click="close">Continuar</button>
            <button class="switch" @click="toggleAuthError">
              {{ authError ? 'Ocultar error' : 'Mostrar un error (resync)' }}
            </button>
            <button class="switch" @click="toggleAuthVista">
              {{ authVista === 'signup' ? 'Ya tengo cuenta' : 'Quiero crear una cuenta' }}
            </button>
          </div>
        </template>
      </WissPopPill>
    </section>

    <!-- 6 · Formatos del elemento viajero -->
    <section>
      <h2>Formatos del elemento viajero</h2>
      <p class="hint">
        Lo que viaja puede ser texto, un nodo, o las dos cosas. El core elige cómo escalarlo:
        con texto anima <code>font-size</code> y sin texto anima <code>width</code>/<code>height</code>.
      </p>

      <div class="row">
        <button ref="fTextoBtnRef" class="pill" @click="openFormat('texto')">Solo texto</button>
        <button ref="fMixtoBtnRef" class="pill" @click="openFormat('mixto')">
          <span class="con-icono">
            <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
            </svg>
            <span>Me gusta</span>
          </span>
        </button>
        <button ref="fIconoBtnRef" class="round" @click="openFormat('icono')">
          <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245" />
          </svg>
        </button>
        <button ref="fImagenBtnRef" class="avatar-btn" @click="openFormat('imagen')">
          <img src="/gato.jpg" alt="" />
        </button>
      </div>

      <WissPopMorph
        v-model="formatOpen"
        :origin-ref="formatOrigin"
        :label="formatLabel"
        placement="center"
        ease="power3.out"
        :duration="0.65"
        modal-class="panel"
        flying-text-class="flying"
        swipe-to-close
      >
        <template #default="{ close }">
          <div v-if="formatTipo === 'texto'" class="panel-body" style="width: 21rem;">
            <h3><span data-wisspop-title>Solo texto</span></h3>
            <p class="nota">
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
              <span>No hay nodo que medir, así que el punto de partida sale de <code>labelOffsetX</code>.</span>
            </p>
            <button @click="close">Cerrar</button>
          </div>

          <div v-else-if="formatTipo === 'mixto'" class="panel-body" style="width: 21rem;">
            <h3>
              <span data-wisspop-title class="con-icono">
                <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" /></svg>
                <span>Me gusta</span>
              </span>
            </h3>
            <p class="nota">
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
              <span>El icono va en <code>em</code>: crece junto con el texto sin ninguna cuenta aparte.</span>
            </p>
            <button @click="close">Cerrar</button>
          </div>

          <div v-else-if="formatTipo === 'icono'" class="panel-body" style="width: 21rem;">
            <h3>
              <span data-wisspop-title class="ico-destino">
                <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245" /></svg>
              </span>
            </h3>
            <p class="nota">
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
              <span>Sin texto que escalar, el core pasa a <code>box</code>: anima <code>width</code>/<code>height</code>.</span>
            </p>
            <button @click="close">Cerrar</button>
          </div>

          <div v-else-if="formatTipo === 'imagen'" class="panel-body" style="width: 21rem;">
            <span data-wisspop-title class="foto-destino"><img src="/gato.jpg" alt="" /></span>
            <h3>No hace nada, HD</h3>
            <p class="nota">
              <svg class="ico" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg>
              <span>Despega desde el rect medido de la miniatura y aterriza en el tamaño del destino.</span>
            </p>
            <button @click="close">Cerrar</button>
          </div>
        </template>
      </WissPopMorph>
    </section>

    <!-- 7 · Cerrar con el gesto -->
    <section>
      <h2>Cerrar con el gesto</h2>
      <p class="hint">
        <code>swipeToClose: true</code> — arrastrá el panel con el mouse o el dedo hacia
        cualquier lado, como una notificación de celular. Pasado el umbral se va para donde lo
        tiraste; si soltás antes, vuelve solo a su lugar.
      </p>

      <div class="row">
        <button ref="swipeBtnRef" @click="swipeOpen = true">Arrastrame para cerrar</button>
      </div>

      <WissPopMorph
        v-model="swipeOpen"
        :origin-ref="swipeBtnRef"
        placement="center"
        modal-class="panel"
        swipe-to-close
      >
        <template #default="{ close }">
          <div class="panel-body" style="width: 20rem;">
            <h3>Arrastrame</h3>
            <p class="nota">
              Hacia cualquier lado, con el mouse o el dedo. Si soltás antes del umbral, vuelve solo.
            </p>
            <button @click="close">O cerrame así</button>
          </div>
        </template>
      </WissPopMorph>
    </section>

    <!-- 8 · FlipModal — Elementos compartidos -->
    <section>
      <h2>FlipModal — Elementos compartidos</h2>
      <p class="hint">
        Los elementos con <code>data-flip-id</code> viajan del origen al modal conservando su identidad visual.
      </p>

      <div class="row">
        <WissPopFlip flip-id="demo" close-button swipe-to-close>
          <template #trigger="{ open }">
            <div
              data-flip-id="demo-card"
              class="card-demo"
              style="cursor: pointer; padding: 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 1rem; width: 16rem;"
              @click="open"
            >
              <img data-flip-id="demo-img" src="/gato.jpg" style="width: 100%; height: 100px; object-fit: cover; border-radius: 0.5rem;" alt="" />
              <h3 data-flip-id="demo-title" style="margin-top: 0.5rem; font-size: 1.1rem;">Gato Viajero</h3>
              <p class="trigger-fade-item-demo" style="font-size: 0.85rem; color: #888;">Clic para expandir detalle</p>
            </div>
          </template>

          <template #modal="{ close }">
            <div data-flip-id="demo-card" class="panel" style="padding: 1.5rem; width: 24rem; max-width: 90vw;">
              <img data-flip-id="demo-img" src="/gato.jpg" style="width: 100%; height: 220px; object-fit: cover; border-radius: 0.75rem;" alt="" />
              <h3 data-flip-id="demo-title" style="margin-top: 1rem; font-size: 1.5rem;">Gato Viajero</h3>
              <p class="modal-fade-item-demo" style="margin-top: 0.5rem; color: #aaa; line-height: 1.4;">
                Esta foto y título viajaron directamente desde la tarjeta usando GSAP Flip.
              </p>
              <!-- Marcado como contenido secundario: no existe en el trigger, así
                   que sin esto sobra dentro de la tarjeta chica y cuelga fuera
                   de ella durante todo el vuelo. -->
              <button class="modal-fade-item-demo" style="margin-top: 1rem;" @click="close">Cerrar</button>
            </div>
          </template>
        </WissPopFlip>
      </div>
    </section>

    <!-- 9 · DropdownPanel — Despliegue elástico -->
    <section>
      <h2>DropdownPanel — Despliegue elástico</h2>
      <p class="hint">
        Animación elástica ligera con <code>enterDropdownAnimation</code> y <code>leaveDropdownAnimation</code>.
      </p>

      <div ref="dropdownRowRef" class="row" style="position: relative;">
        <button ref="ddDownBtn" data-dir="down" @click="toggleDropdownDir('down', ddDownBtn)">↓ Abajo</button>
        <button ref="ddUpBtn" data-dir="up" @click="toggleDropdownDir('up', ddUpBtn)">↑ Arriba</button>
        <button ref="ddRightBtn" data-dir="right" @click="toggleDropdownDir('right', ddRightBtn)">→ Derecha</button>
        <button ref="ddLeftBtn" data-dir="left" @click="toggleDropdownDir('left', ddLeftBtn)">← Izquierda</button>

        <div ref="dropdownPanelRef" class="panel" style="display: none; position: absolute; padding: 0.75rem 1rem; z-index: 50;">
          <ul class="menu" style="margin: 0; padding: 0; list-style: none;">
            <li @click="closeDropdown">Opción 1</li>
            <li @click="closeDropdown">Opción 2</li>
            <li @click="closeDropdown">Opción 3</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 10 · Scroll con el panel abierto -->
    <section>
      <h2>Scroll con el panel abierto</h2>
      <p class="hint">
        Depende de si la posición del panel depende del origen. Los anclados
        (<code>top</code>, <code>bottom</code>, <code>left</code>, <code>right</code>,
        <code>origin</code>) <strong>siguen al botón</strong> al scrollear.
      </p>
    </section>

    <!-- 11 · Alto reactivo -->
    <section>
      <h2>Alto reactivo</h2>
      <p class="hint">
        Los botones dentro del modal de arriba ejercitan lo difícil:
        <code>resync()</code> reajusta el alto cuando aparece un error, y
        <code>changeView()</code> cambia de vista sin cerrar.
      </p>
    </section>
  </main>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from "vue";
import {
  WissPopMorph,
  WissPopPill,
  WissPopFlip,
  enterDropdownAnimation,
  leaveDropdownAnimation,
} from "wisspop/vue";

// --- Section 1: Anclados ---
const ANCLADOS = [
  { placement: "top", align: "start", etiqueta: "↑ inicio" },
  { placement: "top", align: "center", etiqueta: "↑ centro" },
  { placement: "top", align: "end", etiqueta: "↑ final" },
  { placement: "left", align: "center", etiqueta: "← izquierda" },
  { placement: "right", align: "center", etiqueta: "derecha →" },
  { placement: "bottom", align: "center", etiqueta: "↓ abajo" },
];

const ancladoOpen = ref(false);
const ancladoPlacement = ref("bottom");
const ancladoAlign = ref("center");
const ancladoOrigin = ref(null);
const ancladoRefs = ref({});

function setAncladoRef(key, el) {
  if (el) ancladoRefs.value[key] = el;
}

async function openAnclado(placement, align) {
  if (ancladoOpen.value) {
    ancladoOpen.value = false;
    await nextTick();
  }
  ancladoPlacement.value = placement;
  ancladoAlign.value = align;
  ancladoOrigin.value = ancladoRefs.value[placement + align];
  await nextTick();
  ancladoOpen.value = true;
}

// --- Section 2: FAB ---
const fabOpen = ref(false);
const fabBtnRef = ref(null);

// --- Section 3: Inline Origin ---
const inlineOpen = ref(false);
const inlineBtnRef = ref(null);

// --- Section 4: Drawer ---
const drawerOpen = ref(false);
const drawerPlacement = ref("drawer-left");
const drawerLado = ref("left");
const drawerOrigin = ref(null);
const drawerBtnRefs = ref({});

function setDrawerBtnRef(lado, el) {
  if (el) drawerBtnRefs.value[lado] = el;
}

async function openDrawer(lado) {
  if (drawerOpen.value) {
    drawerOpen.value = false;
    await nextTick();
  }
  drawerLado.value = lado;
  drawerPlacement.value = `drawer-${lado}`;
  drawerOrigin.value = drawerBtnRefs.value[lado];
  await nextTick();
  drawerOpen.value = true;
}

// --- Section 5: Auth Pill ---
const authPillRef = ref(null);
const authCenterRef = ref(null);
const authOriginRef = ref(null);
const authVista = ref("signup");
const authError = ref(false);

function openAuth(placement) {
  authVista.value = "signup";
  authError.value = false;
  const btn = placement === "center" ? authCenterRef.value : authOriginRef.value;
  authPillRef.value?.open(btn, "Crear cuenta", { placement });
}

function toggleAuthVista() {
  authPillRef.value?.changeView(() => {
    authVista.value = authVista.value === "signup" ? "login" : "signup";
    authError.value = false;
  });
}

function toggleAuthError() {
  authError.value = !authError.value;
  authPillRef.value?.resync();
}

// --- Section 6: Formatos del elemento viajero ---
const formatOpen = ref(false);
const formatOrigin = ref(null);
const formatTipo = ref("texto");
/** Qué viaja: un string o el nodo real del botón, que el core clona. */
const formatLabel = ref(null);
const fTextoBtnRef = ref(null);
const fMixtoBtnRef = ref(null);
const fIconoBtnRef = ref(null);
const fImagenBtnRef = ref(null);

function openFormat(tipo) {
  formatTipo.value = tipo;
  let btn = fTextoBtnRef.value;
  if (tipo === "mixto") btn = fMixtoBtnRef.value;
  if (tipo === "icono") btn = fIconoBtnRef.value;
  if (tipo === "imagen") btn = fImagenBtnRef.value;
  formatOrigin.value = btn;
  // Un nodo montado trae su propio rect, así que el despegue es exacto y no
  // hace falta adivinarlo con `labelOffsetX` (solo el caso de texto suelto).
  formatLabel.value =
    tipo === "texto"
      ? "Solo texto"
      : tipo === "mixto"
        ? btn.querySelector(".con-icono")
        : tipo === "icono"
          ? btn.querySelector("svg")
          : btn.querySelector("img");
  formatOpen.value = true;
}

// --- Section 7: Swipe ---
const swipeOpen = ref(false);
const swipeBtnRef = ref(null);

// --- Section 9: Dropdown ---
const dropdownRowRef = ref(null);
const dropdownPanelRef = ref(null);
const ddDownBtn = ref(null);
const ddUpBtn = ref(null);
const ddRightBtn = ref(null);
const ddLeftBtn = ref(null);
let dropdownDir = null;

const GAP = 8;
const DROPDOWN_DIRS = {
  down: { origin: "top center", pos: (b) => ({ top: `${b.offsetTop + b.offsetHeight + GAP}px`, left: `${b.offsetLeft}px` }) },
  up: { origin: "bottom center", pos: (b, row) => ({ bottom: `${row.offsetHeight - b.offsetTop + GAP}px`, left: `${b.offsetLeft}px` }) },
  right: { origin: "left center", pos: (b) => ({ top: `${b.offsetTop}px`, left: `${b.offsetLeft + b.offsetWidth + GAP}px` }) },
  left: { origin: "right center", pos: (b, row) => ({ top: `${b.offsetTop}px`, right: `${row.offsetWidth - b.offsetLeft + GAP}px` }) },
};

function closeDropdown() {
  const panel = dropdownPanelRef.value;
  if (!panel || !dropdownDir) return;
  const { origin } = DROPDOWN_DIRS[dropdownDir];
  dropdownDir = null;
  leaveDropdownAnimation(panel, () => (panel.style.display = "none"), { transformOrigin: origin });
}

function openDropdown(dir, btn) {
  const panel = dropdownPanelRef.value;
  const row = dropdownRowRef.value;
  if (!panel || !row || !btn) return;

  dropdownDir = dir;
  const { origin, pos } = DROPDOWN_DIRS[dir];
  Object.assign(panel.style, {
    top: "",
    bottom: "",
    left: "",
    right: "",
    ...pos(btn, row),
    display: "block",
  });
  enterDropdownAnimation(panel, null, { transformOrigin: origin });
}

function toggleDropdownDir(dir, btn) {
  if (dropdownDir === dir) closeDropdown();
  else openDropdown(dir, btn);
}

function handleDocClick(e) {
  const panel = dropdownPanelRef.value;
  if (!dropdownDir || !panel || panel.contains(e.target)) return;
  if (e.target.closest("[data-dir]")) return;
  closeDropdown();
}

onMounted(() => document.addEventListener("click", handleDocClick));
onBeforeUnmount(() => document.removeEventListener("click", handleDocClick));
</script>

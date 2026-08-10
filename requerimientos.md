# WissPop — Requerimientos

---

## Dependencias

| Paquete | Versión | Obligatorio | Para qué |
|---|---|---|---|
| `gsap` | ≥ 3.12 | Sí | Todo el motor de animación |
| `gsap/Flip` | (viene con gsap) | Solo para FlipModal | Transiciones de elemento compartido |

**Nada más.** Sin librería de iconos, sin sistema de diseño, sin utilidades CSS. Los
componentes de MisPesos usan `<Icon>` de `@nuxt/icon` y clases de Tailwind/DaisyUI, pero eso
es del *consumidor* — al portar, esos usos salen del core y quedan como slots o clases que
el consumidor pasa.

**Peer dependencies según wrapper:**
- Vue: `vue` ≥ 3.4
- React: `react` ≥ 18, `react-dom` ≥ 18 (por `createPortal`)

---

## Requerimientos funcionales

### RF-1 · Animación anclada al origen ✅
El panel debe arrancar con el rect (posición, tamaño, border-radius) del elemento que lo
abre, y volver a él al cerrarse. Si el origen se movió mientras el panel estaba abierto, el
cierre usa su posición actual, no la guardada.

### RF-2 · Origen flexible ✅
`open()` acepta un `HTMLElement`, un selector CSS, o un `Rect` literal
(`{ top, left, width, height }`) para el caso sin botón visible.

### RF-3 · Medición automática del destino ✅
El tamaño final se mide del contenido real. Prohibido pedirle al consumidor que declare
alturas fijas.

### RF-4 · Alto reactivo al contenido ✅
Si el contenido cambia de alto con el panel abierto (aparece un error, cambia de sub-vista),
el panel se ajusta con una animación corta, sin cerrarse.

### RF-5 · Cambio de vista interno ✅
`changeView(mutate)` permite reemplazar el contenido del panel sin cerrarlo, con un
fade-through corto. El cambio de estado se aplica **antes** de la animación: si la animación
no llegara a correr, el DOM correcto ya está montado.

### RF-6 · Posicionamiento ✅
`placement`: `top` · `bottom` · `left` · `right` · `origin` · `center` · `drawer-left`.
Los cuatro primeros anclan al origen; `origin` crece en el lugar, compartiendo su centro.
`align` es la posición sobre el **eje cruzado** (horizontal si el panel va arriba o abajo,
vertical si va al costado): `start`/`left`/`top` · `center` · `end`/`right`/`bottom`.
`gap`: distancia en px al elemento origen.
El panel no puede salirse de la ventana: se acota con un margen mínimo de 16–20px.

### RF-7 · Responsive ✅
Debajo del breakpoint móvil (640px por defecto), los modales grandes ocupan el ancho
completo, con `border-radius` 0 o solo en las esquinas superiores según si llegan o no al
borde inferior.

### RF-8 · Texto viajero (PillModal) ✅
El label del botón viaja hasta el elemento marcado con `data-wisspop-title`, interpolando
posición y `font-size`. El destino se mide, nunca se hardcodea.

### RF-9 · Elementos compartidos (FlipModal) ✅
Varios elementos marcados con `data-flip-id` viajan del trigger al modal manteniendo
identidad visual. Elementos secundarios pueden entrar/salir con fade escalonado.

### RF-10 · API imperativa y declarativa ✅
- Declarativa: `v-model` / prop `open` para los casos simples.
- Imperativa: `open()` / `close()` por ref, para cuando el trigger se decide en runtime.

---

## Requerimientos no funcionales

### RNF-1 · Sin fugas de estilo ✅
Al cerrar, todos los estilos inline que dejó GSAP se limpian. El panel cerrado no intercepta
clics ni ocupa espacio.

### RNF-2 · Reentrada segura ✅
Un clic durante la animación no dispara una segunda transición. Mientras anima, el panel
lleva `pointer-events: none` y las llamadas a `open`/`close` se ignoran.

### RNF-3 · SSR ✅
Los componentes deben poder renderizarse en servidor sin tocar `window`, `document` ni GSAP.
Toda la medición y animación ocurre después del montaje en cliente.

### RNF-4 · Sin saltos visuales ✅
Ningún frame donde el panel aparezca en una posición o tamaño intermedio equivocado. En
particular: nada de saltos al terminar la animación por limpiar estilos inline.

### RNF-5 · Rendimiento ✅
Se animan propiedades que el navegador puede componer bien. Donde se anima layout
(`width`/`height`, necesario para que el `border-radius` no se deforme), se declara
`will-change` y se mantienen las duraciones cortas (≤ 0.7s).

### RNF-6 · Tamaño ✅
El core, sin contar GSAP, debe quedar por debajo de ~8 KB minificado. Si crece más que eso
es señal de que se le metió lógica que pertenece al consumidor.

---

## Accesibilidad — completado en Core y Wrappers

| # | Requisito | Estado |
|---|---|---|
| A11Y-1 | `Escape` cierra el panel | ✅ `closeOnEscape: true` en el core |
| A11Y-2 | Foco entra al panel al abrir y vuelve al trigger al cerrar | ✅ `restoreFocus: true` + entrada de foco al abrir |
| A11Y-3 | Trampa de foco mientras está abierto | ✅ `trapFocus: true` en el core |
| A11Y-4 | `role="dialog"` + `aria-modal` + `aria-labelledby` | ✅ inyección automática en el DOM |
| A11Y-5 | `prefers-reduced-motion`: saltar a la geometría final sin animar | ✅ en el core |
| A11Y-6 | Scroll del `body` bloqueado mientras hay un modal abierto | ✅ `lockScroll: true` con compensación de scrollbar |

---

## Soporte de navegadores y entornos

- `ResizeObserver` — Chrome 64+, Firefox 69+, Safari 13.1+
- `Teleport` / `createPortal` — según framework
- **Astro**: ✅ Totalmente compatible en SSR y cliente. Se puede usar directamente con `wisspop/vanilla` dentro de bloques `<script>` de Astro, o mediante islas UI (`client:load`/`client:visible`) usando `wisspop/vue` o `wisspop/react`.
- Sin `View Transitions API`: se evita a propósito por soporte irregular. Toda la animación
  es GSAP, que funciona igual en todos lados.

Sin soporte para IE ni navegadores sin `ResizeObserver`.

---

## Alcance — lo que queda afuera

- Estilos, temas, colores, tipografía → del consumidor
- Sistema de toasts / notificaciones → otra cosa
- Gestión de estado global de modales (stack, z-index automático) → el consumidor decide
- Animaciones de página o de ruta → otra cosa
- Drag para cerrar en móvil → posible después, no es del alcance inicial

---

## Estado actual

| Pieza | Estado |
|---|---|
| Monorepo pnpm + build | ✅ `pnpm build` emite ESM + CJS + `.d.ts` + `styles.css` |
| Core sin framework | ✅ `src/core/morph.js` + `place.js` — un solo motor para Morph y Pill |
| Adaptador vanilla | ✅ `createModal` arma y monta el DOM. Sirve también para Astro |
| Wrapper Vue | ✅ `WissPopMorph`, `WissPopPill`, `WissPopFlip`. Verificado en navegador contra `apps/docs` |
| Wrapper React | ✅ `WissPopMorph`, `WissPopPill`, `WissPopFlip` (`src/react/*.jsx`, `createPortal` + `useImperativeHandle`). Verificado en navegador contra `apps/react-docs` — real, no escrito a ciegas |
| CSS propio | ✅ `src/styles/wisspop.css`, ~30 líneas de estructura. La librería ya no arrastra Tailwind |
| apps/docs | ✅ HTML + CSS plano, sin framework. Demos vivas de los 4 casos y banco de pruebas |
| apps/react-docs | ✅ Vite + React, banco de pruebas del wrapper de React contra el core real |
| FlipModal | ✅ Portado al core (`src/core/flip.js`), adaptador Vanilla (`createFlipModal`), Vue (`WissPopFlip.vue`) y React (`WissPopFlip.jsx`) |
| DropdownPanel | ✅ Helper de animación elástica portado (`src/core/dropdown.js`) e integrado en Vanilla/Vue/React (mismas funciones, sin componente propio) |
| Tests | ✅ `node --test` (jsdom): `place.test.js` (geometría pura) + `dropdown.test.js`, `flip.test.js`, `morph.test.js` — estado, RNF-1/RNF-2, A11Y-1 a A11Y-4, RF-1, RF-5, design.md §4. La sensación/timing de la animación se sigue viendo a mano en docs. Encontraron y arreglaron 2 bugs reales: `radius` del origen pisado por `textMetrics` en `readOrigin()` (morph.js), y remanente inline de `padding`/`border-radius` que ni `clearProps` limpia en FlipModal (flip.js) |
| Accesibilidad | ✅ Integración nativa A11Y-1 a A11Y-6 en core, vanilla y Vue wrappers |
| Docs | ✅ Estos tres archivos + `packages/wisspop/README.md` |

---

## Orden sugerido

1. ~~Extraer `core/`~~ ✅
2. ~~Reescribir los wrappers de Vue encima del core~~ ✅
3. ~~Cerrar la deuda de accesibilidad (A11Y-1 a A11Y-6)~~ ✅
4. ~~Portar FlipModal y DropdownPanel~~ ✅
5. ~~Wrapper de React~~ ✅ — se armó `apps/react-docs` primero (banco de pruebas real,
   no un proyecto de un consumidor externo) y se verificó ahí, no a ciegas.


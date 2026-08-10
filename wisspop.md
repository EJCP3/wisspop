# WissPop

Mini-librería de modales, dropdowns y selects con **animaciones ancladas al origen**:
el panel no aparece de la nada, *nace del elemento que lo abrió* y vuelve a él al cerrarse.

---

## El problema que resuelve

Un modal normal aparece con un fade o un scale desde el centro de la pantalla. Funciona,
pero rompe la continuidad visual: el usuario hace clic en un botón *acá* y aparece un panel
*allá*, sin relación espacial entre ambos.

wissPop mantiene esa relación. El panel arranca exactamente con el tamaño, la posición y
el border-radius del botón que lo abrió, y crece hasta su forma final. Al cerrarse hace el
camino inverso. El ojo sigue el objeto y no pierde el hilo de dónde estaba.

Es la misma idea detrás de las transiciones de elemento compartido de Material Design o de
las apertura de apps en iOS, pero implementada para la web y sin depender del soporte
todavía irregular de la View Transitions API.

---

## Qué incluye

| Componente | Animación | Cuándo usarlo |
|---|---|---|
| **MorphModal** | La caja crece desde el rect del botón hasta su tamaño final; el contenido entra después con fade + blur | Dropdowns, menús, drawers, paneles anclados a un botón |
| **PillModal** | Igual que Morph, pero además el **texto del botón viaja** hasta convertirse en el título del panel | Modales de auth, formularios donde el label del botón *es* el título |
| **FlipModal** | Transición FLIP real: varios elementos individuales (imagen, texto, badges) viajan del trigger al modal manteniendo identidad | Cards que se expanden a detalle, galerías |
| **DropdownPanel** | El panel se despliega con `scaleY 0→1` y rebote elástico desde el borde del botón | Selects, filtros, menús de opciones |

---

## Cómo se ve en uso

### MorphModal — el caso base

```vue
<button ref="btn">Filtros</button>

<WissPopMorph
  v-model="abierto"
  :origin-ref="btn"
  placement="bottom"
  align="right"
>
  <FiltrosPanel />
</WissPopMorph>
```

El panel nace del botón `Filtros`, se posiciona debajo alineado a la derecha, y al cerrar
se retrae hacia él. En React es el mismo patrón, con `open`/`onClose` en vez de `v-model`:

```jsx
const btnRef = useRef(null);
const [abierto, setAbierto] = useState(false);

<button ref={btnRef} onClick={() => setAbierto(true)}>Filtros</button>

<WissPopMorph open={abierto} onClose={() => setAbierto(false)} originRef={btnRef.current} placement="bottom" align="right">
  {({ close }) => <FiltrosPanel onDone={close} />}
</WissPopMorph>
```

### PillModal — con texto viajero

```vue
<button id="cta-registro">Crear cuenta</button>

<WissPopPill ref="modal">
  <template #default="{ titleReady }">
    <h2 data-wisspop-title :class="titleReady ? 'opacity-100' : 'opacity-0'">
      Crear cuenta
    </h2>
    <form>…</form>
  </template>
</WissPopPill>
```

```js
modal.value.open(document.getElementById('cta-registro'), 'Crear cuenta')
```

El texto "Crear cuenta" sale del botón a 14px, viaja por la pantalla creciendo hasta 30px
y aterriza justo encima del `<h2>`, que en ese momento se hace visible y toma el relevo.
El `data-wisspop-title` le dice a la librería dónde tiene que aterrizar — no hay offsets
hardcodeados.

---

## Cómo funciona por dentro

Tres ideas sostienen toda la librería:

### 1. Medir el destino antes de animar

No se puede animar hacia un tamaño que no se conoce. Antes de arrancar, la librería:

1. Monta el panel fuera de pantalla, a su ancho final, con `height: auto`.
2. Lee el alto real que toma el contenido.
3. Lee dónde cae el `[data-wisspop-title]` con la geometría final aplicada.
4. Recién entonces mueve la caja al botón y arranca la animación.

Medir en vez de usar constantes es lo que permite que el mismo componente sirva para un
dropdown de 200px y un formulario de 646px, y que siga funcionando cuando cambia el
diseño del contenido.

### 2. La geometría es un objeto plano, no el DOM

GSAP no anima el elemento directamente. Anima un objeto `{ w, h, top, left, radius }`, y en
cada frame ese objeto se vuelca al `style` del elemento. Parece un rodeo innecesario, pero
es lo que evita que el framework y GSAP se peleen por el mismo atributo (ver
[design.md](design.md) para el detalle).

### 3. El contenido y la caja se animan por separado

La caja crece rápido (0.3–0.45s). El contenido entra después, con un retraso proporcional,
para que termine de revelarse justo cuando la caja termina de crecer. Si entraran a la vez,
el contenido se vería deformado mientras la caja todavía está tomando forma.

---

## Soporte de frameworks

El objetivo es un **core sin framework** (JS puro + GSAP) con wrappers finos encima:

```
wisspop/                        ← monorepo pnpm
├─ packages/wisspop/
│  └─ src/
│     ├─ core/    ← toda la lógica: medir, animar, observar. Sin Vue, sin React.
│     │  ├─ place.js   geometría pura, sin DOM ni GSAP (por eso se testea sin navegador)
│     │  └─ morph.js   el motor
│     ├─ vue/     ← wrapper: Teleport + refs, delega al core
│     ├─ react/   ← wrapper: createPortal + useImperativeHandle, delega al core
│     └─ styles/  ← solo estructura: position, z-index, overflow
├─ apps/docs/         ← demos vivas (vanilla/Vue); también el banco de pruebas
└─ apps/react-docs/   ← demos vivas del wrapper de React; su propio banco de pruebas
```

El core recibe elementos del DOM y devuelve `{ open, close, changeView, resync, destroy }`.
Los wrappers solo montan el DOM, le pasan los nodos al core y exponen la API al padre.

Tres puntos de extensión y nada más — son los que hacen que el core no sea de nadie:

- **`els` acepta getters** (`box: () => ref.value`), no solo elementos. Por eso el core se
  puede crear antes de que el DOM exista, que es lo que lo hace seguro en SSR.
- **`mount()` / `unmount()`** — el wrapper monta y espera su propio ciclo de render
  (`nextTick` en Vue; en React, un hook —`useDomMount()`— que espera al `useEffect`
  posterior al commit, no `flushSync`: eso revienta si `open()` se dispara desde
  dentro de un ciclo de vida de React, como el propio watcher del prop `open`).
  El core no tiene forma de saber cuál es.
- **`onGeom(g)`** — dónde volcar la geometría. Sin él escribe `box.style`; con él, el
  framework sigue siendo el único que escribe el style (ver [design.md](design.md) §2).

Estado actual: ver [requerimientos.md](requerimientos.md).

---

## Lo que WissPop NO hace

- **No es un sistema de diseño.** No trae estilos, colores ni tipografía. Vos le pasás las
  clases del panel; la librería solo se ocupa del movimiento.
- **Sí maneja foco y accesibilidad** — trampa de foco, `Escape`, `role`/`aria-*` y
  `prefers-reduced-motion` vienen del core, no hay que cablearlos a mano (ver
  [requerimientos.md](requerimientos.md), sección A11Y).
- **No reemplaza a `<dialog>`.** Si solo necesitás un modal que aparezca, `<dialog>` nativo
  es más simple y ya trae foco y backdrop. WissPop es para cuando la *animación anclada*
  es el punto.

---

## Origen

Extraída de [MisPesos](../MisPesos), donde estos patrones ya corren en producción en ~12
pantallas. Los comentarios del código original documentan una buena cantidad de bugs sutiles
que costaron encontrar (medición que llegaba tarde, estilos pisados entre framework y GSAP,
matching equivocado de elementos en FLIP). Esos hallazgos están recogidos en
[design.md](design.md) — son la parte de la librería que más caro salió aprender.

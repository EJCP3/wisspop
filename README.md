# WissPop

Modales, dropdowns y drawers con **animaciones ancladas al origen**: el panel no aparece de la nada, nace del elemento que lo abrió y vuelve a él al cerrarse.

Un motor core agnóstico de alto rendimiento escrito en JS Vanilla + GSAP, con adaptadores nativos para **Astro**, **Vue 3**, **React 18/19** y **Vanilla JS**.

---

## Tipos de Modales y Cuándo Usar Cada Uno

| Componente | Tipo de Animación | Cuándo Usarlo | Reglas y Elementos |
| :--- | :--- | :--- | :--- |
| **`WissPopMorph`** | La caja física nace del botón y se expande/transforma hacia su destino (`placement="origin"` o anclado). | Dropdowns, menús contextuales, drawers laterales, mini-modales de confirmación o aviso. | **NO usa texto volador.** La caja hace todo el morph físico. |
| **`WissPopPill`** | La caja se expande y el **texto/icono del botón vuela** hacia `[data-wisspop-title]`. | Modales de formularios principales, login/auth, calculadoras donde la etiqueta del botón se convierte en el título. | Requiere `[data-wisspop-title]` en el modal y opcionalmente `data-wisspop-label` en el botón. |
| **`WissPopFlip`** | Transición FLIP completa de múltiples elementos compartidos (imágenes, títulos, badges) entre tarjeta y vista de detalle. | Galerías de productos, cards interactivas que se expanden a pantalla completa. | Requiere atributos `data-flip-id="id-unico"` coincidentes en el trigger y en el modal. |

---

## Características

- **Animación anclada al origen**: Arranca con la posición, tamaño y `border-radius` del elemento disparador y retorna dinámicamente a su posición actual al cerrar.
- **Medición dinámica**: Mide automáticamente el contenido real fuera de pantalla. Prohibido requerir alturas fijas.
- **Texto e icono viajero (PillModal)**: El texto del botón despega, flota e interpola su escala hasta aterrizar en el título del modal (`data-wisspop-title`).
- **Elementos compartidos (FlipModal)**: Elementos con `data-flip-id` viajan entre el disparador y el modal conservando identidad visual.
- **Posicionamiento inteligente**: 6 posiciones ancladas, modo `origin` (crece en el lugar), drawers laterales/verticales y acotado automático contra los bordes de la ventana.
- **Descarte por gesto (Swipe to Close)**: Arrastre táctil o de mouse para descartar el modal hacia cualquier dirección.
- **Accesibilidad nativa (WAI-ARIA)**: Focus trap confinado, tecla `Escape`, restauración de foco al origen, bloqueo de scroll en body y respeto a `prefers-reduced-motion`.
- **Soporte View Transitions**: Compatible de forma nativa con Astro `<ClientRouter />` y recarga idempotente.

---

## Estructura del Monorepo

```text
wisspop/
├── packages/
│   └── wisspop/           # Código fuente de la librería (Core, Vanilla, Astro, Vue, React)
└── apps/
    ├── docs/              # Sitio oficial de documentación interactiva (Astro)
    ├── docs-astro/        # Testbed nativo de Astro
    ├── vue-docs/          # Aplicación demo y testbed de Vue 3
    └── react-docs/        # Aplicación demo y testbed de React 18/19
```

---

## Instalación

```bash
pnpm add wisspop gsap
# o con npm / yarn
npm install wisspop gsap
```

### Importación de CSS Obligatoria

```js
import 'wisspop/styles.css';
```

---

## Guía de Buenas Prácticas y Errores Comunes

### 1. Aplica estilos en `modalClass` (Evita la Doble Caja)
Wisspop anima directamente su propio elemento contenedor `.wisspop-box` (modifica `width`, `height`, `borderRadius`, `top` y `left` con GSAP). Si colocas un `<div>` interno con borde, fondo, redondeo y sombra, habrá dos cajas compitiendo y se producirá un salto visual.

```astro
<!-- [INCORRECTO] Doble caja que causa saltos -->
<WissPopMorph id="mi-modal" placement="origin">
  <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl p-5">
    <h3>Contenido</h3>
  </div>
</WissPopMorph>

<!-- [CORRECTO] Los estilos viven en modalClass -->
<WissPopMorph 
  id="mi-modal" 
  placement="origin" 
  modalClass="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl"
  closeButton={true}
  swipeToClose={true}
>
  <div class="p-5" style="width: min(24rem, calc(100vw - 2rem));">
    <h3>Contenido</h3>
  </div>
</WissPopMorph>
```

### 2. No mezcles `flyingTextClass` en `WissPopMorph`
`flyingTextClass` y `data-wisspop-title` son exclusivos de **`WissPopPill`**. En `WissPopMorph`, usa encabezados normales `<h3>` sin `data-wisspop-title`.

### 3. Define un ancho en el contenido interior
Para que GSAP mida con precisión la geometría final de la caja antes de animar, el cuerpo interno debe tener un ancho medible (ej: `style="width: min(24rem, calc(100vw - 2rem));"` o `w-80 max-w-[calc(100vw-2rem)]`).

### 4. Fondos armónicos en el botón disparador (`backgroundColor`)
WissPop interpola automáticamente el `backgroundColor` computado del disparador hacia el modal al abrir y de regreso al cerrar. Si el botón tiene un color muy saturado o translúcido (ej. `bg-amber-500/10`), todo el modal se teñirá de amarillo al encogerse. Mantén el fondo del botón en un tono armónico/neutro y usa el color llamativo en iconos o insignias internas.

### 5. Sombras responsivas en pantalla completa móvil
Clases como `shadow-2xl` fuerzan el cálculo de 50px de desenfoque rasterizado que no es visible en bordes de `100vw`. Usa sombras responsivas: `class="shadow-none sm:shadow-2xl"`.

### 6. Usa `h-full` en lugar de `min-h-[100dvh]` dentro del slot
WissPop ya calcula y ajusta la altura exacta de la caja; usar `100dvh` fuerza consultas redundantes al viewport dinámico móvil. Usa `class="h-full sm:h-auto flex flex-col justify-between"`.

---

## ⚡ Rendimiento Móvil (60-120 FPS) y Aislamiento de Capa

WissPop está diseñado para garantizar animaciones a 60-120 FPS sin saturar la CPU o GPU de dispositivos móviles:
* **GPU Layer Promotion**: `.wisspop-box` se promociona a su propia capa de composición (`transform: translateZ(0)` y `backface-visibility: hidden`).
* **Contención de Layout (`contain: layout paint`)**: El reflow de la interpolación queda encapsulado y no recalcula las capas DOM exteriores.
* **Gestión Dinámica de VRAM (`will-change`)**: Activación de `will-change` únicamente durante las transiciones activas y reseteo inmediato a `"auto"` al completarse.
* **Suavizado Automático de Curvas en Viewport Móvil**: Sustitución dinámica de curvas elásticas (`back.out`) por `power3.out` cuando se abre en pantalla completa móvil (`fullscreenOnMobile`), evitando desbordamientos y parpadeos en el viewport.
* **`contentBlur: false` por Defecto**: Máxima fluidez eliminando filtros pesados de convolución en tiempo real durante la interpolación de dimensiones.

---

## Ejemplos de Uso

### Astro (Nativo)

```astro
---
import { WissPopMorph, WissPopPill } from 'wisspop/astro';
import 'wisspop/styles.css';
---

<!-- Morph Modal para menú o panel -->
<button data-wisspop-trigger="filtros-modal" class="btn">Filtros</button>

<WissPopMorph 
  id="filtros-modal" 
  placement="bottom" 
  align="center"
  modalClass="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl"
  swipeToClose={true}
>
  <div class="p-6" style="width: min(22rem, calc(100vw - 2rem));">
    <h3 class="font-bold text-lg text-zinc-900 dark:text-zinc-100">Filtros</h3>
    <p class="text-sm text-zinc-500 mt-1">Selecciona los criterios de búsqueda.</p>
    <button data-wisspop-close class="btn mt-4 w-full">Aplicar</button>
  </div>
</WissPopMorph>
```

### Configuración en Astro (`astro.config.mjs`)

Para asegurar que Vite procese correctamente los módulos en SSR:

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['wisspop']
    }
  },
});
```

### Vue 3

```vue
<script setup>
import { ref } from 'vue';
import { WissPopMorph } from 'wisspop/vue';
import 'wisspop/styles.css';

const btn = ref(null);
const abierto = ref(false);
</script>

<template>
  <button ref="btn" @click="abierto = true">Abrir Modal</button>

  <WissPopMorph 
    v-model="abierto" 
    :origin-ref="btn" 
    placement="bottom" 
    align="center"
    modalClass="panel"
  >
    <template #default="{ close }">
      <div class="panel-body" style="width: min(22rem, calc(100vw - 2rem));">
        <p>Contenido Vue...</p>
        <button @click="close">Cerrar</button>
      </div>
    </template>
  </WissPopMorph>
</template>
```

### React 18 / 19

```jsx
import { useRef, useState } from 'react';
import { WissPopMorph } from 'wisspop/react';
import 'wisspop/styles.css';

export function Demo() {
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button ref={btnRef} onClick={() => setOpen(true)}>Abrir Modal</button>
      <WissPopMorph 
        open={open} 
        onClose={() => setOpen(false)} 
        originRef={btnRef.current}
        placement="bottom"
        align="center"
        modalClass="panel"
      >
        {({ close }) => (
          <div className="panel-body" style={{ width: 'min(22rem, calc(100vw - 2rem))' }}>
            <p>Contenido React...</p>
            <button onClick={close}>Cerrar</button>
          </div>
        )}
      </WissPopMorph>
    </>
  );
}
```

### Vanilla JS

```js
import { createModal } from 'wisspop/vanilla';
import 'wisspop/styles.css';

const modal = createModal({
  content: '<div class="p-6" style="width: min(22rem, calc(100vw - 2rem));">Contenido...</div>',
  placement: 'bottom',
  align: 'center',
  modalClass: 'panel',
});

document.querySelector('#btn').addEventListener('click', (e) => {
  modal.open(e.currentTarget);
});
```

---

## Comandos de Desarrollo

```bash
# Instalar dependencias del monorepo
pnpm install

# Iniciar sitio de documentación (Astro)
pnpm dev

# Iniciar demos de Vue y React
pnpm dev:vue
pnpm dev:react

# Ejecutar suite de pruebas unitarias
pnpm test

# Compilar todos los paquetes y proyectos
pnpm build
```

---

## Licencia

[MIT](LICENSE) © [Euddy Javier](mailto:euddy.javier@gmail.com)


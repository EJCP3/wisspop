# WissPop

Modales, dropdowns y drawers con **animaciones ancladas al origen**: el panel no aparece de la nada, nace del elemento que lo abrió y vuelve a él al cerrarse.

Un motor core agnóstico de alto rendimiento escrito en JS Vanilla + GSAP, con adaptadores nativos para **Astro**, **Vue 3**, **React 18/19** y **Vanilla JS**.

---

## Características

- 🎯 **Animación anclada al origen**: Arranca con la posición, tamaño y `border-radius` del elemento disparador y retorna dinámicamente a su posición actual al cerrar.
- 📏 **Medición dinámica**: Mide automáticamente el contenido real fuera de pantalla. Prohibido requerir alturas fijas.
- 🔀 **Texto e icono viajero (PillModal)**: El texto del botón despega, flota e interpola su escala hasta aterrizar en el título del modal (`data-wisspop-title`).
- 🖼️ **Elementos compartidos (FlipModal)**: Elementos con `data-flip-id` viajan entre el disparador y el modal conservando identidad visual.
- 📐 **Posicionamiento inteligente**: 6 posiciones ancladas, modo `origin` (crece en el lugar), drawers laterales/verticales y acotado automático contra los bordes de la ventana.
- 🖐️ **Descarte por gesto (Swipe to Close)**: Arrastre táctil o de mouse para descartar el modal hacia cualquier dirección.
- ♿ **Accesibilidad nativa (WAI-ARIA)**: Focus trap confinado, tecla `Escape`, restauración de foco al origen, bloqueo de scroll en body y respeto a `prefers-reduced-motion`.

---

## Estructura del Monorepo

```text
wisspop/
├── packages/
│   └── wisspop/           # Código fuente de la librería (Core, Vanilla, Astro, Vue, React)
└── apps/
    ├── docs/              # Sitio oficial de documentación interactiva (Astro 4)
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

## Ejemplos de Uso

### Astro (Nativo)

```astro
---
import { WissPopMorph } from 'wisspop/astro';
import 'wisspop/styles.css';
---

<button data-wisspop-trigger="mi-modal">Filtros</button>

<WissPopMorph id="mi-modal" placement="bottom" align="center">
  <div class="p-6 bg-white dark:bg-zinc-900 rounded-xl">
    <h3>Filtros de Búsqueda</h3>
    <button data-wisspop-close>Cerrar</button>
  </div>
</WissPopMorph>
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

  <WissPopMorph v-model="abierto" :origin-ref="btn" placement="bottom" align="center">
    <template #default="{ close }">
      <div class="panel">
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
      <WissPopMorph open={open} onClose={() => setOpen(false)} originRef={btnRef.current}>
        {({ close }) => (
          <div className="panel">
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
  content: '<div class="p-6">Contenido...</div>',
  placement: 'bottom',
  align: 'center',
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

# wisspop

Modales y dropdowns con **animaciones ancladas al origen**: el panel no aparece de la nada, nace del elemento que lo abrió y vuelve a él al cerrarse.

Un motor core sin framework (JS + GSAP) con adaptadores finos para **Astro**, **Vue**, **React** y **Vanilla JS**.

---

## Instalación

```bash
pnpm add wisspop gsap
# o con npm / yarn
npm install wisspop gsap
```

`gsap` (≥3.12) es dependencia requerida. `vue` o `react` solo son necesarias si utilizas sus respectivos wrappers.

---

## Matriz de imports

| Import | Qué trae | Entorno / Dependencia |
|---|---|---|
| `wisspop` | `createMorph`, `createFlip`, `placeBox` (core puro) | `gsap` |
| `wisspop/vanilla` | `createModal`, `createFlipModal`, helpers dropdown | `gsap` |
| `wisspop/astro` | `WissPopMorph`, `WissPopPill`, `WissPopFlip` (componentes `.astro`) | `gsap` |
| `wisspop/vue` | `WissPopMorph`, `WissPopPill`, `WissPopFlip` | `gsap`, `vue >= 3.4` |
| `wisspop/react` | `WissPopMorph`, `WissPopPill`, `WissPopFlip` | `gsap`, `react >= 18` |
| `wisspop/styles.css` | Estructura CSS obligatoria (position, z-index, overflow) | — |

---

## Importación de CSS

```js
import "wisspop/styles.css";
```

O en tu archivo CSS global:

```css
@import "wisspop/styles.css";
```

**El CSS no es decorativo**, provee el posicionamiento `position: fixed`, gestión de recortes y apilado que el motor requiere. La apariencia (colores, bordes, sombras, tipografía) es 100% controlada por ti mediante tus clases CSS (`modalClass`, `overlayClass`).

Los `z-index` predeterminados pueden ajustarse mediante variables CSS:

```css
:root {
  --wisspop-z-overlay: 40;
  --wisspop-z-box: 50;
  --wisspop-z-flying: 51;
  --wisspop-z-close: 101;
}
```

---

## Tipos de Modales y Componentes

| Componente | Animación | Caso de uso principal |
|---|---|---|
| **MorphModal** | La caja crece desde el rect del botón hasta su tamaño final; el contenido entra después con fade | Dropdowns, menús, drawers, paneles anclados a un botón |
| **PillModal** | La caja se expande y el **texto/icono del botón viaja** hasta el título `data-wisspop-title` | Modales de auth, formularios donde la etiqueta del botón se convierte en el título |
| **FlipModal** | Transición FLIP real: elementos individuales con `data-flip-id` viajan del origen al modal | Cards expandibles a detalle, galerías de productos |
| **DropdownPanel** | Despliegue elástico ligero con `scaleY 0→1` | Selects, menús de opciones y filtros contextuales |

---

## Guía de Uso por Framework

### 1. Astro (Nativo)

Se usa de forma 100% declarativa mediante los atributos `data-wisspop-trigger="id"` y `data-wisspop-close`:

```astro
---
import { WissPopMorph, WissPopPill } from 'wisspop/astro';
import 'wisspop/styles.css';
---

<button data-wisspop-trigger="mi-modal">Filtros</button>

<WissPopMorph id="mi-modal" placement="bottom" align="center">
  <div class="p-6 border rounded-xl bg-white dark:bg-zinc-900">
    <h3>Filtros de Búsqueda</h3>
    <button data-wisspop-close>Cerrar</button>
  </div>
</WissPopMorph>
```

### 2. Vue 3

```vue
<script setup>
import { ref } from 'vue';
import { WissPopMorph, WissPopPill } from 'wisspop/vue';
import 'wisspop/styles.css';

const btn = ref(null);
const abierto = ref(false);
</script>

<template>
  <button ref="btn" @click="abierto = true">Abrir</button>

  <WissPopMorph
    v-model="abierto"
    :origin-ref="btn"
    placement="bottom"
    align="center"
  >
    <template #default="{ close }">
      <div class="panel">
        <p>Contenido del modal</p>
        <button @click="close">Cerrar</button>
      </div>
    </template>
  </WissPopMorph>
</template>
```

### 3. React 18 / 19

```jsx
import { useRef, useState } from 'react';
import { WissPopMorph } from 'wisspop/react';
import 'wisspop/styles.css';

export function Demo() {
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button ref={btnRef} onClick={() => setOpen(true)}>Abrir</button>

      <WissPopMorph
        open={open}
        onClose={() => setOpen(false)}
        originRef={btnRef.current}
        placement="bottom"
        align="center"
      >
        {({ close }) => (
          <div class="panel">
            <p>Contenido del modal</p>
            <button onClick={close}>Cerrar</button>
          </div>
        )}
      </WissPopMorph>
    </>
  );
}
```

### 4. Vanilla JS

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

## Texto e Icono Viajero (PillModal)

El segundo argumento de `open()` es el elemento o texto que viaja hacia `data-wisspop-title`:

```js
modal.open(boton, "Crear cuenta");                    // Solo texto
modal.open(boton, boton.querySelector(".con-icono")); // Texto + icono
modal.open(boton, boton.querySelector("svg"));        // Solo icono (modo box)
modal.open(boton, boton.querySelector("img"));        // Imagen (modo box)
```

| Modo | Anima | Aplicación |
|---|---|---|
| `text` | `font-size`, `line-height`, `font-weight`, `color` | Cuando hay texto. Mantiene la nitidez en cada frame. |
| `box` | `width`, `height` | Sin texto (iconos sueltos o imágenes). |

---

## Métodos de la API

La instancia devuelta por `createModal()`, `createMorph()`, `createFlipModal()` o expuesta en las refs de los wrappers expone los siguientes métodos:

| Método | Firma | Descripción |
|---|---|---|
| `open` | `(originRef, flying?, options?)` | Abre el modal despegando desde el origen (HTMLElement, selector CSS o Rect `{top, left, width, height}`). |
| `close` | `()` | Cierra el modal retornando a la posición actual del origen. |
| `changeView` | `(mutateFn)` | Reemplaza el contenido con un fade-through sin cerrar el panel. `mutateFn` se ejecuta síncronamente antes del recálculo. |
| `resync` | `()` | Re-mide la altura del contenido cuando cambia dinámicamente y ajusta la caja. |
| `destroy` | `()` | Limpia los observers y elimina los nodos creados en el DOM. |

---

## Opciones de Configuración

| Opción | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `placement` | `string` | `'center'` | `top`, `bottom`, `left`, `right`, `origin`, `center`, `drawer-left`, `drawer-right`, `drawer-top`, `drawer-bottom`. |
| `align` | `string` | `'center'` | Posición sobre el eje cruzado: `start`/`left`/`top`, `center`, `end`/`right`/`bottom`. |
| `gap` | `number` | `8` | Distancia en píxeles hacia el elemento origen. |
| `margin` | `number` | `16` | Margen mínimo de seguridad a los bordes de la ventana. |
| `duration` | `number` | `0.55` | Duración de la animación de apertura en segundos. |
| `closeDuration` | `number` | `0.7` | Duración de la animación de cierre en segundos. |
| `ease` | `string` | `'back.out(1.1)'` | Easing de GSAP para apertura (ej. `'power3.out'`). |
| `closeEase` | `string` | `'power3.inOut'` | Easing de GSAP para el retorno al origen. |
| `swipeToClose` | `boolean` | `false` | Permite descartar el modal arrastrándolo con el mouse o gesto táctil. |
| `swipeThreshold` | `number` | `90` | Píxeles de arrastre para confirmar el descarte. |
| `closeOnEscape` | `boolean` | `true` | Cierra el panel al presionar la tecla `Escape`. |
| `trapFocus` | `boolean` | `true` | Mantiene el trampa de foco confinado dentro del panel activo. |
| `restoreFocus` | `boolean` | `true` | Devuelve el foco al botón disparador al cerrar. |
| `lockScroll` | `boolean` | `true` | Bloquea el scroll del body agregando compensación de scrollbar. |
| `fullscreenOnMobile` | `boolean` | `true` | En pantallas menores a 640px los modales grandes ocupan el ancho completo. |
| `mobileBreakpoint` | `number` | `640` | Breakpoint en píxeles para el comportamiento móvil responsive. |

---

## Accesibilidad (A11Y)

WissPop integra accesibilidad nativa lista para usar:
- **`Escape`**: Presionar la tecla Escape cierra el panel.
- **Trampa de Foco**: El foco del teclado queda atrapado en el modal activo.
- **Restauración de Foco**: El foco retorna automáticamente al elemento disparador al cerrar.
- **Semántica ARIA**: Inyección automática de `role="dialog"`, `aria-modal="true"`, y `aria-labelledby`.
- **`prefers-reduced-motion`**: Si el usuario activó movimiento reducido en el SO, la librería salta directamente a la geometría final sin animar.

---

## Alcance — Lo que NO hace

- **No es un sistema de diseño:** No incluye colores, sombras ni tipografía predeterminadas.
- **No gestiona notificaciones / toasts globales:** wisspop está enfocado en modales y paneles anclados al origen.
- **No reemplaza a `<dialog>` estático:** Si solo requieres una ventana estática sin animación anclada espacialmente, `<dialog>` nativo es una alternativa válida.

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

## Tipos de Modales y Cuándo Usar Cada Uno

| Componente | Tipo de Animación | Caso de Uso Principal | Qué Elementos Usa |
|---|---|---|---|
| **`WissPopMorph`** | La caja crece físicamente desde el rect del botón hasta su destino (`placement="origin"` o anclado). | Dropdowns, menús contextuales, drawers, mini-modales de confirmación o aviso | **NO usa texto volador.** La caja hace todo el morph físico. |
| **`WissPopPill`** | La caja se expande y el **texto/icono del botón vuela** hacia `[data-wisspop-title]`. | Modales de formularios principales, login/auth, calculadoras donde la etiqueta del botón se convierte en el título | Requiere `[data-wisspop-title]` en el modal y opcionalmente `data-wisspop-label` en el botón. |
| **`WissPopFlip`** | Transición FLIP real: múltiples elementos compartidos con `data-flip-id` viajan del origen al modal. | Cards expandibles a detalle, galerías de productos | Requiere atributos `data-flip-id="id-unico"` coincidentes. |
| **`DropdownPanel`** | Despliegue elástico ligero con `scaleY 0→1`. | Selects, menús de opciones y filtros contextuales rápidos | Helpers vanilla `enterDropdownAnimation` / `leaveDropdownAnimation`. |

---

## Buenas Prácticas y Rendimiento Móvil (60-120 FPS) ⚡📱

1. **Aplica estilos en `modalClass`**: Wisspop anima directamente su propio contenedor `.wisspop-box`. Pasa el fondo, bordes, redondeo y sombra a `modalClass` en lugar de crear una segunda caja contenedora en el slot.
2. **`flyingTextClass` es exclusivo de `WissPopPill`**: En `WissPopMorph`, usa encabezados HTML normales `<h3>` sin `data-wisspop-title`.
3. **Define un ancho en el contenido**: Para que GSAP calcule la geometría con precisión, dale un ancho explícito o responsivo (ej. `style="width: min(24rem, calc(100vw - 2rem));"`).
4. **Colores de fondo armónicos en el botón**: WissPop interpola el `backgroundColor` del botón hacia el modal al abrir y de vuelta al cerrar. Mantén el botón en tonos armónicos/neutros y coloca los colores llamativos en iconos o badges.
5. **Evita sombras difusas (`box-shadow`) en pantalla completa**: Clases como `shadow-2xl` fuerzan el cálculo de 50px de blur perimetral que no es visible en `100vw`. Usa sombras responsivas: `class="shadow-none sm:shadow-2xl"`.
6. **Usa `h-full` en lugar de `min-h-[100dvh]` dentro del slot**: WissPop ya calcula y ajusta la altura exacta de la caja; usar `100dvh` fuerza consultas redundantes al viewport dinámico móvil. Usa `class="h-full sm:h-auto flex flex-col justify-between"`.

---

## 🚀 Arquitectura de Alto Rendimiento (GPU / CPU / VRAM)

WissPop incluye optimizaciones de bajo nivel para garantizar fluidez nativa a 60-120 FPS en dispositivos móviles:
* **Aceleración por Capa GPU**: `.wisspop-box` opera con `transform: translateZ(0)` y `backface-visibility: hidden` para que el navegador cree un contexto de composición independiente.
* **Contención de Layout (`contain: layout paint`)**: Aísla el reflow durante la animación para que las mutaciones de geometría no invaliden el árbol DOM exterior (fondos, gradientes, textos).
* **Gestión Dinámica de VRAM (`will-change`)**: La propiedad `will-change` se activa exclusivamente durante la interpolación activa y se libera a `"auto"` al completarse, garantizando cero consumo residual de memoria gráfica.
* **Suavizado Inteligente de Curvas en Viewport Móvil**: Al expandir a pantalla completa (`fullscreenOnMobile`), las curvas elásticas con *overshoot* (`back.out`) conmutan automáticamente a desaceleraciones suaves (`power3.out`) para evitar vibraciones del motor de scroll.
* **`contentBlur: false` por Defecto**: Elimina filtros de convolución gaussiana en tiempo real durante la expansión de la caja, liberando el *fill-rate* de la GPU móvil.

---

## Guía de Uso por Framework

### 1. Astro (Nativo)

Se usa de forma 100% declarativa mediante `data-wisspop-trigger="id"` y `data-wisspop-close`:

```astro
---
import { WissPopMorph, WissPopPill } from 'wisspop/astro';
import 'wisspop/styles.css';
---

<!-- 1. Morph Modal (Menús, Dropdowns, Drawers) -->
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
    <button data-wisspop-close class="btn mt-4 w-full">Aplicar</button>
  </div>
</WissPopMorph>

<!-- 2. Pill Modal (Auth, Formularios con texto viajero) -->
<button data-wisspop-trigger="auth-modal" class="btn">Crear cuenta</button>

<WissPopPill
  id="auth-modal"
  placement="center"
  modalClass="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl"
  flyingTextClass="font-bold text-lg"
  swipeToClose={true}
>
  <div class="p-6" style="width: min(24rem, calc(100vw - 2rem));">
    <h2 data-wisspop-title class="font-bold text-2xl mb-4">Crear cuenta</h2>
    <input placeholder="Email" class="input mb-3 w-full" />
    <button data-wisspop-close class="btn w-full">Continuar</button>
  </div>
</WissPopPill>
```

#### Configuración en Astro (`astro.config.mjs`)

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

### 2. Vue 3

```vue
<script setup>
import { ref } from 'vue';
import { WissPopMorph } from 'wisspop/vue';
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
    modalClass="panel"
  >
    <template #default="{ close }">
      <div class="panel-body" style="width: min(22rem, calc(100vw - 2rem));">
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
        modalClass="panel"
      >
        {({ close }) => (
          <div className="panel-body" style={{ width: 'min(22rem, calc(100vw - 2rem))' }}>
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
| `contentBlur` | `boolean` | `false` | Aplica un filtro suave `blur(4px)→0` en el contenido durante la apertura. |

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

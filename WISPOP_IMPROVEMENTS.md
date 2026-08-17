# 🚀 Guía de Mejoras y Correcciones para `wisspop`

Este documento detalla los hallazgos técnicos, bugs identificados, causas raíz y propuestas de solución en código para implementar en la siguiente versión de la librería **`wisspop`**.

---

## 📌 Tabla de Contenidos
1. [Bug 1: Parpadeo en la Esquina (0, 0) al Cerrar el Modal](#1-bug-1-parpadeo-en-la-esquina-0-0-al-cerrar-el-modal)
2. [Mejora 2: Viaje Automático de Icono + Texto en `PillModal` (DX)](#2-mejora-2-viaje-automático-de-icono--texto-en-pillmodal-dx)
3. [Mejora 3: Layout y Estilos del Contenedor Volador (`.wisspop-flying-text`)](#3-mejora-3-layout-y-estilos-del-contenedor-volador-wisspop-flying-text)
4. [Mejora 4: Sincronización de Tiempos y Easings en `react.js`](#4-mejora-4-sincronización-de-tiempos-y-easings-en-reactjs)
5. [Mejora 5: Manejo de Backdrop / Overlay Limpio](#5-mejora-5-manejo-de-backdrop--overlay-limpio)
6. [Resumen del Checklist de Cambios por Archivo](#6-resumen-del-checklist-de-cambios-por-archivo)

---

## 1. Bug 1: Parpadeo en la Esquina (0, 0) al Cerrar el Modal

### 🔴 Síntoma:
Al cerrar cualquier modal (`close()`), justo en el último *frame* de la animación de salida, la caja del modal parpadea en la esquina superior izquierda de la pantalla (`top: 0, left: 0`) antes de desaparecer.

### 🔍 Causa Raíz:
En `core.js` (dentro de la función `close()` / `v()`):
```javascript
// Al terminar el tween de salida en GSAP:
if (h && r.set(h, { opacity: 0, clearProps: "all" }), r.set(i, { clearProps: "all" }), ...)
d = null;
w("closed");
o.unmount?.(); // Llama a unmount en el wrapper de React (setIsMounted(false))
```

1. GSAP ejecuta sincrónicamente `r.set(i, { clearProps: "all" })` sobre `.wisspop-box`, borrando todas las propiedades inline calculadas (`top`, `left`, `width`, `height`, `opacity`, `transform`).
2. En **React 18 y React 19**, las actualizaciones de estado (`setIsMounted(false)`) entran en el ciclo de renderizado asíncrono (*automatic state batching*).
3. Durante 1 a 2 *frames* (16–32 ms), el elemento `.wisspop-box` sigue en el DOM real, pero al no tener `top`/`left` y tener `position: fixed; opacity: 1;`, el navegador lo posiciona en su valor por defecto `(0, 0)` visible.

### 🛠️ Solución en `wisspop`:

#### Opción Recomendada A (en `styles.css`):
Agregar una regla que garantice que cualquier `.wisspop-box` sin `top` inline o en estado de medición esté oculta:
```css
/* Prevenir que la caja sea visible si no tiene coordenadas calculadas */
.wisspop-box:not([style*="top"]),
.wisspop-box[style*="top: -9999px"],
.wisspop-box[style*="top:-9999px"] {
  opacity: 0 !important;
  pointer-events: none !important;
}
```

#### Opción B (en `core.js` dentro del cierre `v()`):
En vez de borrar todas las propiedades con `clearProps: "all"` dejando `opacity: 1`, mantener `opacity: 0`:
```javascript
// Antes:
r.set(i, { clearProps: "all" });

// Después:
r.set(i, { opacity: 0, clearProps: "transform,width,height,top,left,border-radius" });
```

---

## 2. Mejora 2: Viaje Automático de Icono + Texto en `PillModal` (DX)

### 🔴 Limitación Actual:
Actualmente la función `open()` requiere:
```javascript
modal.open(boton, "Crear cuenta");                    // Solo texto
modal.open(boton, boton.querySelector(".con-icono")); // Texto + icono manual
```
Si el desarrollador pasa un `string` o simplemente `modal.open(e.currentTarget)` sin segundo argumento, la función `bt()` crea un nodo de texto plano (`textContent`), ignorando cualquier icono `<svg>` o `<img>` que esté dentro del botón disparador.

### 🛠️ Solución en `core.js`:
Permitir que `open(origin, label)` detecte automáticamente si el botón origen contiene elementos gráficos (como un SVG o icono) y clonar el contenido del botón si no se especifica un `label` manual:

```javascript
// En core.js -> función open() / y():
let flyingPayload = label;

if (flyingPayload == null && origin instanceof HTMLElement) {
  // Si el botón tiene hijos con icono o texto, usar los hijos del botón
  const hasIcon = origin.querySelector("svg, img, [data-wisspop-icon]");
  if (hasIcon) {
    flyingPayload = origin.cloneNode(true);
  } else {
    flyingPayload = origin.textContent?.trim() || "";
  }
}
```

---

## 3. Mejora 3: Layout y Estilos del Contenedor Volador (`.wisspop-flying-text`)

### 🔴 Problema:
Cuando un elemento viaja desde un botón con `display: flex` y `align-items: center` hacia el título del modal, si `.wisspop-flying-text` no tiene propiedades flexbox explícitas en CSS, el icono y el texto pueden colocarse en bloque o desfasarse verticalmente durante el vuelo.

### 🛠️ Solución en `styles.css`:
```css
.wisspop-flying-text {
  position: fixed;
  z-index: var(--wisspop-z-flying, 60);
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  gap: inherit;
  will-change: transform, font-size, width, height, top, left;
}
```

---

## 4. Mejora 4: Sincronización de Tiempos y Easings en `react.js`

### 🔴 Problema de Percepción:
En `react.js`, para `WissPopPill`, los defaults de `duration` (0.3s) y `closeDuration` (0.42s) combinados con los delays internos de contenido (`delay: duration * 0.375`) pueden sentirse ligeramente desfasados frente a la curva elástica de la caja.

### 🛠️ Valores Óptimos Recomendados para `WissPopPill` (`react.js`):
```javascript
const defaultPillProps = {
  duration: 0.38,
  ease: "power3.out",
  closeDuration: 0.32,
  closeEase: "power3.inOut",
  contentBlur: false, // Desactivar blur por defecto para interfaces SaaS nítidas
};
```

---

## 5. Mejora 5: Manejo de Backdrop / Overlay Limpio

### 🔴 Recomendación:
Por defecto, el overlay no debería forzar un `backdrop-filter: blur(...)` agresivo o un fondo demasiado negro en los presets de componentes React si el usuario no lo define explícitamente, ya que oscurece el contexto visual del dashboard subyacente.

En `styles.css`:
```css
.wisspop-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--wisspop-z-overlay, 40);
  background-color: var(--wisspop-overlay-bg, rgba(0, 0, 0, 0.15));
  transition: opacity 0.3s ease;
}
```

---

## 6. Resumen del Checklist de Cambios por Archivo

| Archivo | Cambio a Realizar | Impacto |
|---|---|---|
| `src/styles.css` | Agregar `.wisspop-box:not([style*="top"]) { opacity: 0 !important; }` | 🟢 Elimina el parpadeo en la esquina (0,0) al cerrar |
| `src/styles.css` | Agregar `display: inline-flex; align-items: center;` en `.wisspop-flying-text` | 🟢 Mantiene el icono y el texto perfectamente alineados en el aire |
| `src/core.js` | En `close()`, preservar `opacity: 0` antes de `clearProps` | 🟢 Previene carreras de renderizado en React 18/19 |
| `src/core.js` | En `open()`, auto-detectar iconos del botón si `label` no se define | 🟢 Gran mejora de DX (el usuario no tiene que buscar manualmente el `.con-icono`) |
| `src/react.js` | Actualizar los valores por defecto de `duration` (0.38s) y `ease` (`power3.out`) en `WissPopPill` | 🟢 Movimiento orgánico y sincronizado de la caja con el título |

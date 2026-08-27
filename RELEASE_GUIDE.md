# 🚀 Guía de Publicación de Versión — Wisspop (v0.2.0)

Este documento detalla el paso a paso exacto para compilar, confirmar y publicar en NPM y GitHub la nueva versión de **Wisspop**.

---

## 📦 1. Novedades y Mejoras Incluidas en Esta Versión

### 🎨 Core & Animación (`morph.js` / GSAP)
- **Relevo Atómico de Cierre sin Parpadeo ("Pop-in")**: La caja animada regresa limpiamente a las coordenadas exactas (`rect`) del origen y el intercambio de visibilidad se produce de manera síncrona en el último frame, eliminando cualquier duplicación visual.
- **Salida Sincronizada del Botón de Cierre (`.wisspop-close`)**: El botón `×` desaparece antes del viaje de regreso para evitar que quede flotando sobre la caja durante la animación.
- **Animaciones de Salida de Contenido (`contentAnimation`)**: Soporte completo para transiciones sincronizadas de cierre (`slide-up`, `slide-down`, `scale`, `fade`, `none`).
- **Soporte de Cascada en Cierre (`contentStagger`)**: Los elementos hijos ahora respetan la salida escalonada.
- **Soporte de Fondos con Gradiente**: Extracción inteligente de color base en `backgroundImage` para elementos con fondos translúcidos o degradados.
- **Destrucción y Limpieza Segura (`destroy`)**: Limpieza profunda de todos los tweens y estilos inline en hijos del modal.

### 🚀 Adaptador Astro (`WissPopPill.astro`, `client.js`)
- **Sincronización Bidireccional de Inputs**: El texto escrito en el buscador/disparador se sincroniza automáticamente con el input del modal al abrir y se devuelve al disparador al cerrar.
- **Resolución Avanzada de Origen y Labels**: Soporte para atributos `data-wisspop-origin="closest:..."` y `data-wisspop-label`.

### 📚 Documentación y Demos Interactivos
- Nuevos casos de uso en `vue-docs`, `react-docs`, `docs-astro` y `docs-test`:
  - Buscador con píldora de filtros integrados.
  - Modales inmersivos en pantalla completa (`placement="fullscreen"`).
  - Selector de físicas de aceleración (curvas `eases`).

---

## 🧪 2. Estado de Calidad y Verificación

- ✅ **Tests Unitarios**: 49/49 pruebas pasando (`pass 49 / fail 0`).
- ✅ **Build de Producción**: Bundles ESM (`.js`), CJS (`.cjs`), tipos TypeScript (`.d.ts`) y CSS (`wisspop.css`) generados correctamente.
- ✅ **Monorepo**: Todas las aplicaciones de prueba y documentación compilan sin errores.

---

## 🛠️ 3. Paso a Paso para Publicar AHORA

### Paso 1: Confirmar o cambiar la versión en `packages/wisspop/package.json`
Asegúrate de que la versión en `packages/wisspop/package.json` sea la deseada (ej. `0.2.0` o `0.1.10`):

```json
{
  "name": "wisspop",
  "version": "0.2.0"
}
```

---

### Paso 2: Ejecutar Pruebas y Compilación Final

Abre tu terminal en la raíz del proyecto y corre:

```bash
# 1. Ejecutar tests unitarios
pnpm test

# 2. Compilar el paquete de la librería
pnpm --filter wisspop build
```

---

### Paso 3: Guardar y Confirmar Cambios en Git

```bash
# 1. Agregar todos los archivos modificados
git add .

# 2. Realizar el commit
git commit -m "feat(release): v0.2.0 - cierre atomico sin pop-in, sync de inputs en astro y modales fullscreen"

# 3. Subir a la rama actual
git push origin test
```

---

### Paso 4: Crear el Tag de Git y Subirlo a GitHub

```bash
# 1. Crear el tag
git tag v0.2.0

# 2. Subir los tags al repositorio remoto
git push origin --tags
```

---

### Paso 5: Publicar el Paquete en NPM

```bash
# Opción A: Publicar directamente con pnpm desde la raíz
pnpm --filter wisspop publish --access public

# Opción B: O entrando a la carpeta del paquete
cd packages/wisspop
npm publish --access public
```

> **Nota sobre autenticación en NPM:** Si tu terminal no tiene la sesión iniciada, ejecuta primero `npm login`.

---

## 📋 4. Plantilla de Notas de Release (GitHub Release / Changelog)

Si vas a crear el Release en GitHub (`https://github.com/EJCP3/wisspop/releases/new`), puedes pegar este resumen:

```markdown
## Wisspop v0.2.0

### 🚀 Nuevas Características y Mejoras
- **Cierre Atómico sin Parpadeo**: Relevo síncrono en el último frame entre la caja viajera y el elemento origen para eliminar saltos visuales o duplicaciones.
- **Sincronización de Inputs en Astro**: Sincronización automática de valores en tiempo real entre buscadores/disparadores y modales.
- **Salida Dinámica de Contenido**: Cierre fluido con soporte para `contentAnimation` (`slide-up`, `slide-down`, `scale`, `fade`) y `contentStagger`.
- **Soporte de Pantalla Completa**: Modales inmersivos con `placement="fullscreen"` optimizados para alto rendimiento a 60-120 FPS.
- **Extracción de Color en Gradientes**: Detección automática del color de fondo en disparadores con CSS `background-image`.

### 🐛 Correcciones
- Salida del botón `×` (`.wisspop-close`) desacoplada del movimiento de la caja.
- Prevención de desbordamiento horizontal y barras de scroll momentáneas durante transiciones.
- Optimización del runner de tests unitarios en entornos Windows.
```

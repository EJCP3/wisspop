# 🚀 WissPop — Timeline, Arquitectura y Guía Completa de Animaciones

Este documento detalla la **arquitectura técnica, el ciclo de vida de las animaciones (timeline paso a paso), la física de morphing, las mejores prácticas y los antipatrones** de **WissPop**.

Su objetivo es permitir a cualquier desarrollador comprender a fondo cómo funciona el motor de animaciones sin necesidad de leer cada archivo del código fuente uno por uno.

---

## 📑 Tabla de Contenidos
1. [Visión General de la Arquitectura](#1-visión-general-de-la-arquitectura)
2. [Ciclo de Vida de la Animación (Timeline Paso a Paso)](#2-ciclo-de-vida-de-la-animación-timeline-paso-a-paso)
   - [Fase 0: Pre-cálculo y Mediciones Invisibles](#fase-0-pre-cálculo-y-mediciones-invisibles-frame--1)
   - [Fase 1: Despegue Atómico](#fase-1-despegue-atómico-frame-0)
   - [Fase 2: El Vuelo y Expansión Física](#fase-2-el-vuelo-y-expansión-física-0---100)
   - [Fase 3: Aterrizaje y Estado Abierto](#fase-3-aterrizaje-y-estado-abierto-open)
   - [Fase 4: Cierre Coordinado y Retorno Suave](#fase-4-cierre-coordinado-y-retorno-suave-close)
3. [El Elemento Viajero: Modo `text` vs Modo `box`](#3-el-elemento-viajero-modo-text-vs-modo-box)
4. [Efectos Internos de Contenido](#4-efectos-internos-de-contenido)
   - [Content Animation (Slide-Up, Slide-Down, Scale, Fade)](#contentanimation)
   - [Content Stagger (Cascada Automática)](#contentstagger)
5. [Física de Gesto: Swipe to Close](#5-física-de-gesto-swipe-to-close)
6. [Mejores Prácticas Obligatorias](#6-mejores-prácticas-obligatorias)
7. [🚫 Cosas que NUNCA se deben hacer (Antipatrones)](#7--cosas-que-nunca-se-deben-hacer-antipatrones)

---

## 1. Visión General de la Arquitectura

WissPop no es un simple creador de modales con clases CSS; es un **motor de morphing físico continuo** basado en principios **FLIP (First, Last, Invert, Play)** potenciado por GSAP.

```
┌─────────────────────────────────────────────────────────────┐
│                    Capas de WissPop                         │
├─────────────────────────────────────────────────────────────┤
│ 1. Adaptadores: vanilla / react / vue / astro (WissPopMorph) │  <- Reciben props y montan DOM
│ 2. Core (morph.js, flip.js, dropdown.js)                   │  <- Motor matemático & GSAP
│ 3. Estilos Estructurales (wisspop.css)                      │  <- 0 colores, solo GPU y layout
└─────────────────────────────────────────────────────────────┘
```

### Separación de Responsabilidades:
- **`core/morph.js`**: Controlador de estados (`closed` -> `opening` -> `open` -> `closing`), cálculo geométrico de coordenadas de viewport (`getBoundingClientRect`), interpolador de transformaciones y gestor de ciclo de vida.
- **`core/flip.js`**: Motor FLIP para elementos desacoplados con `data-flip-id`.
- **`styles/wisspop.css`**: Contiene únicamente las reglas estructurales indispensables (`position: fixed`, capas z-index, `transform: translateZ(0)` para aislar capas de GPU y prevenir repaints globales).

---

## 2. Ciclo de Vida de la Animación (Timeline Paso a Paso)

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant Trigger as Botón / Input Origen
    participant Core as WissPop Core (morph.js)
    participant Box as Caja del Modal (.wisspop-box)
    participant Flying as Elemento Viajero (.wisspop-flying-text)
    participant Content as Contenido Interno (.wisspop-content)

    Usuario->>Trigger: Clic / Tap
    Note over Core: FASE 0: Mediciones fuera de pantalla
    Core->>Core: readOrigin() + measure() + measureTitle()
    
    Note over Core, Flying: FASE 1: Despegue
    Core->>Trigger: opacity: 0 (Atómico)
    Core->>Box: Inicia en rect del origen con su bgColor & radius
    Core->>Flying: Monta clon con métricas tipográficas idénticas

    Note over Box, Content: FASE 2: Vuelo y Expansión
    par Animación Geométrica
        Core->>Box: Interpola geom (x, y, w, h, radius, bgColor)
    and Animación Elemento Viajero
        Core->>Flying: Interpola posición, fontSize / w+h, color
    and Animación Contenido
        Core->>Content: Inicia slide-up / scale / stagger con delay
    end

    Note over Box, Flying: FASE 3: Aterrizaje
    Core->>Box: Agrega .wisspop-open
    Core->>Flying: opacity: 0 (Atómico)
    Core->>Box: updateScrollability() + activa gesto swipe + trapFocus

    Usuario->>Box: Clic Cerrar / Escape / Swipe
    Note over Box, Trigger: FASE 4: Cierre Coordinado
    Core->>Content: opacity: 0 (Inmediato)
    par Retorno Coordinado (Promise.all)
        Core->>Box: Contracción geométrica hacia el origen
        Core->>Flying: Vuelo de regreso hacia el origen
        Core->>Box: boxShadow: none
        Core->>Trigger: Crossfade suave (opacity 0 -> 1 en los últimos frames)
    end
    Core->>Trigger: clearProps: opacity
    Core->>Box: Limpieza de estado y desmontaje
```

---

### Fase 0: Pre-cálculo y Mediciones Invisibles (Frame -1)

Antes de pintar un solo pixel o disparar GSAP, el core calcula exactamente las coordenadas de inicio y de fin:

1. **`readOrigin(origin, originRadius)`**:
   - Mide el `getBoundingClientRect()` del elemento disparador.
   - Lee `border-radius`, limitándolo a la mitad de la dimensión menor para evitar radios inflados que no coincidan con la forma real.
   - Obtiene el `backgroundColor` computado real para que la caja nazca con el mismo color del botón.
2. **`measure()`**:
   - Renderiza temporalmente la caja en coordenadas fuera de pantalla (`top: -9999px; left: -9999px; height: auto`).
   - Mide el ancho y alto final natural del contenido usando `Math.ceil()` para evitar subpixel bugs en pantallas HiDPI.
3. **`measureTitle(target)`**:
   - Mide la posición y dimensiones exactas de cualquier elemento marcado con `[data-wisspop-title]` dentro del modal para que el elemento viajero sepa dónde debe aterrizar con precisión milimétrica.
4. **`acquireScrollLock()`**:
   - Bloquea el scroll del `body` compensando el ancho de la barra de desplazamiento (`scrollbarWidth`) mediante `paddingRight` temporal para evitar que la página salte lateralmente al abrir el modal.

---

### Fase 1: Despegue Atómico (Frame 0)

1. **Ocultación del origen**:
   - `gsap.set(o.el, { opacity: 0 })`.
   - Se oculta de forma **atómica e instantánea** (no con fade). Como la caja del modal arranca exactamente en las mismas coordenadas, tamaño, radio y color, el ojo humano percibe que el botón se ha convertido en el modal.
2. **Nacimiento de la caja**:
   - `box` arranca con `autoAlpha: 1`, `geom` colocado en las coordenadas del botón.
3. **Preparación del Elemento Viajero (`prepareFlying`)**:
   - Se clona el texto o nodo del disparador (`payload.cloneNode(true)`).
   - Se capturan y fijan de inmediato las métricas visuales: `fontFamily`, `fontStyle`, `fontWeight`, `letterSpacing`, `color`.
   - Si el elemento viajero contiene un formulario o `<input>`, se sincronizan sus valores (`value`) en el clon.

---

### Fase 2: El Vuelo y Expansión Física (0% -> 100%)

Durante la duración configurada (`duration`, e.g. `0.5s`):

1. **Interpolación Geométrica**:
   - GSAP anima un objeto interno `geom: { w, h, top, left, radius }` escribiéndolo en cada tick con `onUpdate: applyGeom`.
   - El color de fondo `backgroundColor` transiciona del color del botón hacia el color del panel (`var(--surface)`).
2. **Vuelo del Elemento Viajero**:
   - Viaja de `varsEnOrigen()` a `varsEnDestino()`.
   - En modo texto: transiciona `fontSize`, `lineHeight`, `color`, `fontWeight`.
   - En modo caja: transiciona `width`, `height`, `top`, `left`, `borderRadius`.
3. **Entrada Diferenciada de Contenido**:
   - El contenido no aparece de golpe; espera un pequeño delay (`delay: d * 0.35`) mientras la caja se abre.
   - Aplica la animación seleccionada (`contentAnimation`: `slide-up`, `slide-down`, `scale` o `fade`).

---

### Fase 3: Aterrizaje y Estado Abierto (`open`)

1. **Relevo Atómico**:
   - Al completar el vuelo, se ejecuta `box.classList.add("wisspop-open")` y `gsap.set(flying, { opacity: 0 })` en el mismo frame síncrono.
   - El título real dentro del modal (que estaba en `opacity: 0` mediante CSS) se vuelve visible en el instante exacto en que la copia se apaga.
2. **Estabilización de Scroll (`updateScrollability`)**:
   - Se evalúa si el contenido desborda la ventana: `scrollHeight > clientHeight + 1.5px`.
   - Si desborda, se activa `overflow-y: auto`. Si no desborda, permanece en `overflow: hidden` para **evitar que aparezca y desaparezca una barra de scroll parpadeante**.
3. **Atrapado de Foco y Accesibilidad**:
   - Se guarda el foco previo y se coloca el foco dentro del primer elemento interactivo (`autofocus` o primer botón/input).
   - Se activa el listener de tecla `Escape` y el `ResizeObserver` para reajustar la altura si el contenido muta en vivo.

---

### Fase 4: Cierre Coordinado y Retorno Suave (`close`)

El cierre no es una simple inversión automática; requiere orquestación precisa para evitar parpadeos:

1. **Limpieza visual inmediata**:
   - `gsap.set(content, { autoAlpha: 0 })`: Se oculta el contenido interno en el frame 1 para que la caja que se encoge esté completamente limpia y no muestre texto aplastado.
2. **Re-medición en Vivo**:
   - Se re-mide la posición actual del botón en la página por si hubo scroll durante el tiempo que el modal estuvo abierto.
3. **Sincronización Atómica (`Promise.all`)**:
   - Todos los tweens corren en paralelo y se esperan juntos:
     - Retorno de la geometría (`geom -> o.rect`).
     - Vuelo de regreso del elemento viajero (`flying -> o.rect`).
     - Transición del color de fondo (`backgroundColor -> o.bgColor`).
     - Disolución de sombras (`boxShadow -> none`).
     - **Crossfade Suave del Origen**: Durante el último 35% del cierre (`delay: d * 0.65`), el botón original de la página se desvanece suavemente de `opacity: 0 -> 1`.
4. **Desmontaje Limpio**:
   - Al terminar `Promise.all`: se remueve la caja, se libera `clearProps: "all"` y se restaura el scroll del body (`releaseScrollLock()`).

---

## 3. El Elemento Viajero: Modo `text` vs Modo `box`

WissPop detecta automáticamente la mejor forma de escalar el elemento volador:

| Característica | Modo `"text"` (Tipografía Viva) | Modo `"box"` (Contenedores Complejos) |
| :--- | :--- | :--- |
| **¿Cuándo se usa?** | Botones con texto o icono medido en `em` (`<button><span>Texto</span></button>`). | Formularios, inputs (`<input>`), imágenes (`<img>`), avatar o tarjetas. |
| **Mecanismo de escala** | Anima `fontSize` y `lineHeight`. El texto se re-renderiza con fuentes vectoriales nítidas en cada frame. | Anima `width` y `height` del contenedor con `box-sizing: border-box`. |
| **Preservación CSS** | Escala iconos proporcionales mediante unidades relativas (`em`). | Mantiene `display: flex; align-items: center;` sin romper alineaciones internas. |

---

## 4. Efectos Internos de Contenido

### `contentAnimation`
Controla cómo entra y sale el cuerpo del modal mientras la caja se expande:

- **`slide-up`**: El contenido entra desplazándose hacia arriba (`y: 24 -> 0`) con curva `power3.out`. Ideal para dashboards y compras.
- **`slide-down`**: El contenido desciende suavemente (`y: -24 -> 0`). Ideal para Command Palettes y buscadores.
- **`scale`**: El contenido entra escalando (`scale: 0.85 -> 1.0`) con curva elástica `back.out(1.7)`. Ideal para confirmaciones y diálogos importantes.
- **`fade`**: Transición pura de opacidad progresiva (`autoAlpha: 0 -> 1`).
- **`none`**: El contenido se monta sin micro-animación interna.

### `contentStagger`
- Si se activa `contentStagger: true`, WissPop busca automáticamente elementos hijos interactivos (`.stagger-item`, `.cmd-item`, `.payment-card`, `[data-stagger]` o hijos directos) y los hace aparecer en cascada escalonada con `stagger: 0.05s` y desplazamiento vertical suave.

---

## 5. Física de Gesto: Swipe to Close

Cuando `swipeToClose: true` está habilitado:

1. El usuario puede arrastrar el modal con el mouse o con el dedo táctil en cualquier dirección.
2. Si el arrastre supera el umbral de distancia o velocidad (inercia):
   - El modal es descartado en la dirección del lanzamiento (`fling.x`, `fling.y`) con `autoAlpha: 0`.
   - **Regla física de oro**: Un modal descartado por gesto **no regresa al botón de origen**, ya que la mano del usuario indicó explícitamente hacia dónde deseaba enviarlo.
3. Si el usuario suelta antes del umbral:
   - El modal regresa elásticamente a su posición central de reposo (`x: 0, y: 0`).

---

## 6. Mejores Prácticas Obligatorias

1. **Unificar Métricas de Elementos**:
   - Si un input o barra en la página viaja hacia un modal, asegúrate de que ambos compartan el mismo `line-height`, `font-size`, `gap` y `padding: 0` para evitar saltos de altura o desalineaciones.
2. **Utilizar `con-icono` para Iconos Relativos**:
   - Los iconos deben medirse en `1.1em` - `1.2em` con `currentColor` para heredar automáticamente el color y tamaño del texto mientras vuelan.
3. **Evitar Listeners de `focus` en Inputs Desencadenadores**:
   - Cuando el disparador es un `<input>` real, vincúlalo a `"click"` o `"keydown"`, no a `"focus"`. De lo contrario, cuando el modal se cierre y devuelva el foco mediante accesibilidad, creará un bucle infinito de reapertura.
4. **Liberar VRAM con `willChange = "auto"`**:
   - Aplicar `will-change` solo durante el ciclo activo de animación y removerlo al completar el estado `open` o `closed`.

---

## 7. 🚫 Cosas que NUNCA se deben hacer (Antipatrones)

> [!CAUTION]
> Evita estrictamente estas prácticas para prevenir parpadeos, congelamientos o bugs visuales:

- ❌ **NO forzar `display: block` sobre los hijos del elemento volador**:
  - Forzar `display: block` destruye los contenedores `display: flex; align-items: center;`, provocando que los iconos y los textos se desalineen verticalmente en pleno vuelo.
- ❌ **NO esperar tweens de forma desacoplada en `close()`**:
  - Nunca hagas `await gsap.to(geom)` mientras `gsap.to(flying)` corre por su cuenta. Si la geometría termina un frame antes, el texto volador se destruirá a mitad de camino produciendo un parpadeo. Usa siempre `await Promise.all([ ... ])`.
- ❌ **NO dejar el origen en `opacity: 0` hasta el último milisegundo**:
  - Si el botón original tiene elementos adicionales (bordes, divisores, texto secundario), restaurar su opacidad en el frame final produce un salto brusco ("pop-in"). Utiliza un crossfade suave en los últimos frames de la trayectoria.
- ❌ **NO usar `overflow-y: auto` permanente en la caja**:
  - Provoca que el navegador dibuje una barra de scroll que aparece y desaparece durante la expansión. La caja debe nacer con `overflow: hidden` y solo activar scroll condicional tras finalizar la transición de entrada.
- ❌ **NO usar `innerHTML` sin limpiar duplicados**:
  - Al clonar un botón completo hacia el elemento viajero, limpia estilos duplicados de fondo (`background: transparent`) y bordes (`border: none`) para que no se superpongan a la caja que ya está animando el fondo.

---

*Documentación generada para WissPop.*

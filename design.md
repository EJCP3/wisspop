# WissPop — Diseño

Decisiones de arquitectura y las razones detrás de ellas. Varias de estas reglas existen
porque la alternativa obvia falla de forma sutil; donde es así, está documentado el síntoma
concreto.

---

## 1. Arquitectura en tres capas

```
core/           JS puro + GSAP. Recibe elementos del DOM, no sabe de frameworks.
  pillModal.ts    createPillModal(container, flyingText, opts) → { open, close, … }
  morphModal.ts   createMorphModal(modal, overlay, content, opts) → { open, close, … }
  flipModal.ts    createFlipModal(trigger, modal, flipId, opts) → { open, close, … }
  dropdown.ts     enterAnimation(el, done) / leaveAnimation(el, done)

vue/            Wrapper: Teleport, refs, defineExpose. ~60 líneas por componente.
react/          Wrapper: createPortal, useRef, useImperativeHandle.
                `mount()` NO puede resolver con `flushSync` — revienta con
                "flushSync was called from inside a lifecycle method" en cuanto
                open() se dispara desde un useEffect (el caso del prop `open`
                declarativo). Se usa `useDomMount()`: un hook que no resuelve el
                mount hasta que un useEffect —que corre DESPUÉS del commit, con
                los refs ya poblados— confirma que el estado `visible` prendió.
```

**Por qué el core no puede tener framework adentro:** casi todo lo que hace es
`getBoundingClientRect()`, `getComputedStyle()`, `gsap.to()` y `ResizeObserver`. Nada de eso
necesita reactividad. Lo único que sí es responsabilidad del framework es *montar y
desmontar el DOM* y *exponer la API al padre* — y eso es exactamente lo que queda en el
wrapper.

**Contrato del core.** Cada factory recibe elementos ya montados y devuelve:

```ts
{
  open(origin: HTMLElement | Rect, label?: string): Promise<void>
  close(): Promise<void>
  changeView(mutate: () => void): Promise<void>   // cambiar contenido sin cerrar
  resync(duration?: number): void                  // el contenido cambió de alto
  destroy(): void                                  // desconectar observers
}
```

`open` acepta un `Rect` además de un elemento para el caso "no hay botón visible, que nazca
del centro de la pantalla".

---

## 2. La geometría se anima en un objeto, no en el elemento

```js
const geom = { w: 0, h: 0, top: 0, left: 0, radius: 999 }

gsap.to(geom, {
  w: targetW, h: targetH, top, left, radius,
  onUpdate: () => applyGeom(),   // vuelca geom → element.style
})
```

**Por qué no animar el elemento directo.** En Vue, si GSAP escribe en `element.style` y el
componente re-renderiza (porque cambió una vista interna, apareció un error, cambió el
modo), Vue reaplica su propio binding de `:style` y **pisa la geometría de GSAP**. El
síntoma real observado: al cambiar de login a registro dentro del modal, el panel se
encogía de golpe al tamaño de la píldora inicial a mitad de la animación.

Animando un objeto plano y volcándolo a un `ref` reactivo, el framework sigue siendo el
único que escribe el style — GSAP solo le dicta los valores.

En el core sin framework este rodeo no hace falta (no hay nadie que pise el estilo), pero se
mantiene porque los wrappers de Vue/React sí lo necesitan y el costo es nulo.

---

## 3. Medición

### Borrar el estilo inline, no poner `auto`

```js
gsap.set(modal, { width: "", height: "" })   // ✅
gsap.set(modal, { width: "auto" })            // ❌
```

Un `width: auto` inline **gana sobre las clases CSS**. En un modal con ancho declarado por
CSS (`sm:w-[26rem]`), medir con `auto` da el ancho *intrínseco del contenido*, no el ancho
real. Medido en vivo: animaba hacia 305px y al limpiar los estilos inline al terminar
**saltaba de golpe a 416px**. Con `""` se borra lo inline, manda el CSS, y se mide lo
correcto.

### El alto se sigue con ResizeObserver, no midiendo tras `nextTick`

El primer intento fue recalcular el alto a mano después de cada cambio de vista. Medir tras
`nextTick` (incluso llamándolo dos veces) **leía el DOM anterior**: el alto quedaba un paso
por detrás — al pasar a registro tomaba el de login — y recortaba contenido, porque el
contenedor es `overflow-hidden`.

El `ResizeObserver` reacciona al tamaño real ya aplicado, sin depender del scheduler del
framework.

**Pero el observer solo no alcanza.** Entrega sus avisos junto al pintado del frame; si la
pestaña no está componiendo o el aviso llega tarde, el panel se queda con el alto viejo. Por
eso `changeView` además llama a `resync()` de forma explícita. Los dos mecanismos juntos:
el explícito cubre el caso rápido, el observer cubre todo lo demás.

### El alto se mide con el rect, no con `scrollHeight`

`scrollHeight` **no incluye los bordes**, pero el alto se aplica como `border-box`. En un panel
con `border: 1px` la caja quedaba exactamente 2px corta: suficiente para que el navegador
decidiera que el contenido no entra y dibujara una **barra de scroll permanente** en un panel
que en realidad entraba justo. Medir con `getBoundingClientRect().height` mientras el alto está
en `auto` da el alto border-box real, bordes incluidos.

### El contenedor del contenido no puede tener `height: 100%`

El wrapper interno del contenido llevaba `h-full` desde la versión original. Con alto
completo, su `scrollHeight` **nunca puede reportar menos que el alto actual de la caja**: es un
piso que solo sube. El síntoma: el panel crecía al aparecer un mensaje de error, pero al volver
a una vista más corta se quedaba con el alto de la vista larga y dejaba un hueco vacío abajo.
Peor, el `ResizeObserver` solo veía sus propios cambios de tamaño, así que no servía para nada.

Se arregla por los dos lados: el contenido va a alto natural (`flex: 0 0 auto`), y `resync`
remide soltando el alto de la caja (`height: auto` + `scrollHeight`) en vez de leer el
`scrollHeight` del contenido. Recién así medir y observar dicen la verdad en ambas direcciones.

### El destino del texto viajero se mide, no se hardcodea

La versión original usaba `TITLE_OFFSET_Y = 152` — "padding-top 72 + logo 56 + margen 24".
Frágil: cualquier cambio en el logo o el padding desalineaba el aterrizaje sin que nada
avisara.

Ahora el consumidor marca el destino con `data-wisspop-title` y la librería mide dónde cae ese
elemento con la geometría final aplicada (aplicándola al DOM directo, leyendo, y
revirtiendo). El título puede estar donde sea dentro del contenido.

---

## 4. Secuencia de animación

### Apertura

| # | Qué | Duración |
|---|---|---|
| 1 | Montar el DOM, medir destino fuera de pantalla | — |
| 2 | Poner la caja en el rect del botón, contenido oculto | — |
| 3 | Overlay fade in | 0.4s |
| 4 | Caja crece hacia su tamaño final | 0.45–0.65s |
| 5 | Contenido entra (opacity + y + blur opcional) | 62.5% de (4), con delay del 37.5% |

Las proporciones del paso 5 son relativas a la duración de la caja, no absolutas: así el
contenido siempre termina de revelarse justo cuando la caja termina de crecer, sea cual sea
la duración configurada.

### Cierre

Es más lento que la apertura (0.6–0.7s vs 0.45–0.65s) y a propósito. Al abrir, el usuario
ya sabe qué pidió y quiere verlo ya. Al cerrar, la animación tiene que *mostrarle a dónde
volvió* el panel — apurarla rompe justamente lo que la librería intenta construir.

El overlay se desvanece con un flag propio (`overlayVisible`), no con el mismo que controla
el modal. Ese sigue en `true` hasta que la animación termina, así que compartirlo hacía que
el fondo desapareciera de golpe al final en vez de acompañar al panel.

### El relevo origen → caja es instantáneo, no un crossfade

La versión inicial hacía fade-out del origen y fade-in de la caja. Suena bien y se ve mal: por
todo el solapamiento se ven las dos cosas. Con texto viajero es peor, porque se ve el label del
botón y su copia voladora separándose como dos objetos distintos. Y como la caja tarda en
volverse visible, para cuando se la ve ya está a media distancia — se lee como que el panel
apareció de un saltito, no como que el botón se transformó.

El relevo correcto no necesita ningún fade. La caja arranca sobre el rect y el radio exactos
del origen, **con su color de fondo** y ya opaca, así que lo tapa por completo: el origen se
oculta de golpe y no hay nada que se vea desaparecer. El fondo se interpola hasta el color
propio del panel mientras crece. Al cerrar es igual al revés, y el origen vuelve en el mismo
bloque síncrono en que se desmonta la caja — el navegador no pinta entre esas dos líneas, así
que no hay ni un frame con los dos ni con ninguno.

### El origen se oculta mientras el panel lo cubre

Si el botón se queda visible mientras el panel crece desde él y se va al centro de la pantalla,
se ven los dos a la vez y la transición deja de leerse como que uno *se convirtió* en el otro:
se lee como que apareció una sombra al lado. El origen se desvanece rápido (40% de la duración
de la caja) para haber desaparecido antes de que el panel se despegue, y vuelve al final del
cierre, no al principio — si reapareciera de entrada, el ojo tendría dos cosas donde mirar
justo cuando el panel arranca la vuelta.

Solo aplica cuando el panel efectivamente lo cubre (`center`, `drawer-left`). Un dropdown
anclado debajo de su botón tiene que dejarlo visible: ahí los dos elementos conviven y ocultar
el botón sería lo raro.

### Con el scroll siguen solo los que dependen del origen

Un panel anclado que se queda fijo mientras la página scrollea se despega de su botón y deja de
leerse como suyo — rompe justo lo que la librería construye. Así que los anclados (`top`,
`bottom`, `left`, `right`, `origin`) se reposicionan con el scroll y el resize, **sin
animación**: tienen que seguir al origen 1:1, y cualquier tween los dejaría arrastrándose un
frame por detrás del botón.

`center` y los drawers no están atados a nada, así que moverlos sería lo raro: se quedan
quietos. El listener va con `capture` para enterarse también del scroll de contenedores
internos, que no burbujea.

### Descartar con el gesto no es lo mismo que cerrar

Con `swipeToClose`, el panel arrastrado más allá del umbral **no vuelve al origen**: se va para
donde lo tiraron. La mano ya dijo a dónde va, y hacerlo volver al botón contradiría el gesto
que el usuario acaba de hacer. Es la única salida de la librería que no es un morph, y es
deliberado.

**`setPointerCapture` en el pointerdown rompe el click de cualquier botón de adentro.** Fue un
bug real, no hipotético: al activar el gesto en todas las demos, todos los botones de cerrar
—incluida cualquier × propia— dejaron de responder. La causa: `setPointerCapture` se pedía en
el mismo `pointerdown` que arranca el seguimiento, antes de saber si eso terminaría siendo un
arrastre o un simple clic. En cuanto hay captura activa, Chrome retargetea también el `click`
de compatibilidad al elemento que capturó — así que un clic en un botón *adentro* de la caja ya
no llega al botón, llega a la caja, y `e.target.closest("[data-close]")` falla porque el target
ahora es la caja misma.

El arreglo es correr la captura después del umbral de 8px, junto con el resto de lo que ya
decide si es arrastre: si nunca hay arrastre, nunca hay captura, y el clic sale sin tocar. Un
simple clic —el caso más común, con mucha diferencia— nunca pasa por `setPointerCapture`.

**El navegador pelea por el gesto y hay que ganarle en tres frentes.** Con eventos sintéticos
todo esto es invisible: solo aparece con un mouse o un dedo de verdad.

- **`user-select: none`** — arrastrar con el mouse sobre el texto del panel inicia una
  selección, y sobre texto ya seleccionado, un drag nativo. Cualquiera de los dos se queda con
  el gesto y lo corta con un `pointercancel`: el panel deja de seguir la mano.
- **`dragstart` con `preventDefault`** — una imagen o un enlace adentro siguen siendo
  arrastrables por defecto aunque el texto no se pueda seleccionar.
- **`touch-action: none`** — si no, el navegador se queda con el arrastre para scrollear la
  página y el panel no se mueve.

Y `pointercancel` **no** es un `pointerup`: el navegador se quedó con el puntero, no hay gesto
que interpretar. El panel vuelve a su lugar en vez de descartarse.

Dos guardas más que tampoco son opcionales:

- **Umbral de 8px antes de considerarlo arrastre.** Sin eso, un clic con un temblor de 2px
  mueve el panel y los botones de adentro dejan de responder.
- **La velocidad sola no descarta.** Un temblor corto y rápido da una velocidad altísima sobre
  10px; se le exige además un recorrido mínimo de 30px.

El gesto no arranca sobre `input`, `textarea`, `select` ni `contenteditable`: ahí el arrastre es
del usuario, no del panel. Y la caja lleva `touch-action: none` mientras está activo, o el
navegador se queda con el gesto para scrollear la página y el panel no se mueve.

### El botón de cerrar es opcional y vive en el adaptador, no en el core

`closeButton: true` agrega una × que flota sobre el panel sin ocupar espacio en el layout del
consumidor. El core no la conoce — no crea DOM, así que esto vive en `vanilla/index.js` y en
los dos wrappers de Vue, no en `morph.js`. Es `position: absolute` contra la caja (no `fixed`
contra la ventana): un hijo absoluto no sigue el scroll de su propio contenedor, se ancla a la
caja misma, así que queda pinneada arriba a la derecha aunque el contenido interno scrollee.

### El origen se vuelve a medir al cerrar

Entre abrir y cerrar el botón pudo moverse: la página scrolleó, la card perdió el hover y
bajó, cambió el tema. Volver a leer su rect en el cierre evita el "salto" al final de la
animación.

---

## 5. Reglas específicas de FLIP

`Flip.getState()` matchea elementos por `data-flip-id`. Si se busca con
`document.querySelectorAll()`, se capturan **también las copias ocultas 0x0** del otro lado
de la transición, que comparten el mismo id — y el matching se confunde.

La búsqueda tiene que estar escopada al contenedor correcto en cada dirección: al `trigger`
cuando se abre, al `modal` cuando se cierra.

Se anima `width`/`height` reales, no `scale`. Con `scale` el `border-radius` se deforma
(un radio de 16px escalado 3x se ve como 48px) y el texto queda borroso durante el
movimiento.

---

## 6. Detalles del texto viajero (PillModal)

- **Vive fuera del contenedor.** El panel es `overflow-hidden` mientras anima; si el texto
  viviera adentro, quedaría recortado durante todo el viaje.
- **`font-size` se anima, no `scale`.** Escalar texto lo deja borroso; animar el tamaño de
  fuente lo mantiene nítido en cada frame.
- **El color también viaja.** El elemento volador arranca con el color computado del origen y
  se interpola hasta el del destino. Si arranca directamente con el color de destino, en el
  instante del despegue el glifo cambia de color de golpe y deja de leerse como el mismo objeto
  moviéndose: se lee como que uno se apagó acá y otro se encendió allá. Se notó con un `+`
  blanco sobre un botón oscuro que aterrizaba en un título de color de acento.
- **El título real está en `opacity: 0` hasta que el viaje termina**, y esa visibilidad la
  resuelve una regla CSS colgada de la clase `.wisspop-open` de la caja, no un `gsap.set` inline.
  Razón concreta: al volver de una sub-vista el `<h2>` se vuelve a crear desde cero, y un
  estilo inline aplicado una sola vez al abrir no sobrevive — el título salía en blanco.
- **El relevo copia → original es un corte, sin transición en ninguna dirección.** Es la misma
  regla que el relevo origen → caja al abrir: para cuando ocurre, el elemento viajero ya
  coincide con el destino en posición, tamaño, color, radio y recorte, así que cambiar uno por
  el otro no se ve. Un fade de por medio hace justo lo contrario — con `transition: opacity
  .15s` el volador se ocultaba de golpe y el título tardaba 150ms en aparecer, dejando una
  ventana donde no se veía **ninguno de los dos**: un parpadeo al terminar la entrada. Y en la
  dirección opuesta, al cerrar, se veían los dos a la vez: el icono duplicado.

  El orden importa: se muestra el original y **después** se oculta la copia, en el mismo
  bloque síncrono, para que no haya un frame sin ninguno. Se verifica con un
  `MutationObserver` — si las dos mutaciones llegan en la misma invocación, no hubo pintado
  entre medio.
- **La copia pierde todo lo que le llegaba por selectores con ancestro.** Un
  `cloneNode` del icono del botón deja de estar dentro del botón, así que reglas como
  `.boton .icono` o `.card img` ya no le aplican: la copia hereda del `body` y aparece con
  otro color, otro redondeo y otra tipografía. Como el relevo original → copia es
  instantáneo, ese desajuste se ve como un **parpadeo** justo en el frame donde la
  transición tiene que ser invisible. Síntomas concretos: una estrella blanca en su botón
  salía negra al despegar, y una miniatura con `border-radius: 10px` despegaba cuadrada y se
  redondeaba a mitad de vuelo.

  Se arregla leyendo los estilos computados **del nodo real** (no los del botón que lo
  contiene) y reponiéndolos en el elemento viajero: `color` y `border-radius` se interpolan
  hasta los del destino, y `font-family`, `font-style` y `letter-spacing` se setean una vez.
  El `color` tiene que ir en **los dos modos** — al principio solo estaba en modo texto, que
  es exactamente por qué el icono en modo `box` era el que peor se veía.
- **Dos modos de escalado, no cuatro formatos.** Lo que viaja puede ser texto, un icono, las
  dos cosas, o una imagen — pero lo único que cambia de verdad entre esos casos es *cómo se
  agranda*. Con texto hay que animar `font-size` (lo demás lo deja borroso); sin texto hay que
  animar `width`/`height`, porque una imagen no se mueve con el tamaño de fuente. El modo se
  elige solo mirando si el contenido tiene texto. Texto+icono cae en modo texto y funciona sin
  caso especial siempre que el icono esté medido en `em`.
- **En modo texto se igualan las métricas, no la caja.** El elemento viajero es
  `white-space: nowrap` porque no puede reflowear a mitad de vuelo. Si el destino parte el
  mismo contenido en dos líneas, el aterrizaje no puede coincidir: medido, un destino que
  envolvía daba 296×68 contra 300×37 del volador. Con el destino en `nowrap`, 315×34 contra
  300×37 — la posición clava y solo sobra el ancho del espaciado inline.
- **Si el contenido viajero es un nodo montado, su rect es el punto de partida.** Ahí
  `labelOffsetX` deja de usarse: se mide de dónde despega en vez de adivinarlo.
- **`line-height` importa tanto como `font-size`.** El elemento volador se posiciona por la
  esquina de su caja; si su alto de línea no coincide con el del destino, el glifo cae en otro
  lugar *dentro* de esa caja y el aterrizaje queda corrido aunque las coordenadas sean exactas.
  Medido: un volador sin `line-height` (`normal` ≈ 1.2 × 34px) contra un destino con
  `line-height: 1` aterrizaba 16.5px arriba. Igualando el alto de línea el desfase queda en
  0.3px. Se interpola también el `font-weight`, por la misma razón.
- **`origin-left`** en el elemento viajero: crece hacia la derecha desde su borde izquierdo,
  que es donde está anclado el texto en ambos extremos.

---

## 7. `overflow` durante la animación

Mientras la caja crece, el contenido (por ejemplo 646px) no entra en el contenedor (60px al
arrancar) y el navegador dibuja una **barra de scroll de 15px** que aparece y desaparece.

Durante la animación: `overflow: hidden`. Ya asentado: `overflow-y: auto`, que solo muestra
barra si de verdad hace falta (pantallas muy bajas).

---

## 8. Limpieza

Al terminar el cierre hay que borrar los estilos inline que dejó GSAP
(`gsap.set(el, { clearProps: "all" })`), o el framework no recupera el control del `display`
y de los eventos de puntero. Sin esto, el panel cerrado sigue interceptando clics.

Mientras `isAnimating` está activo, el panel lleva `pointer-events: none`: un clic a mitad
de la transición dispararía una segunda animación sobre una geometría a medio camino.

---

## 9. Decisiones pendientes

| Tema | Estado |
|---|---|
| Wrapper de React | ✅ Implementado (`src/react/*.jsx`) y verificado contra `apps/react-docs` |
| Trampa de foco y `Escape` | ✅ Implementado — A11Y-1/A11Y-3 en el core, todos los wrappers |
| `prefers-reduced-motion` | ✅ Implementado — A11Y-5 en el core |
| Formato de distribución | Sin decidir: copiar archivos vs. paquete npm. Copiar alcanza hasta que haya dos proyectos manteniéndose en paralelo |

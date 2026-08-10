<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="overlayEl"
      class="wisspop-overlay"
      :class="overlayClass"
      @click="requestClose"
    />
    <!-- Vive FUERA del panel: el panel es overflow-hidden mientras anima, así
         que un elemento viajero de adentro quedaría recortado durante todo el
         viaje (design.md §6). Solo se monta si el consumidor pidió texto
         viajero, igual que el `createModal` de vanilla. -->
    <div
      v-if="visible && flyingTextClass != null"
      ref="flyingEl"
      class="wisspop-flying-text"
      :class="flyingTextClass"
    />

    <div
      v-if="visible"
      ref="boxEl"
      class="wisspop-box"
      :class="modalClass"
      :style="boxStyle"
      @click.stop
    >
      <div ref="contentEl" class="wisspop-content">
        <slot :close="requestClose" />
      </div>
      <button
        v-if="closeButton"
        type="button"
        class="wisspop-close"
        :class="closeButtonClass"
        aria-label="Cerrar"
        @click="requestClose"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount, useAttrs } from "vue";
import { createMorph } from "../core/morph.js";
import { attrsToOptions } from "./attrs-to-options.js";
import { soloDefinidos } from "../shared/solo-definidos.js";

// Los attrs son configuración del core, no atributos para el elemento raíz —
// que además no existe: el template es multi-root dentro del Teleport.
defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** HTMLElement | selector CSS | Rect literal */
  originRef: { type: [Object, String], default: null },
  placement: { type: String, default: "center" },
  align: { type: String, default: "center" },
  gap: { type: Number, default: 16 },
  /**
   * Velocidad y curva. Sin default propio A PROPÓSITO: si el wrapper mandara
   * siempre un valor, pisaría al del core y `setDefaults()` no serviría de
   * nada. Sin poner nada manda el core (0.55 / 0.7, o lo que fije setDefaults).
   * El cierre tiene su propio ritmo: no es la apertura al revés.
   */
  duration: { type: Number, default: undefined },
  ease: { type: String, default: undefined },
  closeDuration: { type: Number, default: undefined },
  closeEase: { type: String, default: undefined },
  contentBlur: { type: Boolean, default: true },
  /**
   * Texto viajero. Si es `null` (default) no se monta nada y el modal se
   * comporta como antes; con cualquier string —incluso vacío— se crea el
   * elemento que viaja, misma condición que usa `createModal` de vanilla.
   */
  flyingTextClass: { type: String, default: null },
  /**
   * Qué viaja del origen al panel: un string o un nodo (se clona, el original
   * se queda en el botón). Es el default del `label` de `open()`, para que el
   * camino declarativo por `v-model` también pueda tener elemento viajero.
   */
  label: { type: [String, Object], default: null },
  labelOffsetX: { type: Number, default: 24 },
  /** `"text"` · `"box"` · `null` (automático). Ver DEFAULTS del core. */
  flyingMode: { type: String, default: null },
  /** Los estilos son del consumidor: la librería solo se ocupa del movimiento. */
  modalClass: { type: String, default: "" },
  overlayClass: { type: String, default: "" },
  /** Botón × propio, para cuando no querés armar el tuyo con el `close` del slot. */
  closeButton: { type: Boolean, default: false },
  closeButtonClass: { type: String, default: "" },
  closeOnEscape: { type: Boolean, default: true },
  trapFocus: { type: Boolean, default: false },
  restoreFocus: { type: Boolean, default: true },
  lockScroll: { type: Boolean, default: false },
  ariaLabel: { type: String, default: null },
  ariaLabelledby: { type: String, default: null },
});

const emit = defineEmits(["update:modelValue", "close"]);

const visible = ref(false);
const boxStyle = ref({});
const boxEl = ref(null);
const contentEl = ref(null);
const overlayEl = ref(null);
const flyingEl = ref(null);

// Se leen una vez, igual que las props: el core se crea una sola vez.
const opcionesExtra = attrsToOptions(useAttrs());

/**
 * La geometría entra por `onGeom` a un ref reactivo en vez de que GSAP escriba
 * `boxEl.style`: si GSAP escribiera el style directo, cualquier re-render de
 * Vue reaplicaría su binding y pisaría la animación a mitad de camino
 * (design.md §2).
 *
 * Las props se leen una vez al crear el core, porque este componente abre por
 * `v-model` y no hay dónde pasar overrides. Para elegir la posición al abrir,
 * usá la API imperativa: `open()` acepta opciones por llamada.
 */
const core = createMorph(
  {
    box: () => boxEl.value,
    content: () => contentEl.value,
    overlay: () => overlayEl.value,
    flyingText: () => flyingEl.value,
  },
  {
    // Primero: lo que el wrapper cablea explícitamente siempre gana.
    ...opcionesExtra,
    placement: props.placement,
    align: props.align,
    gap: props.gap,
    ...soloDefinidos({
      duration: props.duration,
      ease: props.ease,
      closeDuration: props.closeDuration,
      closeEase: props.closeEase,
    }),
    contentBlur: props.contentBlur,
    labelOffsetX: props.labelOffsetX,
    flyingMode: props.flyingMode,
    closeOnEscape: props.closeOnEscape,
    trapFocus: props.trapFocus,
    restoreFocus: props.restoreFocus,
    lockScroll: props.lockScroll,
    ariaLabel: props.ariaLabel,
    ariaLabelledby: props.ariaLabelledby,
    onGeom: (g) => {
      boxStyle.value = {
        width: `${g.w}px`,
        height: `${g.h}px`,
        top: `${g.top}px`,
        left: `${g.left}px`,
        borderRadius: `${g.radius}px`,
      };
    },
    mount: async () => {
      visible.value = true;
      await nextTick();
    },
    unmount: () => {
      visible.value = false;
      boxStyle.value = {};
    },
    // Único lugar donde se avisa. `open()`/`close()` pueden rebotar contra el
    // guard de reentrada (RNF-2) y el evento saldría igual, mintiendo.
    onState: (s) => {
      if (s === "closed") {
        emit("update:modelValue", false);
        emit("close");
      }
    },
  },
);

// Pide el cierre; el aviso al padre sale de `onState`, no de acá. Emitiendo en
// este punto solo se enteraban los cierres que EMPIEZAN afuera (overlay, ×):
// un cierre que arranca adentro del core —el gesto de arrastre, Escape— dejaba
// el `v-model` en `true` con el panel ya cerrado, y no se podía volver a abrir
// porque el watcher no ve un cambio de `true` a `true`.
const requestClose = () => core.close();

const open = (origin = props.originRef, label = props.label, overrides = {}) => {
  return core.open(origin, label, {
    placement: props.placement,
    align: props.align,
    gap: props.gap,
    ...soloDefinidos({
      duration: props.duration,
      ease: props.ease,
      closeDuration: props.closeDuration,
      closeEase: props.closeEase,
    }),
    contentBlur: props.contentBlur,
    ...overrides,
  });
};

const close = () => core.close();

// Sin `immediate`: se dispararía durante el setup, que en SSR corre en el
// servidor y ahí no hay `document` que medir (RNF-3).
watch(
  () => props.modelValue,
  (isOpen) => (isOpen ? open() : close()),
);
onMounted(() => props.modelValue && open());
onBeforeUnmount(core.destroy);

defineExpose({ open, close, changeView: core.changeView, resync: core.resync });
</script>

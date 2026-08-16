<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="overlayEl"
      class="wisspop-overlay"
      :class="overlayClass"
      @click="close"
    />

    <!-- Vive FUERA del panel: el panel es overflow-hidden mientras anima, así
         que un texto de adentro quedaría recortado durante todo el viaje
         (design.md §6). -->
    <div
      v-if="visible"
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
      :data-theme="dataTheme"
      @click.stop
    >
      <div ref="contentEl" class="wisspop-content">
        <slot :title-ready="titleReady" :close="close" />
      </div>
      <button
        v-if="closeButton"
        type="button"
        class="wisspop-close"
        :class="closeButtonClass"
        aria-label="Cerrar"
        @click="close"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, nextTick, onBeforeUnmount, useAttrs } from "vue";
import { createMorph } from "../core/morph.js";
import { attrsToOptions } from "./attrs-to-options.js";

// Ver WissPopMorph.vue: los attrs son configuración del core.
defineOptions({ inheritAttrs: false });

const props = defineProps({
  desktopWidth: { type: Number, default: 540 },
  borderRadius: { type: Number, default: 40 },
  /** Los estilos son del consumidor: la librería solo se ocupa del movimiento. */
  overlayClass: { type: String, default: "" },
  modalClass: { type: String, default: "" },
  flyingTextClass: { type: String, default: "" },
  dataTheme: { type: String, default: null },
  labelOffsetX: { type: Number, default: 24 },
  mobileBreakpoint: { type: Number, default: 640 },
  /**
   * Velocidad y curva del viaje optimizadas para movimientos orgánicos y nítidos.
   */
  duration: { type: Number, default: 0.38 },
  ease: { type: String, default: "power3.out" },
  closeDuration: { type: Number, default: 0.32 },
  closeEase: { type: String, default: "power3.inOut" },
  /** Botón × propio, para cuando no querés armar el tuyo con el `close` del slot. */
  closeButton: { type: Boolean, default: false },
  closeButtonClass: { type: String, default: "" },
  closeOnEscape: { type: Boolean, default: true },
  trapFocus: { type: Boolean, default: true },
  restoreFocus: { type: Boolean, default: true },
  lockScroll: { type: Boolean, default: false },
  ariaLabel: { type: String, default: null },
  ariaLabelledby: { type: String, default: null },
});

const emit = defineEmits(["open", "close", "update:isOpen"]);

const visible = ref(false);
const titleReady = ref(false);
const boxStyle = ref({});
const boxEl = ref(null);
const contentEl = ref(null);
const overlayEl = ref(null);
const flyingEl = ref(null);

const opcionesExtra = attrsToOptions(useAttrs());

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
    placement: "center",
    width: props.desktopWidth,
    radius: props.borderRadius,
    originRadius: 999,
    fullscreenOnMobile: true,
    mobileBreakpoint: props.mobileBreakpoint,
    labelOffsetX: props.labelOffsetX,
    duration: props.duration,
    ease: props.ease,
    closeDuration: props.closeDuration,
    closeEase: props.closeEase,
    contentBlur: false,
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
    /**
     * El título real vive en `opacity: 0` hasta que el texto viajero aterriza, y
     * esa visibilidad tiene que ser estado reactivo, no un `gsap.set` inline: al
     * volver de una sub-vista el `<h2>` se recrea desde cero y un estilo inline
     * aplicado una sola vez al abrir no sobrevive (design.md §6).
     */
    onState: (s) => {
      titleReady.value = s === "open";
      // Emitir acá y no en open()/close(): esas pueden rebotar contra el guard
      // de reentrada (RNF-2) y el evento saldría igual, mintiendo.
      if (s === "opening") emit("update:isOpen", true), emit("open");
      if (s === "closed") emit("update:isOpen", false), emit("close");
    },
  },
);

const open = (origin, label, overrides) => core.open(origin, label, overrides);
const close = () => core.close();

onBeforeUnmount(core.destroy);

defineExpose({ open, close, changeView: core.changeView, resync: core.resync });
</script>

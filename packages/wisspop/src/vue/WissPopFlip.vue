<template>
  <div class="wisspop-flip-trigger-wrapper">
    <!--
      Sin `v-show`: lo esconde con `display: none`, que lo saca del layout — la
      página de abajo salta mientras el modal está abierto, y su rect pasa a ser
      0x0, así que el cierre no tendría a dónde volver. Ocultarlo es del core,
      que usa `visibility: hidden`: invisible pero conservando su lugar.
    -->
    <div
      ref="triggerEl"
      class="wisspop-flip-trigger"
      :class="{ 'wisspop-clickable': triggerClickable }"
      @click="triggerClickable ? open() : undefined"
    >
      <slot name="trigger" :open="open" />
    </div>

    <Teleport to="body">
      <div
        v-if="visible"
        ref="overlayEl"
        class="wisspop-overlay"
        :class="overlayClass"
        @click="close"
      />
      <div
        v-if="visible"
        ref="boxEl"
        class="wisspop-box wisspop-flip-box"
        :class="modalClass"
        @click.stop
      >
        <slot name="modal" :close="close" />
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
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount, useAttrs } from "vue";
import { createFlip } from "../core/flip.js";
import { attrsToOptions } from "./attrs-to-options.js";
import { soloDefinidos } from "../shared/solo-definidos.js";

// Ver WissPopMorph.vue: los attrs son configuración del core.
defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  flipId: { type: String, required: true },
  triggerClickable: { type: Boolean, default: true },
  /**
   * Velocidad y curva. Sin default propio: manda el core, así `setDefaults()`
   * puede fijar el ritmo global. Ver WissPopMorph.vue.
   */
  duration: { type: Number, default: undefined },
  ease: { type: String, default: undefined },
  overlayDuration: { type: Number, default: undefined },
  stagger: { type: Number, default: undefined },
  overlayClass: { type: String, default: "" },
  modalClass: { type: String, default: "" },
  closeButton: { type: Boolean, default: false },
  closeButtonClass: { type: String, default: "" },
  closeOnEscape: { type: Boolean, default: true },
  trapFocus: { type: Boolean, default: true },
  restoreFocus: { type: Boolean, default: true },
  lockScroll: { type: Boolean, default: false },
  ariaLabel: { type: String, default: null },
  ariaLabelledby: { type: String, default: null },
});

const emit = defineEmits(["update:modelValue", "open", "close"]);

const visible = ref(false);
const triggerEl = ref(null);
const boxEl = ref(null);
const overlayEl = ref(null);

const opcionesExtra = attrsToOptions(useAttrs());

const core = createFlip(
  {
    trigger: () => triggerEl.value,
    modal: () => boxEl.value,
    overlay: () => overlayEl.value,
  },
  {
    // Primero: lo que el wrapper cablea explícitamente siempre gana.
    ...opcionesExtra,
    flipId: props.flipId,
    ...soloDefinidos({
      duration: props.duration,
      ease: props.ease,
      overlayDuration: props.overlayDuration,
      stagger: props.stagger,
    }),
    closeOnEscape: props.closeOnEscape,
    trapFocus: props.trapFocus,
    restoreFocus: props.restoreFocus,
    lockScroll: props.lockScroll,
    ariaLabel: props.ariaLabel,
    ariaLabelledby: props.ariaLabelledby,
    mount: async () => {
      visible.value = true;
      await nextTick();
    },
    unmount: () => {
      visible.value = false;
    },
    onState: (s) => {
      if (s === "opening") emit("update:modelValue", true), emit("open");
      if (s === "closed") emit("update:modelValue", false), emit("close");
    },
  },
);

const open = () => core.open();
const close = () => core.close();

watch(
  () => props.modelValue,
  (val) => (val ? core.open() : core.close()),
);

onMounted(() => props.modelValue && core.open());
onBeforeUnmount(core.destroy);

defineExpose({ open, close });
</script>

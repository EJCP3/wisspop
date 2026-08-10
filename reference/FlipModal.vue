<template>
  <div class="inline-block relative w-full h-full">
    <!-- Trigger Slot -->
    <div
      ref="triggerRef"
      v-show="!isOpen"
      class="w-full h-full"
      :class="triggerClickable ? 'cursor-pointer' : ''"
      @click="triggerClickable ? openModal() : undefined"
    >
      <slot name="trigger" :open="openModal"></slot>
    </div>

    <!-- Modal Teleport -->
    <Teleport to="body" :disabled="!teleport">
      <div
        :class="[
          teleport ? 'fixed inset-0 z-[100] flex items-center justify-center p-4' : 'absolute z-[100] top-0 left-0',
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        ]"
      >
        <!-- Overlay -->
        <div
          ref="overlayRef"
          class="inset-0"
          :class="[teleport ? 'absolute' : 'fixed', overlayClass]"
          style="opacity: 0; visibility: hidden"
          @click="closeModal"
        ></div>

        <!-- Modal Container -->
        <div
          ref="modalRef"
          v-show="isOpen"
          :class="modalWrapperClass"
        >
          <slot name="modal" :close="closeModal"></slot>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";

const overlayRef = ref<HTMLElement | null>(null);
const modalRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);

if (import.meta.client) {
  gsap.registerPlugin(Flip);
}

const emit = defineEmits(["close", "open"]);

const props = defineProps({
  flipId: {
    type: String,
    required: true,
  },
  teleport: {
    type: Boolean,
    default: true,
  },
  overlayClass: {
    type: String,
    default: "bg-base-300/80",
  },
  modalWrapperClass: {
    type: String,
    default: "relative w-full max-w-md flex flex-col",
  },
  triggerClickable: {
    type: Boolean,
    default: true,
  }
});

const isOpen = ref(false);
const isAnimating = ref(false);

const openModal = async () => {
  if (isAnimating.value) return;
  isAnimating.value = true;
  emit("open");

  // 1. Mostrar overlay
  gsap.to(overlayRef.value, { autoAlpha: 1, duration: 0.5, ease: "power2.out" });

  // 2. Desvanecer items secundarios del trigger (divisor, botón filtros)
  const triggerFadeItems = document.querySelectorAll(`.trigger-fade-item-${props.flipId}`);
  if (triggerFadeItems.length) {
    gsap.to(triggerFadeItems, { autoAlpha: 0, duration: 0.08, ease: "none" });
    await new Promise((resolve) => setTimeout(resolve, 40));
  }

  // 3. Capturar estado inicial (trigger) — escopado a triggerRef para no
  // capturar también la copia oculta (0x0) del modal, que comparte los
  // mismos data-flip-id y confunde el matching de Flip
  const targets = triggerRef.value
    ? gsap.utils.toArray<HTMLElement>(triggerRef.value.querySelectorAll(`[data-flip-id^="${props.flipId}-"]`))
    : gsap.utils.toArray<HTMLElement>(`[data-flip-id^="${props.flipId}-"]`);
  const flipState = Flip.getState(targets, {
    props: "borderRadius",
  });

  // 4. Pasar al DOM del modal
  isOpen.value = true;
  await nextTick();

  // 5. Ocultar items fade del modal antes de animación
  const modalFadeItems = document.querySelectorAll(`.modal-fade-item-${props.flipId}`);
  if (modalFadeItems.length) {
    gsap.set(modalFadeItems, { autoAlpha: 0, y: 8 });
  }

  // 6. Ejecutar FLIP animando dimensiones reales (sin scale) → border-radius se ve bien
  const newTargets = modalRef.value 
    ? gsap.utils.toArray<HTMLElement>(modalRef.value.querySelectorAll(`[data-flip-id^="${props.flipId}-"]`))
    : gsap.utils.toArray<HTMLElement>(`[data-flip-id^="${props.flipId}-"]`);
    
  Flip.from(flipState, {
    targets: newTargets,
    duration: 0.45,
    ease: "power3.inOut",
    absolute: true,
    nested: true,
    zIndex: 100,
    onComplete: () => {
      if (modalFadeItems.length) {
        gsap.to(modalFadeItems, {
          autoAlpha: 1,
          y: 0,
          duration: 0.22,
          stagger: 0.04,
          ease: "power2.out",
          onComplete: () => { isAnimating.value = false; },
        });
      } else {
        isAnimating.value = false;
      }
    },
  });
};

const closeModal = async () => {
  if (isAnimating.value || !isOpen.value) return;
  isAnimating.value = true;
  emit("close");

  // 1. Ocultar overlay
  gsap.to(overlayRef.value, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" });

  // 2. Desvanecer items fade del modal
  const modalFadeItems = document.querySelectorAll(`.modal-fade-item-${props.flipId}`);
  if (modalFadeItems.length) {
    gsap.to(modalFadeItems, { autoAlpha: 0, duration: 0.12, ease: "none" });
  }

  await new Promise((resolve) => setTimeout(resolve, 40));

  // 3. Capturar estado modal — escopado a modalRef por la misma razón que en openModal
  const targets = modalRef.value
    ? gsap.utils.toArray<HTMLElement>(modalRef.value.querySelectorAll(`[data-flip-id^="${props.flipId}-"]`))
    : gsap.utils.toArray<HTMLElement>(`[data-flip-id^="${props.flipId}-"]`);
  const flipState = Flip.getState(targets, {
    props: "borderRadius",
  });

  // 4. Volver al DOM del trigger
  isOpen.value = false;
  await nextTick();

  const triggerFadeItems = document.querySelectorAll(`.trigger-fade-item-${props.flipId}`);
  if (triggerFadeItems.length) {
    gsap.set(triggerFadeItems, { autoAlpha: 0 });
  }

  // 5. FLIP de vuelta animando dimensiones reales
  const newTargets = triggerRef.value
    ? gsap.utils.toArray<HTMLElement>(triggerRef.value.querySelectorAll(`[data-flip-id^="${props.flipId}-"]`))
    : gsap.utils.toArray<HTMLElement>(`[data-flip-id^="${props.flipId}-"]`);

  Flip.from(flipState, {
    targets: newTargets,
    duration: 0.45,
    ease: "power3.inOut",
    absolute: true,
    nested: true,
    zIndex: 100,
    onComplete: () => {
      if (triggerFadeItems.length) {
        gsap.to(triggerFadeItems, { autoAlpha: 1, duration: 0.18, ease: "power2.out" });
      }
      isAnimating.value = false;
    },
  });
};
</script>

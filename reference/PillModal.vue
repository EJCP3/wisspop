<template>
  <Teleport to="body">
    <!-- Usa su propio flag, no `isVisible`: ese sigue en true hasta que la
         animación de cierre termina, así que el fondo desaparecía de golpe al
         final. Con `overlayVisible` se desvanece a la vez que el modal. -->
    <Transition name="pill-modal-fade">
      <div
        v-if="overlayVisible"
        :class="['fixed inset-0 z-[199]', overlayClass]"
        @click="close"
      />
    </Transition>

    <!-- Texto viajero — vive FUERA del modal para moverse libremente -->
    <div
      v-if="isVisible"
      ref="flyingTextRef"
      class="fixed z-[201] pointer-events-none font-black tracking-tight whitespace-nowrap origin-left"
      :class="flyingTextClass"
      style="will-change: transform, font-size, top, left"
    >
      {{ label }}
    </div>

    <div
      v-if="isVisible"
      ref="containerRef"
      class="fixed z-[200] overflow-hidden origin-top-left shadow-2xl"
      :class="[modalClass, isAnimating ? 'overflow-hidden' : '']"
      :style="containerStyle"
      :data-theme="dataTheme"
    >
      <div ref="innerRef" class="w-full h-full" :class="isAnimating ? 'overflow-hidden' : 'overflow-y-auto'">
        <slot :title-ready="titleReady" :close="close" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import { gsap } from "gsap";

interface Props {
  // Ancho del modal en escritorio (px). En móvil ocupa toda la pantalla.
  desktopWidth?: number;
  // Radio final de esquina (px) en escritorio. En móvil siempre 0.
  borderRadius?: number;
  overlayClass?: string;
  modalClass?: string;
  flyingTextClass?: string;
  dataTheme?: string | null;
  // Cuánto se mete el texto viajero desde el borde izquierdo del botón
  // origen, para alinear con su padding interno.
  labelOffsetX?: number;
  mobileBreakpoint?: number;
}

const props = withDefaults(defineProps<Props>(), {
  desktopWidth: 540,
  borderRadius: 40,
  overlayClass: "bg-black/40",
  modalClass: "bg-base-100 text-base-content",
  flyingTextClass: "text-base-content",
  dataTheme: null,
  labelOffsetX: 24,
  mobileBreakpoint: 640,
});

const emit = defineEmits<{
  open: [];
  close: [];
  "update:isOpen": [boolean];
}>();

const isVisible = ref(false);
const isAnimating = ref(false);
const overlayVisible = ref(false);
const titleReady = ref(false);
const label = ref("");

const containerRef = ref<HTMLElement | null>(null);
const innerRef = ref<HTMLElement | null>(null);
const flyingTextRef = ref<HTMLElement | null>(null);

const containerStyle = ref({
  borderRadius: "999px",
  width: "0px",
  height: "0px",
  top: "0px",
  left: "0px",
});

/**
 * Geometría del contenedor. GSAP anima ESTE objeto (no el DOM) y cada frame se
 * vuelca a `containerStyle`, de modo que Vue sigue siendo el único que escribe
 * el style inline — si GSAP escribiera directo en el elemento, un
 * re-render de Vue (por cambios del slot) lo pisaría de golpe.
 */
const geom = { w: 0, h: 0, top: 0, left: 0, radius: 999 };
const applyGeom = () => {
  containerStyle.value = {
    borderRadius: `${geom.radius}px`,
    width: `${geom.w}px`,
    height: `${geom.h}px`,
    top: `${geom.top}px`,
    left: `${geom.left}px`,
  };
};

/** Mide el alto real del contenido al ancho dado, sin dejar rastro. */
const measureContentHeight = (width: number) => {
  const el = containerRef.value;
  if (!el) return 0;
  const prevW = el.style.width;
  const prevH = el.style.height;
  el.style.width = `${width}px`;
  el.style.height = "auto";
  const h = el.scrollHeight;
  el.style.width = prevW;
  el.style.height = prevH;
  return h;
};

/**
 * Mide dónde aterriza el texto viajero: aplica la geometría final
 * directamente al DOM (sin pasar por Vue/GSAP), lee la posición y tamaño de
 * fuente reales del `[data-pill-title]` del slot, y revierte al estado
 * previo. Evita hardcodear un offset — el título puede estar en cualquier
 * parte del contenido según lo que arme cada consumidor.
 */
const measureTitleTarget = (modalW: number, finalLeft: number, finalTop: number, modalH: number) => {
  const el = containerRef.value;
  const titleEl = el?.querySelector<HTMLElement>("[data-pill-title]");
  if (!el || !titleEl) return null;

  const prev = { ...el.style } as any;
  Object.assign(el.style, {
    width: `${modalW}px`,
    height: `${modalH}px`,
    top: `${finalTop}px`,
    left: `${finalLeft}px`,
  });

  const rect = titleEl.getBoundingClientRect();
  const fontSize = parseFloat(window.getComputedStyle(titleEl).fontSize) || 30;

  el.style.width = prev.width;
  el.style.height = prev.height;
  el.style.top = prev.top;
  el.style.left = prev.left;

  return { top: rect.top, left: rect.left, fontSize };
};

let contentObserver: ResizeObserver | null = null;
const savedState = ref<{
  titleTop: number;
  titleLeft: number;
  titleFontSize: number;
  modalTop: number;
  modalLeft: number;
  modalW: number;
  modalH: number;
  isMobile: boolean;
  finalBorderRadius: number;
  btnRect: { top: number; left: number; width: number; height: number };
  btnFontSize: number;
} | null>(null);

/** Sigue el alto del contenido con un ResizeObserver, para vistas internas que cambian de tamaño. */
const syncHeightToContent = (duration = 0.25) => {
  const s = savedState.value;
  if (!s || s.isMobile || isAnimating.value || !innerRef.value) return;

  const newH = Math.min(innerRef.value.scrollHeight, window.innerHeight - 32);
  if (Math.abs(newH - s.modalH) < 1) return;

  const newTop = Math.max(16, (window.innerHeight - newH) / 2);
  s.modalH = newH;
  s.modalTop = newTop;

  gsap.to(geom, { h: newH, top: newTop, duration, ease: "power3.inOut", onUpdate: applyGeom });
};

const startContentObserver = () => {
  if (!innerRef.value || typeof ResizeObserver === "undefined") return;
  contentObserver = new ResizeObserver(() => syncHeightToContent());
  contentObserver.observe(innerRef.value);
};
const stopContentObserver = () => {
  contentObserver?.disconnect();
  contentObserver = null;
};

/**
 * Cambia de vista interna (ej. login → registro) y reajusta el alto.
 * El cambio de estado va primero y sin esperar animación: si GSAP no llegara
 * a correr, la vista correcta ya está en el DOM — la animación es cosmética.
 */
const changeView = async (mutar: () => void) => {
  const el = innerRef.value;
  mutar();
  await nextTick();
  syncHeightToContent();
  if (el) {
    gsap.fromTo(
      el,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.2, ease: "power2.out", clearProps: "transform" },
    );
  }
};

/** Llamar cuando el contenido cambia de alto (ej. aparece un mensaje de error). */
const resync = (duration = 0.2) => {
  if (!isVisible.value) return;
  nextTick(() => syncHeightToContent(duration));
};

type Rect = { top: number; left: number; width: number; height: number };

const open = async (origin: HTMLElement | Rect, labelText: string) => {
  if (isAnimating.value || isVisible.value) return;
  isAnimating.value = true;
  label.value = labelText;
  emit("open");

  // Acepta un elemento real (mide su rect y font-size) o un rect ya
  // calculado, para poder "nacer" desde un punto sin botón visible.
  const isEl = origin instanceof HTMLElement;
  const btnRect = isEl ? origin.getBoundingClientRect() : origin;
  const btnFontSize = isEl ? parseFloat(window.getComputedStyle(origin).fontSize) || 14 : 14;
  const isMobile = window.innerWidth < props.mobileBreakpoint;

  const modalW = isMobile ? window.innerWidth : Math.min(props.desktopWidth, window.innerWidth - 32);
  const finalLeft = isMobile ? 0 : (window.innerWidth - modalW) / 2;
  const finalBorderRadius = isMobile ? 0 : props.borderRadius;

  geom.w = btnRect.width;
  geom.h = btnRect.height;
  geom.top = btnRect.top;
  geom.left = btnRect.left;
  geom.radius = 999;
  applyGeom();

  overlayVisible.value = true;
  isVisible.value = true;
  emit("update:isOpen", true);
  await nextTick();

  const modalH = isMobile ? window.innerHeight : Math.min(measureContentHeight(modalW), window.innerHeight - 32);
  const finalTop = isMobile ? 0 : Math.max(16, (window.innerHeight - modalH) / 2);
  const titleTarget = measureTitleTarget(modalW, finalLeft, finalTop, modalH);

  savedState.value = {
    titleTop: titleTarget?.top ?? finalTop,
    titleLeft: titleTarget?.left ?? finalLeft,
    titleFontSize: titleTarget?.fontSize ?? 30,
    modalTop: finalTop,
    modalLeft: finalLeft,
    modalW,
    modalH,
    isMobile,
    finalBorderRadius,
    btnRect: { top: btnRect.top, left: btnRect.left, width: btnRect.width, height: btnRect.height },
    btnFontSize,
  };

  const s = savedState.value;
  const textStartTop = btnRect.top + (btnRect.height - btnFontSize) / 2;
  const textStartLeft = btnRect.left + props.labelOffsetX;

  gsap.set(flyingTextRef.value, { top: textStartTop, left: textStartLeft, fontSize: btnFontSize, opacity: 1 });

  gsap.to(geom, {
    radius: finalBorderRadius,
    w: modalW,
    h: modalH,
    top: finalTop,
    left: finalLeft,
    duration: 0.3,
    ease: "power3.inOut",
    onUpdate: applyGeom,
  });

  gsap.to(flyingTextRef.value, {
    top: s.titleTop,
    left: s.titleLeft,
    fontSize: s.titleFontSize,
    duration: 0.3,
    ease: "power3.inOut",
    onComplete: () => {
      titleReady.value = true;
      gsap.set(flyingTextRef.value, { opacity: 0 });
      isAnimating.value = false;
      startContentObserver();
    },
  });
};

const close = async () => {
  if (isAnimating.value || !isVisible.value) return;
  isAnimating.value = true;
  stopContentObserver();
  overlayVisible.value = false;
  emit("close");

  const s = savedState.value!;
  const textEndTop = s.btnRect.top + (s.btnRect.height - s.btnFontSize) / 2;
  const textEndLeft = s.btnRect.left + props.labelOffsetX;

  titleReady.value = false;
  gsap.set(flyingTextRef.value, { top: s.titleTop, left: s.titleLeft, fontSize: s.titleFontSize, opacity: 1 });

  gsap.to(geom, {
    radius: 999,
    w: s.btnRect.width,
    h: s.btnRect.height,
    top: s.btnRect.top,
    left: s.btnRect.left,
    duration: 0.42,
    ease: "power3.inOut",
    onUpdate: applyGeom,
    onComplete: () => {
      isVisible.value = false;
      emit("update:isOpen", false);
      gsap.set(flyingTextRef.value, { opacity: 0 });
      savedState.value = null;
      isAnimating.value = false;
    },
  });

  gsap.to(flyingTextRef.value, {
    top: textEndTop,
    left: textEndLeft,
    fontSize: s.btnFontSize,
    duration: 0.42,
    ease: "power3.inOut",
  });
};

defineExpose({ open, close, changeView, resync });
</script>

<style>
.pill-modal-fade-enter-active {
  transition: opacity 0.35s ease-out;
}
.pill-modal-fade-leave-active {
  transition: opacity 0.45s ease-in;
}
.pill-modal-fade-enter-from,
.pill-modal-fade-leave-to {
  opacity: 0;
}
</style>

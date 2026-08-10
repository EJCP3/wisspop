<template>
  <Teleport to="body">
    <!-- Overlay -->
    <div
      v-if="isVisible"
      ref="overlayRef"
      :class="['fixed inset-0 z-40', overlayClass]"
      @click="close"
    ></div>

    <!-- Modal Container -->
    <div
      v-show="isVisible"
      ref="modalRef"
      class="fixed z-50 flex flex-col overflow-hidden shadow-2xl"
      :class="[modalClass, { 'pointer-events-none': !isVisible || isAnimating }]"
      @click.stop
    >
      <!-- Content Wrapper (para animar la opacidad independiente del contenedor) -->
      <div ref="contentRef" class="w-full h-full">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from "vue";
import { gsap } from "gsap";

interface Props {
  modelValue: boolean;
  originRef: HTMLElement | string | null;
  placement?: "top" | "bottom" | "center" | "drawer-left";
  align?: "left" | "center" | "right";
  gap?: number;
  modalClass?: string;
  overlayClass?: string;
  // Duración del crecimiento de la caja al abrir (segundos). Con paneles
  // grandes y un origen pequeño (ej. un FAB circular), 0.4s por defecto puede
  // sentirse lento porque el salto de tamaño es enorme — bajarlo lo hace más ágil.
  duration?: number;
  // Ease del crecimiento de la caja. El default `back.out(1.1)` SOBREPASA el
  // tamaño final y vuelve — en un panel chico (dropdown/menú) eso se lee como
  // un rebote simpático, pero en un panel grande el sobrepaso es de decenas de
  // píxeles y se lee como "salió más grande de lo que debía". Para paneles
  // grandes conviene un ease sin overshoot (ej. "power3.out").
  ease?: string;
  // El contenido hace fade-in con un blur(4px)->blur(0) además de opacity/y.
  // Se ve bien en paneles chicos (dropdowns, menús), pero en un panel grande
  // con fondo texturado (ej. el chat de "Pregunta rápida") ese blur se nota
  // mucho más tiempo y se lee como "borroso/lavado" en vez de una entrada
  // limpia — desactivarlo deja solo opacity+y, más nítido para esos casos.
  contentBlur?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placement: "center",
  align: "center",
  gap: 16,
  modalClass: "border border-gray-200/60",
  overlayClass: "bg-transparent", // usa bg-black/20 para un fondo oscurecido
  duration: 0.4,
  ease: "back.out(1.1)",
  contentBlur: true,
});

const emit = defineEmits(["update:modelValue", "close"]);

const isVisible = ref(false);
const modalRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const overlayRef = ref<HTMLElement | null>(null);
const isAnimating = ref(false);

const savedState = ref<{
  width: number;
  height: number;
  top: number;
  left: number;
  bgColor: string;
  borderRadius: string;
} | null>(null);

// Variables para los colores dinámicos
const targetBgColor = ref("");
const targetBorderRadius = ref("");

const close = () => {
  if (isAnimating.value) return;
  emit("update:modelValue", false);
  emit("close");
};

const openAnimation = async () => {
  try {
    let originEl = unref(props.originRef);
    if (typeof originEl === "string") {
      originEl = document.querySelector(originEl) as HTMLElement;
    }

    // GUARD 1: Solo evaluamos animating y el botón origen
    if (isAnimating.value || !originEl) {
      if (!originEl) console.warn("[MorphModal] Botón origen no encontrado:", props.originRef);
      return;
    }

    // FIX: Despertamos el DOM ANTES de que GSAP intente leerlo
    isVisible.value = true;
    await nextTick();

    // GUARD 2: Ahora el ref ya debe existir con certeza
    if (!modalRef.value) {
      console.error("[MorphModal] Fallo crítico: modalRef no se montó tras nextTick");
      isVisible.value = false;
      return;
    }

    isAnimating.value = true;

    // 1. Medir el origen
    const btnRect = originEl.getBoundingClientRect();
    const btnStyle = window.getComputedStyle(originEl);

    let rawRadius = parseInt(btnStyle.borderRadius) || 0;
    if (btnStyle.borderRadius.includes("%")) {
      rawRadius =
        (parseInt(btnStyle.borderRadius) / 100) *
        Math.min(btnRect.width, btnRect.height);
    }
    const maxRadius = Math.min(btnRect.width / 2, btnRect.height / 2);
    const safeRadius = rawRadius > maxRadius ? maxRadius : rawRadius;

    savedState.value = {
      width: btnRect.width,
      height: btnRect.height,
      top: btnRect.top,
      left: btnRect.left,
      bgColor:
        btnStyle.backgroundColor === "rgba(0, 0, 0, 0)"
          ? "transparent"
          : btnStyle.backgroundColor,
      borderRadius: `${safeRadius}px`,
    };

    await nextTick();

    // 2. Setup inicial: dejar al contenedor en su tamaño real para medirlo.
    //
    // width/height van en "" (borrar el estilo inline), NO en "auto": un
    // estilo inline `width:auto` GANA sobre las clases del `modalClass`, así
    // que en un modal con ancho declarado por CSS (ej. `sm:w-[26rem]`) se
    // medía el ancho intrínseco del contenido en vez del ancho real —
    // la caja animaba hacia ese valor equivocado y después, al limpiar los
    // estilos inline en onComplete, SALTABA de golpe al ancho del CSS
    // (medido en vivo: animaba a 305px y saltaba a 416px al terminar).
    // Con "" se borra lo inline y el CSS manda, que es lo que se quiere medir.
    // Los dropdowns que ya declaran `w-auto` por CSS (DashboardDropdown) miden
    // exactamente igual que antes, así que no cambia su comportamiento.
    gsap.set(modalRef.value, {
      width: "",
      height: "",
      top: "-9999px",
      left: "-9999px",
      opacity: 0,
      backgroundColor: "",
      borderRadius: "",
      borderColor: "rgba(229, 231, 235, 0.6)",
    });

    // Setear overlay inicial
    if (overlayRef.value) {
      gsap.set(overlayRef.value, { autoAlpha: 0 });
    }

    await nextTick();

    // 3. Medir el destino y sus estilos reales
    const modalRect = modalRef.value!.getBoundingClientRect();
    const modalStyle = window.getComputedStyle(modalRef.value!);
    targetBgColor.value = modalStyle.backgroundColor;
    targetBorderRadius.value = modalStyle.borderRadius;

    const targetWidth = modalRect.width;
    let targetHeight = modalRect.height;

    let targetTop = 0;
    let targetLeft = 0;

    if (props.placement === "center") {
      targetTop = (window.innerHeight - targetHeight) / 2;
      targetLeft = (window.innerWidth - targetWidth) / 2;
    } else if (props.placement === "drawer-left") {
      targetTop = 0;
      targetLeft = 0;
      // Note: targetHeight is implicitly set by window.innerHeight
    } else {
      // Placement Top or Bottom
      if (props.placement === "top") {
        const maxH = btnRect.top - props.gap - 20;
        if (targetHeight > maxH) {
          targetHeight = maxH;
        }
        targetTop = btnRect.top - targetHeight - props.gap;
        if (targetTop < 20) {
          targetTop = 20;
        }
      } else {
        // bottom
        targetTop = btnRect.bottom + props.gap;
        if (targetTop + targetHeight > window.innerHeight - 20) {
          // Ajuste simple
        }
      }

      // Alignment
      if (props.align === "left") {
        targetLeft = btnRect.left;
      } else if (props.align === "right") {
        targetLeft = btnRect.right - targetWidth;
      } else {
        // center
        targetLeft = btnRect.left + btnRect.width / 2 - targetWidth / 2;
      }
    }

    // 4. Mover la caja visualmente AL BOTON
    gsap.set(modalRef.value, {
      width: `${btnRect.width}px`,
      height: `${btnRect.height}px`,
      top: `${btnRect.top}px`,
      left: `${btnRect.left}px`,
      borderRadius: savedState.value.borderRadius,
      opacity: 0,
    });

    // Ocultar el contenido
    if (contentRef.value) {
      gsap.set(contentRef.value, { autoAlpha: 0, y: 10, filter: props.contentBlur ? "blur(4px)" : "none" });
    }

    await nextTick();

    // 5. Animar Overlay
    if (overlayRef.value) {
      gsap.to(overlayRef.value, {
        autoAlpha: 1,
        duration: 0.4,
        ease: "power2.out",
      });
    }

    // 6. Animar la caja hacia el tamaño final
    gsap.to(modalRef.value, {
      width: targetWidth,
      height: targetHeight,
      top: targetTop,
      left: targetLeft,
      borderRadius: targetBorderRadius.value,
      opacity: 1,
      duration: props.duration,
      ease: props.ease,
    });

    // 7. Aparecer el contenido interno — mismas proporciones que el default
    // original (delay 37.5% / duración 62.5% de la caja), para que el
    // contenido siempre termine de revelarse justo cuando la caja termina de
    // crecer, sea cual sea `duration`.
    if (contentRef.value) {
      gsap.to(contentRef.value, {
        autoAlpha: 1,
        y: 0,
        filter: props.contentBlur ? "blur(0px)" : "none",
        duration: props.duration * 0.625,
        delay: props.duration * 0.375,
        ease: "power2.out",
        onComplete: () => {
          isAnimating.value = false;
          if (props.placement === "top") {
             const bottomVal = window.innerHeight - targetTop - targetHeight;
             gsap.set(modalRef.value, { height: "", width: "", top: "", bottom: `${bottomVal}px` });
          } else {
             gsap.set(modalRef.value, { height: "", width: "" });
          }
        },
      });
    } else {
      setTimeout(() => {
        isAnimating.value = false;
        if (props.placement === "top") {
           const bottomVal = window.innerHeight - targetTop - targetHeight;
           gsap.set(modalRef.value, { height: "", width: "", top: "", bottom: `${bottomVal}px` });
        } else {
           gsap.set(modalRef.value, { height: "", width: "" });
        }
      }, 400);
    }
  } catch (e) {
    console.error(e);
    isAnimating.value = false;
  }
};

const closeAnimation = async () => {
  if (isAnimating.value || !savedState.value) return;
  isAnimating.value = true;
  // Actualizar estado por si el origen cambió de tema, posición o tamaño mientras estaba abierto
  let originEl = unref(props.originRef);
  if (typeof originEl === "string") {
    originEl = document.querySelector(originEl) as HTMLElement;
  }

  if (originEl) {
    const btnRect = originEl.getBoundingClientRect();
    const btnStyle = window.getComputedStyle(originEl);
    let rawRadius = parseInt(btnStyle.borderRadius) || 0;
    if (btnStyle.borderRadius.includes("%")) {
      rawRadius =
        (parseInt(btnStyle.borderRadius) / 100) *
        Math.min(btnRect.width, btnRect.height);
    }
    const maxRadius = Math.min(btnRect.width / 2, btnRect.height / 2);
    const safeRadius = rawRadius > maxRadius ? maxRadius : rawRadius;

    savedState.value = {
      width: btnRect.width,
      height: btnRect.height,
      top: btnRect.top,
      left: btnRect.left,
      bgColor:
        btnStyle.backgroundColor === "rgba(0, 0, 0, 0)"
          ? "transparent"
          : btnStyle.backgroundColor,
      borderRadius: `${safeRadius}px`,
    };
  }

  // 1. Ocultar contenido rápidamente
  if (contentRef.value) {
    gsap.to(contentRef.value, {
      autoAlpha: 0,
      y: 10,
      filter: "blur(4px)",
      duration: 0.2,
      ease: "power2.in",
    });
  }

  // Animar Overlay
  if (overlayRef.value) {
    gsap.to(overlayRef.value, {
      autoAlpha: 0,
      duration: 0.4,
      ease: "power2.in",
    });
  }

  // 2. Encoger el contenedor de vuelta hacia el botón de origen
  const currentRect = modalRef.value!.getBoundingClientRect();
  gsap.set(modalRef.value, { top: currentRect.top, bottom: "", height: currentRect.height, width: currentRect.width });

  gsap.to(modalRef.value, {
    width: savedState.value.width,
    height: savedState.value.height,
    top: savedState.value.top,
    left: savedState.value.left,
    borderRadius: savedState.value.borderRadius,
    opacity: 0,
    duration: 0.55,
    ease: "power3.inOut",
    onComplete: () => {
      isVisible.value = false;
      isAnimating.value = false;
      // FIX: Limpia toda la "basura" de estilos en línea que dejó GSAP
      // para que Vue recupere el control total del display y los eventos
      if (modalRef.value) gsap.set(modalRef.value, { clearProps: "all" });
    },
  });
};

// Escuchar cambios en modelValue para desencadenar las animaciones
watch(
  () => props.modelValue,
  async (newVal) => {
    if (newVal) {
      await openAnimation();
    } else {
      await closeAnimation();
    }
  },
);

onMounted(() => {
  if (props.modelValue) {
    openAnimation();
  }
});
</script>

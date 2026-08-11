// Ejemplo 5: Texto viajero (PillModal) — id="pill-modal"
export default {
  code: `import { createModal } from 'wisspop/vanilla';
import 'wisspop/styles.css';

// El preset "pill": flyingTextClass es lo que crea el elemento viajero.
const auth = createModal({
  content: '<div class="pill-body"><h2 data-wisspop-title>Crear cuenta</h2><input placeholder="hola@ejemplo.com" /></div>',
  modalClass: 'pill-panel',
  flyingTextClass: 'flying',
  width: 540,
  radius: 40,
  originRadius: 999,
  contentBlur: false,
});

const btn = document.querySelector('#crear-cuenta');

// Una misma instancia, dos posiciones: el 3er argumento son overrides de esa apertura.
btn.addEventListener('click', () => auth.open(btn, 'Crear cuenta'));
// auth.open(btn, 'Crear cuenta', { placement: 'origin' });`,
  codeAstro: `---
import { WissPopPill } from 'wisspop/astro';
import 'wisspop/styles.css';
---

<button data-wisspop-trigger="auth" class="pill">Crear cuenta</button>

<${'!--'} El preset del pill ya viene puesto: placement center, width 540,
     radius 40, originRadius 999 y el elemento viajero. ${'--'}>
<WissPopPill id="auth" modalClass="pill-panel" flyingTextClass="flying">
  <div class="pill-body">
    <h2 data-wisspop-title>Crear cuenta</h2>
    <input placeholder="hola@ejemplo.com" />
    <button data-wisspop-close class="pill">Continuar</button>
  </div>
</WissPopPill>`,
  codeVue: `<${'script'} setup>
import { ref } from 'vue';
import { WissPopPill } from 'wisspop/vue';
import 'wisspop/styles.css';

const boton = ref(null);
const abierto = ref(false);
<${'/script'}>

<template>
  <button ref="boton" class="pill" @click="abierto = true">Crear cuenta</button>

  <WissPopPill
    v-model="abierto"
    :origin-ref="boton"
    label="Crear cuenta"
    modal-class="pill-panel"
    flying-text-class="flying"
  >
    <template #default="{ close }">
      <div class="pill-body">
        <h2 data-wisspop-title>Crear cuenta</h2>
        <input placeholder="hola@ejemplo.com" />
        <button class="pill" @click="close">Continuar</button>
      </div>
    </template>
  </WissPopPill>
</template>`,
  codeReact: `import { useRef } from 'react';
import { WissPopPill } from 'wisspop/react';
import 'wisspop/styles.css';

export function Auth() {
  const boton = useRef(null);
  const pill = useRef(null);

  return (
    <>
      <button
        ref={boton}
        className="pill"
        onClick={() => pill.current.open(boton.current, 'Crear cuenta')}
      >
        Crear cuenta
      </button>

      {/* El 3er argumento de open() son overrides de esa apertura:
          pill.current.open(boton.current, 'Crear cuenta', { placement: 'origin' }) */}
      <WissPopPill ref={pill} modalClass="pill-panel" flyingTextClass="flying">
        {({ close }) => (
          <div className="pill-body">
            <h2 data-wisspop-title>Crear cuenta</h2>
            <input placeholder="hola@ejemplo.com" />
            <button className="pill" onClick={close}>Continuar</button>
          </div>
        )}
      </WissPopPill>
    </>
  );
}`,
};

// Ejemplo 2: Desde un botón circular
export default {
  code: `import { createModal } from 'wisspop/vanilla';
import 'wisspop/styles.css';

const btnFab = document.querySelector('#fab');

const modal = createModal({
  content: '<div class="panel-body"><h3><span data-wisspop-title>+</span> Nuevo movimiento</h3></div>',
  modalClass: 'panel',
  flyingTextClass: 'flying',
  placement: 'center',
  ease: 'power3.out',
  duration: 0.65,
  labelOffsetX: 20,
});

// El segundo argumento es lo que viaja: acá el glifo '+' del botón.
btnFab.addEventListener('click', () => modal.open(btnFab, '+'));`,
  codeAstro: `---
import { WissPopMorph } from 'wisspop/astro';
import 'wisspop/styles.css';
---

<${'!--'} El radio se lee del CSS del botón y se acota a la mitad del lado
     menor, así que un círculo se abre como círculo. ${'--'}>
<button data-wisspop-trigger="fab" class="round">+</button>

<WissPopMorph
  id="fab"
  placement="center"
  ease="power3.out"
  duration={0.65}
  modalClass="panel"
  flyingTextClass="flying"
>
  <div class="panel-body">
    <h3><span data-wisspop-title>+</span> Nuevo movimiento</h3>
    <input placeholder="Café" />
    <button data-wisspop-close>Guardar</button>
  </div>
</WissPopMorph>`,
  codeVue: `<${'script'} setup>
import { ref } from 'vue';
import { WissPopMorph } from 'wisspop/vue';
import 'wisspop/styles.css';

const fab = ref(null);
const abierto = ref(false);
<${'/script'}>

<template>
  <button ref="fab" class="round" @click="abierto = true">+</button>

  <WissPopMorph
    v-model="abierto"
    :origin-ref="fab"
    placement="center"
    ease="power3.out"
    :duration="0.65"
    modal-class="panel"
    flying-text-class="flying"
    label="+"
  >
    <template #default="{ close }">
      <div class="panel-body">
        <h3><span data-wisspop-title>+</span> Nuevo movimiento</h3>
        <input placeholder="Café" />
        <button @click="close">Guardar</button>
      </div>
    </template>
  </WissPopMorph>
</template>`,
  codeReact: `import { useRef, useState } from 'react';
import { WissPopMorph } from 'wisspop/react';
import 'wisspop/styles.css';

export function Fab() {
  const fab = useRef(null);
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button ref={fab} className="round" onClick={() => setAbierto(true)}>+</button>

      <WissPopMorph
        open={abierto}
        onOpenChange={setAbierto}
        originRef={fab}
        placement="center"
        ease="power3.out"
        duration={0.65}
        modalClass="panel"
        flyingTextClass="flying"
        label="+"
      >
        {({ close }) => (
          <div className="panel-body">
            <h3><span data-wisspop-title>+</span> Nuevo movimiento</h3>
            <input placeholder="Café" />
            <button onClick={close}>Guardar</button>
          </div>
        )}
      </WissPopMorph>
    </>
  );
}`,
};

// Ejemplo 1: Anclado a un botón (id="morph-modal")
export default {
  code: `import { createModal } from 'wisspop/vanilla';
import 'wisspop/styles.css';

const boton = document.querySelector('#mi-boton');

const modal = createModal({
  content: '<ul class="menu"><li>Opción 1</li><li>Opción 2</li></ul>',
  modalClass: 'panel',
  placement: 'top', // top | bottom | left | right | center | origin
  align: 'center',  // start | center | end (sobre el eje cruzado)
  gap: 8,           // px entre el botón y el panel
});

boton.addEventListener('click', () => modal.open(boton));`,
  codeAstro: `---
import { WissPopMorph } from 'wisspop/astro';
import 'wisspop/styles.css';
---

<button data-wisspop-trigger="menu">Ordenar</button>

<WissPopMorph id="menu" placement="top" align="center" gap={8} modalClass="panel">
  <ul class="menu">
    <li data-wisspop-close>Opción 1</li>
    <li data-wisspop-close>Opción 2</li>
  </ul>
</WissPopMorph>`,
  codeVue: `<${'script'} setup>
import { ref } from 'vue';
import { WissPopMorph } from 'wisspop/vue';
import 'wisspop/styles.css';

const boton = ref(null);
const abierto = ref(false);
<${'/script'}>

<template>
  <button ref="boton" @click="abierto = true">Ordenar</button>

  <WissPopMorph
    v-model="abierto"
    :origin-ref="boton"
    placement="top"
    align="center"
    :gap="8"
    modal-class="panel"
  >
    <ul class="menu">
      <li @click="abierto = false">Opción 1</li>
      <li @click="abierto = false">Opción 2</li>
    </ul>
  </WissPopMorph>
</template>`,
  codeReact: `import { useRef, useState } from 'react';
import { WissPopMorph } from 'wisspop/react';
import 'wisspop/styles.css';

export function Ejemplo() {
  const boton = useRef(null);
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button ref={boton} onClick={() => setAbierto(true)}>Ordenar</button>

      <WissPopMorph
        open={abierto}
        onOpenChange={setAbierto}
        originRef={boton}
        placement="top"
        align="center"
        gap={8}
        modalClass="panel"
      >
        <ul className="menu">
          <li onClick={() => setAbierto(false)}>Opción 1</li>
          <li onClick={() => setAbierto(false)}>Opción 2</li>
        </ul>
      </WissPopMorph>
    </>
  );
}`,
};

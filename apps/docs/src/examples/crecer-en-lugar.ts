// Ejemplo 3: Crecer en el lugar
export default {
  code: `import { createModal } from 'wisspop/vanilla';
import 'wisspop/styles.css';

const btnInline = document.querySelector('#renombrar');

const modal = createModal({
  content: '<div class="panel-body"><h3>Renombrar</h3><input placeholder="Supermercado" /></div>',
  modalClass: 'panel',
  placement: 'origin', // comparte el centro con el botón y crece ahí mismo
  closeButton: false,
});

btnInline.addEventListener('click', () => modal.open(btnInline));`,
  codeAstro: `---
import { WissPopMorph } from 'wisspop/astro';
import 'wisspop/styles.css';
---

<button data-wisspop-trigger="renombrar">Renombrar</button>

<${'!--'} placement="origin": comparte el centro con el botón y crece ahí
     mismo, sin viajar al centro de la ventana. ${'--'}>
<WissPopMorph id="renombrar" placement="origin" modalClass="panel" closeButton={false}>
  <div class="panel-body">
    <h3>Renombrar</h3>
    <input placeholder="Supermercado" />
    <button data-wisspop-close>Listo</button>
  </div>
</WissPopMorph>`,
  codeVue: `<${'script'} setup>
import { ref } from 'vue';
import { WissPopMorph } from 'wisspop/vue';
import 'wisspop/styles.css';

const boton = ref(null);
const abierto = ref(false);
<${'/script'}>

<template>
  <button ref="boton" @click="abierto = true">Renombrar</button>

  <WissPopMorph
    v-model="abierto"
    :origin-ref="boton"
    placement="origin"
    modal-class="panel"
    :close-button="false"
  >
    <template #default="{ close }">
      <div class="panel-body">
        <h3>Renombrar</h3>
        <input placeholder="Supermercado" />
        <button @click="close">Listo</button>
      </div>
    </template>
  </WissPopMorph>
</template>`,
  codeReact: `import { useRef, useState } from 'react';
import { WissPopMorph } from 'wisspop/react';
import 'wisspop/styles.css';

export function Renombrar() {
  const boton = useRef(null);
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button ref={boton} onClick={() => setAbierto(true)}>Renombrar</button>

      <WissPopMorph
        open={abierto}
        onOpenChange={setAbierto}
        originRef={boton}
        placement="origin"
        modalClass="panel"
        
      >
        {({ close }) => (
          <div className="panel-body">
            <h3>Renombrar</h3>
            <input placeholder="Supermercado" />
            <button onClick={close}>Listo</button>
          </div>
        )}
      </WissPopMorph>
    </>
  );
}`,
};

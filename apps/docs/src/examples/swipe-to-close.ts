// Ejemplo 7: Cerrar con el gesto (Swipe to Close)
export default {
  code: `import { createModal } from 'wisspop/vanilla';
import 'wisspop/styles.css';

const btn = document.querySelector('#arrastrable');

const modal = createModal({
  content: '<div class="panel-body"><h3>Arrastrame</h3><p>Hacia cualquier lado.</p></div>',
  modalClass: 'panel',
  placement: 'center',
  swipeToClose: true,
  swipeThreshold: 90, // px de arrastre para que cuente como descarte
});

btn.addEventListener('click', () => modal.open(btn));`,
  codeAstro: `---
import { WissPopMorph } from 'wisspop/astro';
import 'wisspop/styles.css';
---

<button data-wisspop-trigger="swipe">Arrastrame para cerrar</button>

<${'!--'} Descartado con el gesto el panel NO vuelve al origen: se va para
     donde lo tiraron, porque el gesto ya dice a dónde va. ${'--'}>
<WissPopMorph
  id="swipe"
  placement="center"
  modalClass="panel"
  swipeToClose={true}
  swipeThreshold={90}
>
  <div class="panel-body">
    <h3>Arrastrame</h3>
    <p>Hacia cualquier lado con el mouse o el dedo.</p>
    <button data-wisspop-close>O cerrame así</button>
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
  <button ref="boton" @click="abierto = true">Arrastrame para cerrar</button>

  <WissPopMorph
    v-model="abierto"
    :origin-ref="boton"
    placement="center"
    modal-class="panel"
    :swipe-to-close="true"
    :swipe-threshold="90"
  >
    <template #default="{ close }">
      <div class="panel-body">
        <h3>Arrastrame</h3>
        <p>Hacia cualquier lado con el mouse o el dedo.</p>
        <button @click="close">O cerrame así</button>
      </div>
    </template>
  </WissPopMorph>
</template>`,
  codeReact: `import { useRef, useState } from 'react';
import { WissPopMorph } from 'wisspop/react';
import 'wisspop/styles.css';

export function Swipe() {
  const boton = useRef(null);
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button ref={boton} onClick={() => setAbierto(true)}>
        Arrastrame para cerrar
      </button>

      <WissPopMorph
        open={abierto}
        onOpenChange={setAbierto}
        originRef={boton}
        placement="center"
        modalClass="panel"
        swipeToClose
        swipeThreshold={90}
      >
        {({ close }) => (
          <div className="panel-body">
            <h3>Arrastrame</h3>
            <p>Hacia cualquier lado con el mouse o el dedo.</p>
            <button onClick={close}>O cerrame así</button>
          </div>
        )}
      </WissPopMorph>
    </>
  );
}`,
};

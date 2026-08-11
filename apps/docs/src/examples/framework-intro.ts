// Snippet de la sección "Framework Support", antes de los ejemplos.
export default {
  vanilla: `import { createModal } from 'wisspop/vanilla';
import 'wisspop/styles.css';

const boton = document.querySelector('#abrir');

const modal = createModal({
  content: '<p>Contenido...</p><button data-cerrar>Cerrar</button>',
  modalClass: 'panel',
  placement: 'bottom',
});

boton.addEventListener('click', () => modal.open(boton));

modal.content.addEventListener('click', (e) => {
  if (e.target.closest('[data-cerrar]')) modal.close();
});`,
  astro: `---
import { WissPopMorph } from 'wisspop/astro';
import 'wisspop/styles.css';
---

<button data-wisspop-trigger="mi-modal">Abrir</button>

<WissPopMorph id="mi-modal" placement="bottom" modalClass="panel">
  <p>Contenido Astro...</p>
  <button data-wisspop-close>Cerrar</button>
</WissPopMorph>`,
  vue: `<${'script'} setup>
import { ref } from 'vue';
import { WissPopMorph } from 'wisspop/vue';
import 'wisspop/styles.css';

const abierto = ref(false);
const boton = ref(null);
<${'/script'}>

<template>
  <button ref="boton" @click="abierto = true">Abrir</button>

  <WissPopMorph
    v-model="abierto"
    :origin-ref="boton"
    placement="bottom"
    modal-class="panel"
  >
    <template #default="{ close }">
      <p>Contenido Vue...</p>
      <button @click="close">Cerrar</button>
    </template>
  </WissPopMorph>
</template>`,
  react: `import { useRef, useState } from 'react';
import { WissPopMorph } from 'wisspop/react';
import 'wisspop/styles.css';

export function Demo() {
  const boton = useRef(null);
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button ref={boton} onClick={() => setAbierto(true)}>Abrir</button>

      <WissPopMorph
        open={abierto}
        onOpenChange={setAbierto}
        originRef={boton}
        placement="bottom"
        modalClass="panel"
      >
        {({ close }) => (
          <>
            <p>Contenido React...</p>
            <button onClick={close}>Cerrar</button>
          </>
        )}
      </WissPopMorph>
    </>
  );
}`,
};

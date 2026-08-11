// Ejemplo 8: FlipModal — Elementos compartidos (id="flip-modal")
export default {
  code: `import { createFlipModal } from 'wisspop/vanilla';
import 'wisspop/styles.css';

const trigger = document.querySelector('#card-trigger');

// flipId es el PREFIJO: empareja demo-card, demo-img, demo-title del trigger
// con los del modal. El "-card" marca cuál es la tarjeta de nivel superior.
const flip = createFlipModal({
  trigger,
  flipId: 'demo',
  swipeToClose: true,
  // Sin modalClass: el fondo va en el propio data-flip-id="demo-card", no en
  // el wrapper — el wrapper no viaja, así que ahí aparecería de golpe.
  content:
    '<div data-flip-id="demo-card" class="panel p-6 w-96">' +
      '<img data-flip-id="demo-img" src="/gato.jpg" class="w-full h-52 object-cover rounded-xl" />' +
      '<h3 data-flip-id="demo-title" class="mt-4 text-2xl font-bold">Gato Viajero</h3>' +
    '</div>',
});

trigger.addEventListener('click', () => flip.open());`,
  codeAstro: `---
import { WissPopFlip } from 'wisspop/astro';
import 'wisspop/styles.css';
---

<${'!--'} Los data-flip-id del trigger y del modal se emparejan por nombre.
     flipId es el prefijo común; el "-card" marca la tarjeta principal. ${'--'}>
<div data-wisspop-trigger="tarjeta" class="card">
  <img data-flip-id="demo-img" src="/gato.jpg" alt="" />
  <h3 data-flip-id="demo-title">Gato Viajero</h3>
</div>

<WissPopFlip id="tarjeta" flipId="demo" swipeToClose={true}>
  <div data-flip-id="demo-card" class="panel">
    <img data-flip-id="demo-img" src="/gato.jpg" alt="" />
    <h3 data-flip-id="demo-title">Gato Viajero</h3>
    <button data-wisspop-close>Cerrar</button>
  </div>
</WissPopFlip>`,
  codeVue: `<${'script'} setup>
import { ref } from 'vue';
import { WissPopFlip } from 'wisspop/vue';
import 'wisspop/styles.css';

const abierto = ref(false);
<${'/script'}>

<template>
  <WissPopFlip v-model="abierto" flip-id="demo" :swipe-to-close="true">
    <template #trigger>
      <div class="card">
        <img data-flip-id="demo-img" src="/gato.jpg" />
        <h3 data-flip-id="demo-title">Gato Viajero</h3>
      </div>
    </template>

    <div data-flip-id="demo-card" class="panel">
      <img data-flip-id="demo-img" src="/gato.jpg" />
      <h3 data-flip-id="demo-title">Gato Viajero</h3>
      <button @click="abierto = false">Cerrar</button>
    </div>
  </WissPopFlip>
</template>`,
  codeReact: `import { WissPopFlip } from 'wisspop/react';
import 'wisspop/styles.css';

export function Tarjeta() {
  return (
    <WissPopFlip
      flipId="demo"
      swipeToClose
      trigger={() => (
        <div className="card">
          <img data-flip-id="demo-img" src="/gato.jpg" alt="" />
          <h3 data-flip-id="demo-title">Gato Viajero</h3>
        </div>
      )}
    >
      {(close) => (
        <div data-flip-id="demo-card" className="panel">
          <img data-flip-id="demo-img" src="/gato.jpg" alt="" />
          <h3 data-flip-id="demo-title">Gato Viajero</h3>
          <button onClick={close}>Cerrar</button>
        </div>
      )}
    </WissPopFlip>
  );
}`,
};

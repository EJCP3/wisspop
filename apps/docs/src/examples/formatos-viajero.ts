// Ejemplo 6: Formatos del elemento viajero
export default {
  code: `import { createModal } from 'wisspop/vanilla';
import 'wisspop/styles.css';

const modal = createModal({
  content: '<div class="panel-body"><h3><span data-wisspop-title>Solo texto</span></h3></div>',
  modalClass: 'panel',
  flyingTextClass: 'flying',
  placement: 'center',
});

const btn = document.querySelector('#formato');

// Lo que viaja puede ser texto suelto...
btn.addEventListener('click', () => modal.open(btn, 'Solo texto'));

// ...o un nodo de adentro del botón. Con nodo se mide su rect real, así que
// no hace falta labelOffsetX. Sin texto, el core pasa a modo "box" y anima
// width/height en vez de font-size.
// modal.open(btn, btn.querySelector('svg'));
// modal.open(btn, btn.querySelector('img'));`,
  codeAstro: `---
import { WissPopMorph } from 'wisspop/astro';
import 'wisspop/styles.css';
---

<${'!--'} El wrapper de Astro elige solo qué viaja: si el botón tiene un único
     hijo (icono, imagen, span con icono+texto) manda ese nodo; si no, su
     texto. Con data-wisspop-label forzás uno explícito. ${'--'}>
<button data-wisspop-trigger="fmt-texto" class="pill">Solo texto</button>

<button data-wisspop-trigger="fmt-imagen" class="avatar-btn">
  <img src="/gato.jpg" alt="" />
</button>

<WissPopMorph id="fmt-texto" placement="center" modalClass="panel" flyingTextClass="flying">
  <div class="panel-body">
    <h3><span data-wisspop-title>Solo texto</span></h3>
    <button data-wisspop-close>Cerrar</button>
  </div>
</WissPopMorph>

<WissPopMorph id="fmt-imagen" placement="center" modalClass="panel" flyingTextClass="flying">
  <div class="panel-body">
    <span data-wisspop-title class="foto-destino"><img src="/gato.jpg" alt="" /></span>
    <button data-wisspop-close>Cerrar</button>
  </div>
</WissPopMorph>`,
  codeVue: `<${'script'} setup>
import { ref } from 'vue';
import { WissPopMorph } from 'wisspop/vue';
import 'wisspop/styles.css';

const boton = ref(null);
const abierto = ref(false);

// \`label\` acepta string o nodo. Con nodo se mide su rect real, así que no
// hace falta labelOffsetX; sin texto el core pasa a modo "box" y anima
// width/height en vez de font-size.
const queViaja = ref('Solo texto');

const abrirConIcono = () => {
  queViaja.value = boton.value.querySelector('svg');
  abierto.value = true;
};
<${'/script'}>

<template>
  <button ref="boton" class="pill" @click="abierto = true">Solo texto</button>

  <WissPopMorph
    v-model="abierto"
    :origin-ref="boton"
    :label="queViaja"
    placement="center"
    modal-class="panel"
    flying-text-class="flying"
  >
    <template #default="{ close }">
      <div class="panel-body">
        <h3><span data-wisspop-title>Solo texto</span></h3>
        <button @click="close">Cerrar</button>
      </div>
    </template>
  </WissPopMorph>
</template>`,
  codeReact: `import { useRef, useState } from 'react';
import { WissPopMorph } from 'wisspop/react';
import 'wisspop/styles.css';

export function Formatos() {
  const boton = useRef(null);
  const [abierto, setAbierto] = useState(false);
  const [queViaja, setQueViaja] = useState('Solo texto');

  // label acepta string o nodo. Con nodo se mide su rect real; sin texto el
  // core pasa a modo "box" y anima width/height en vez de font-size.
  const abrirConIcono = () => {
    setQueViaja(boton.current.querySelector('svg'));
    setAbierto(true);
  };

  return (
    <>
      <button ref={boton} className="pill" onClick={() => setAbierto(true)}>
        Solo texto
      </button>

      <WissPopMorph
        open={abierto}
        onOpenChange={setAbierto}
        originRef={boton}
        label={queViaja}
        placement="center"
        modalClass="panel"
        flyingTextClass="flying"
      >
        {({ close }) => (
          <div className="panel-body">
            <h3><span data-wisspop-title>Solo texto</span></h3>
            <button onClick={close}>Cerrar</button>
          </div>
        )}
      </WissPopMorph>
    </>
  );
}`,
};

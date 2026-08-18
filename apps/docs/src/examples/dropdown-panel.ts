// Ejemplo 9: DropdownPanel — Despliegue elástico (id="dropdown-panel")
export default {
  code: `import { enterDropdownAnimation, leaveDropdownAnimation } from 'wisspop/vanilla';
import 'wisspop/styles.css';

const btn = document.querySelector('#abrir-dropdown');
const panel = document.querySelector('#mi-dropdown');
let abierto = false;

btn.addEventListener('click', () => {
  if (abierto) {
    leaveDropdownAnimation(panel, () => (panel.hidden = true), {
      transformOrigin: 'top center',
    });
  } else {
    panel.hidden = false;
    enterDropdownAnimation(panel, null, { transformOrigin: 'top center' });
  }
  abierto = !abierto;
});`,
  codeAstro: `---
// El dropdown elástico es un helper de animación, no un componente: se
// aplica al panel que ya tengas. En Astro va en un <script> de la página.
import 'wisspop/styles.css';
---

<button id="abrir">Desplegar</button>
<div id="panel" class="panel" hidden>
  <ul class="menu"><li>Opción 1</li><li>Opción 2</li></ul>
</div>

<script>
  import { enterDropdownAnimation, leaveDropdownAnimation } from 'wisspop/vanilla';

  const btn = document.querySelector('#abrir');
  const panel = document.querySelector('#panel');
  let abierto = false;

  btn.addEventListener('click', () => {
    if (abierto) {
      leaveDropdownAnimation(panel, () => (panel.hidden = true), { transformOrigin: 'top center' });
    } else {
      panel.hidden = false;
      enterDropdownAnimation(panel, null, { transformOrigin: 'top center' });
    }
    abierto = !abierto;
  });
</script>`,
  codeVue: `<${'script'} setup>
import { ref } from 'vue';
import { enterDropdownAnimation, leaveDropdownAnimation } from 'wisspop/vanilla';
import 'wisspop/styles.css';

const panel = ref(null);
const montado = ref(false);

// Los hooks de <Transition> reciben el elemento y el done: es exactamente la
// firma que esperan enter/leaveDropdownAnimation.
const alEntrar = (el) => enterDropdownAnimation(el, null, { transformOrigin: 'top center' });
const alSalir = (el, done) => leaveDropdownAnimation(el, done, { transformOrigin: 'top center' });
<${'/script'}>

<template>
  <button @click="montado = !montado">Desplegar</button>

  <Transition :css="false" @enter="alEntrar" @leave="alSalir">
    <div v-if="montado" ref="panel" class="panel">
      <ul class="menu"><li>Opción 1</li><li>Opción 2</li></ul>
    </div>
  </Transition>
</template>`,
  codeReact: `import { useRef, useState, useLayoutEffect } from 'react';
import { enterDropdownAnimation, leaveDropdownAnimation } from 'wisspop/vanilla';
import 'wisspop/styles.css';

export function Dropdown() {
  const panel = useRef(null);
  const [montado, setMontado] = useState(false);

  useLayoutEffect(() => {
    if (montado && panel.current) {
      enterDropdownAnimation(panel.current, null, { transformOrigin: 'top center' });
    }
  }, [montado]);

  // El leave necesita que el nodo siga vivo mientras anima, así que se
  // desmonta en el callback, no en el click.
  const cerrar = () =>
    leaveDropdownAnimation(panel.current, () => setMontado(false), {
      transformOrigin: 'top center',
    });

  return (
    <>
      <button onClick={() => (montado ? cerrar() : setMontado(true))}>Desplegar</button>

      {montado && (
        <div ref={panel} className="panel">
          <ul className="menu"><li>Opción 1</li><li>Opción 2</li></ul>
        </div>
      )}
    </>
  );
}`,
};

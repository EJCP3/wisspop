// Ejemplo 4: Drawer (cajón lateral y vertical)
export default {
  code: `import { createModal } from 'wisspop/vanilla';
import 'wisspop/styles.css';

const lado = 'left'; // left | right | top | bottom
const btn = document.querySelector('#abrir-drawer');

const drawer = createModal({
  content: '<ul class="menu"><li>Inicio</li><li>Movimientos</li><li>Ajustes</li></ul>',
  placement: 'drawer-' + lado,
  modalClass: 'panel drawer drawer-' + lado,
  swipeToClose: true,
});

btn.addEventListener('click', () => drawer.open(btn));`,
  codeAstro: `---
import { WissPopMorph } from 'wisspop/astro';
import 'wisspop/styles.css';

const LADOS = ['left', 'right', 'top', 'bottom'];
---

{LADOS.map((lado) => (
  <button data-wisspop-trigger={\`drawer-\${lado}\`}>drawer-{lado}</button>
))}

{LADOS.map((lado) => (
  <WissPopMorph
    id={\`drawer-\${lado}\`}
    placement={\`drawer-\${lado}\`}
    modalClass={\`panel drawer drawer-\${lado}\`}
    swipeToClose={true}
  >
    <ul class="menu">
      <li data-wisspop-close>Inicio</li>
      <li data-wisspop-close>Ajustes</li>
    </ul>
  </WissPopMorph>
))}`,
  codeVue: `<${'script'} setup>
import { ref } from 'vue';
import { WissPopMorph } from 'wisspop/vue';
import 'wisspop/styles.css';

const lado = ref('left'); // left | right | top | bottom
const boton = ref(null);
const abierto = ref(false);
<${'/script'}>

<template>
  <button ref="boton" @click="abierto = true">Abrir drawer</button>

  <WissPopMorph
    v-model="abierto"
    :origin-ref="boton"
    :placement="\`drawer-\${lado}\`"
    :modal-class="\`panel drawer drawer-\${lado}\`"
    :swipe-to-close="true"
  >
    <template #default="{ close }">
      <ul class="menu">
        <li @click="close">Inicio</li>
        <li @click="close">Ajustes</li>
      </ul>
    </template>
  </WissPopMorph>
</template>`,
  codeReact: `import { useRef, useState } from 'react';
import { WissPopMorph } from 'wisspop/react';
import 'wisspop/styles.css';

export function Drawer() {
  const boton = useRef(null);
  const [abierto, setAbierto] = useState(false);
  const lado = 'left'; // left | right | top | bottom

  return (
    <>
      <button ref={boton} onClick={() => setAbierto(true)}>Abrir drawer</button>

      <WissPopMorph
        open={abierto}
        onOpenChange={setAbierto}
        originRef={boton}
        placement={\`drawer-\${lado}\`}
        modalClass={\`panel drawer drawer-\${lado}\`}
        swipeToClose
      >
        {({ close }) => (
          <ul className="menu">
            <li onClick={close}>Inicio</li>
            <li onClick={close}>Ajustes</li>
          </ul>
        )}
      </WissPopMorph>
    </>
  );
}`,
};

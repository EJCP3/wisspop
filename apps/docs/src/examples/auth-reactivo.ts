// Ejemplo 10: Alto reactivo y cambio de vista (Auth Demo)
export default {
  code: `import { createModal } from 'wisspop/vanilla';
import 'wisspop/styles.css';

const modal = createModal({
  modalClass: 'pill-panel',
  flyingTextClass: 'flying',
  width: 540,
  radius: 40,
  originRadius: 999,
});

let vista = 'signup';

const render = () => {
  const titulo = vista === 'signup' ? 'Crear cuenta' : 'Iniciar sesión';
  modal.content.innerHTML =
    '<div class="pill-body">' +
      '<h2 data-wisspop-title>' + titulo + '</h2>' +
      '<input placeholder="hola@ejemplo.com" />' +
      '<button data-vista>Cambiar de vista</button>' +
    '</div>';
};

render();

modal.content.addEventListener('click', (e) => {
  if (!e.target.closest('[data-vista]')) return;
  // changeView: muta primero (síncrono) y anima hacia el alto nuevo sin cerrar.
  modal.changeView(() => {
    vista = vista === 'signup' ? 'login' : 'signup';
    render();
  });
});

// Si el contenido cambia de alto SIN cambiar de vista, alcanza con resync().
// modal.resync();

const btn = document.querySelector('#abrir-auth');
btn.addEventListener('click', () => modal.open(btn, 'Crear cuenta'));`,
  codeAstro: `---
// changeView()/resync() son métodos de la instancia, no props: en Astro se
// llegan por el <template> del componente, que guarda el modal en _wisspop.
import { WissPopPill } from 'wisspop/astro';
import 'wisspop/styles.css';
---

<button data-wisspop-trigger="auth" class="pill">Crear cuenta</button>

<WissPopPill id="auth" modalClass="pill-panel" flyingTextClass="flying">
  <div class="pill-body">
    <h2 data-wisspop-title>Crear cuenta</h2>
    <input placeholder="hola@ejemplo.com" />
    <button data-vista>Ya tengo cuenta</button>
  </div>
</WissPopPill>

<script>
  const tpl = document.querySelector('template[data-id="auth"]');
  const modal = tpl._wisspop;
  let vista = 'signup';

  modal.content.addEventListener('click', (e) => {
    if (!e.target.closest('[data-vista]')) return;
    modal.changeView(() => {
      vista = vista === 'signup' ? 'login' : 'signup';
      modal.content.querySelector('[data-wisspop-title]').textContent =
        vista === 'signup' ? 'Crear cuenta' : 'Iniciar sesión';
    });
  });
</script>`,
  codeVue: `<${'script'} setup>
import { ref, nextTick } from 'vue';
import { WissPopPill } from 'wisspop/vue';
import 'wisspop/styles.css';

const boton = ref(null);
const pill = ref(null);
const abierto = ref(false);
const vista = ref('signup');
const error = ref(false);

// changeView espera que el DOM nuevo ya esté montado cuando remide: en Vue
// eso es nextTick(), no el render síncrono de vanilla.
const cambiarVista = () =>
  pill.value.changeView(async () => {
    vista.value = vista.value === 'signup' ? 'login' : 'signup';
    error.value = false;
    await nextTick();
  });

// Si solo cambia el alto sin cambiar de vista, alcanza con resync().
const alternarError = async () => {
  error.value = !error.value;
  await nextTick();
  pill.value.resync();
};
<${'/script'}>

<template>
  <button ref="boton" class="pill" @click="abierto = true">Crear cuenta</button>

  <WissPopPill
    ref="pill"
    v-model="abierto"
    :origin-ref="boton"
    label="Crear cuenta"
    modal-class="pill-panel"
    flying-text-class="flying"
  >
    <div class="pill-body">
      <h2 data-wisspop-title>
        {{ vista === 'signup' ? 'Crear cuenta' : 'Iniciar sesión' }}
      </h2>
      <input placeholder="hola@ejemplo.com" />
      <p v-if="error" class="error">Las contraseñas no coinciden.</p>
      <button @click="alternarError">Mostrar un error (resync)</button>
      <button @click="cambiarVista">
        {{ vista === 'signup' ? 'Ya tengo cuenta' : 'Quiero crear una cuenta' }}
      </button>
    </div>
  </WissPopPill>
</template>`,
  codeReact: `import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { WissPopPill } from 'wisspop/react';
import 'wisspop/styles.css';

export function Auth() {
  const boton = useRef(null);
  const pill = useRef(null);
  const [vista, setVista] = useState('signup');
  const [error, setError] = useState(false);

  // changeView remide apenas vuelve el callback, así que el commit tiene que
  // haber ocurrido ya: flushSync fuerza ese render sincrónicamente.
  const cambiarVista = () =>
    pill.current.changeView(() => {
      flushSync(() => {
        setVista((v) => (v === 'signup' ? 'login' : 'signup'));
        setError(false);
      });
    });

  // Si solo cambia el alto sin cambiar de vista, alcanza con resync().
  const alternarError = () => {
    flushSync(() => setError((e) => !e));
    pill.current.resync();
  };

  return (
    <>
      <button
        ref={boton}
        className="pill"
        onClick={() => pill.current.open(boton.current, 'Crear cuenta')}
      >
        Crear cuenta
      </button>

      <WissPopPill ref={pill} modalClass="pill-panel" flyingTextClass="flying">
        {() => (
          <div className="pill-body">
            <h2 data-wisspop-title>
              {vista === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}
            </h2>
            <input placeholder="hola@ejemplo.com" />
            {error && <p className="error">Las contraseñas no coinciden.</p>}
            <button onClick={alternarError}>Mostrar un error (resync)</button>
            <button onClick={cambiarVista}>
              {vista === 'signup' ? 'Ya tengo cuenta' : 'Quiero crear una cuenta'}
            </button>
          </div>
        )}
      </WissPopPill>
    </>
  );
}`,
};

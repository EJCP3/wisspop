# Reglas de Agente IA para wisspop (Svelte / Vanilla Adapter)

En Svelte, puedes usar el adaptador Vanilla de `wisspop`:

```svelte
<script>
  import { createModal } from 'wisspop/vanilla';
  let btn;
  let modal;

  function openModal() {
    if (!modal) {
      modal = createModal({ content: '<div>Contenido Svelte</div>' });
    }
    modal.open(btn);
  }
</script>

<button bind:this={btn} on:click={openModal}>Abrir</button>
```

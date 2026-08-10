# Reglas de Agente IA para wisspop (Vue 3)

Al implementar modales y dropdowns con `wisspop` en Vue 3:

1. Importa los componentes desde `wisspop/vue`:
   ```html
   <script setup>
   import { ref } from 'vue';
   import { WissPopMorph, WissPopPill, WissPopFlip } from 'wisspop/vue';

   const open = ref(false);
   const btnRef = ref(null);
   </script>

   <template>
     <button ref="btnRef" @click="open = true">Abrir</button>
     <WissPopMorph v-model="open" :origin-ref="btnRef">
       <p>Contenido Vue...</p>
     </WissPopMorph>
   </template>
   ```

# Reglas de Agente IA para wisspop (Vanilla JS)

Al implementar modales, dropdowns y transiciones de origen en Vanilla JavaScript con `wisspop`:

1. Importa desde `wisspop/vanilla` o `wisspop`:
   ```js
   import { createModal, createFlipModal } from 'wisspop/vanilla';
   ```

2. MorphModal:
   ```js
   const modal = createModal({
     content: '<div>...</div>',
     placement: 'bottom',
     align: 'start'
   });
   modal.open(buttonEl);
   ```

3. PillModal:
   ```js
   const pill = createModal({
     type: 'pill',
     content: '<h2 data-wisspop-title>Título</h2>',
     placement: 'center'
   });
   pill.open(buttonEl, 'Texto del Botón');
   ```

4. DropdownPanel:
   ```js
   const dropdown = createModal({
     type: 'dropdown',
     content: '<div>...</div>',
     placement: 'bottom',
     gap: 8
   });
   dropdown.open(buttonEl);
   ```

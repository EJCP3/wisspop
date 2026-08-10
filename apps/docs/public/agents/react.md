# Reglas de Agente IA para wisspop (React)

Al implementar modales y dropdowns con `wisspop` en React:

1. Importa los componentes de `wisspop/react`:
   ```jsx
   import { WissPopMorph, WissPopPill, WissPopFlip } from 'wisspop/react';
   ```

2. Usa `useRef` para el elemento de origen (`originRef`) y controla el estado con `open`/`onClose`:
   ```jsx
   const btnRef = useRef(null);
   const [open, setOpen] = useState(false);

   <button ref={btnRef} onClick={() => setOpen(true)}>Abrir</button>
   <WissPopMorph open={open} onClose={() => setOpen(false)} originRef={btnRef.current}>
     <p>Contenido...</p>
   </WissPopMorph>
   ```

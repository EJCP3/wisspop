import { useEffect, useRef, useState } from "react";

/**
 * Puente entre el `mount()` async que el core espera y el commit de React.
 *
 * `flushSync` fue el primer intento y revienta: "flushSync was called from
 * inside a lifecycle method" en cuanto `open()` se dispara desde el propio
 * `useEffect` que estos wrappers usan para el prop declarativo `open` — que
 * es exactamente el caso de uso más común, no uno raro. React no permite un
 * flush síncrono mientras ya está corriendo su propio ciclo de commit.
 *
 * En vez de forzar el commit, se espera a que React lo haga solo: `mount()`
 * no resuelve hasta que un `useEffect` — que por contrato de React corre
 * DESPUÉS del commit, con los refs del DOM ya poblados — confirma que
 * `visible` pasó a `true`.
 */
export function useDomMount() {
  const [visible, setVisible] = useState(false);
  const resolveRef = useRef(null);

  useEffect(() => {
    if (visible && resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  }, [visible]);

  const mount = () =>
    new Promise((resolve) => {
      resolveRef.current = resolve;
      setVisible(true);
    });

  const unmount = () => setVisible(false);

  return { visible, mount, unmount };
}

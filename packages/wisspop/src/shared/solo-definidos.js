/**
 * Descarta las claves con valor `undefined`.
 *
 * Es lo que permite que `setDefaults()` sirva de algo: si un wrapper manda
 * siempre `duration: props.duration`, una prop no puesta viaja como `undefined`
 * y aun así PISA el default del core (`{...DEFAULTS, ...options}` no distingue
 * "no lo puso" de "lo puso en undefined"). Filtrando antes, lo que el consumidor
 * no tocó no se manda, y el core aplica su default —global incluido—.
 */
export const soloDefinidos = (objeto) =>
  Object.fromEntries(Object.entries(objeto).filter(([, valor]) => valor !== undefined));

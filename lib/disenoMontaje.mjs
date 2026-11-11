const ALETA_PEGUE_CM = 1.5;

export const plantillasCaja = {
  manual: { nombre: "Caja sin oportunidad de encaje", campos: [] },
  solapas_alternadas: {
    nombre: "Caja lateral de solapas de cierre superior e inferior alternadas",
    campos: [
      { id: "solapa", nombre: "Profundidad de la solapa principal (cm)", valor: "5" },
      { id: "cierre_mm", nombre: "Aleta de cierre superior e inferior (mm)", valor: "17" },
      { id: "oreja", nombre: "Solapa lateral", valor: "3" },
      { id: "ajuste", nombre: "Reducción del último panel", valor: "0.05" },
      { id: "separacion", nombre: "Separación entre piezas", valor: "0" },
    ],
  },
};

export function tipoCaja(cotizacion) {
  return Object.hasOwn(plantillasCaja, cotizacion.tipo_caja) ? cotizacion.tipo_caja : "manual";
}

export function medidasCaja(cotizacion) {
  if (tipoCaja(cotizacion) === "manual") {
    const largo = Number(cotizacion.largo_abierta);
    const ancho = Number(cotizacion.ancho_abierta);
    return [largo, ancho].every(n => Number.isFinite(n) && n > 0)
      ? { largo, ancho, pasoLargo: largo, pasoAncho: ancho }
      : null;
  }

  const [largo, ancho, alto] = ["largo_armada", "ancho_armada", "alto_armada"]
    .map(campo => Number(cotizacion[campo]));
  if (![largo, ancho, alto].every(n => Number.isFinite(n) && n > 0)) return null;

  const campos = plantillasCaja.solapas_alternadas.campos;
  const entradas = campos.map(({ id, valor }) => cotizacion[`diseno_${id}`] ?? valor);
  if (entradas.some(valor => String(valor).trim() === "")) return null;
  const [profundidad, cierreMm, oreja, ajuste, separacion] = entradas.map(Number);
  const solapa = profundidad + cierreMm / 10;
  if (![profundidad, cierreMm, oreja, ajuste, separacion].every(n => Number.isFinite(n) && n >= 0)
      || profundidad === 0 || oreja > solapa || ajuste >= ancho) return null;

  const largoAbierta = 2 * (largo + ancho) + ALETA_PEGUE_CM - ajuste;
  const anchoAbierta = alto + 2 * solapa;
  // Las solapas largas alternan paneles. En los paneles laterales
  // se enfrentan dos orejas. El mayor de ambos casos fija el avance.
  const avance = alto + Math.max(solapa, 2 * oreja);
  return {
    largo: largoAbierta,
    ancho: anchoAbierta,
    pasoLargo: largoAbierta + separacion,
    pasoAncho: avance + separacion,
    troquel: { paneles: [largo, ancho, largo, ancho - ajuste], alto, solapa, oreja, cierre: cierreMm / 10 },
  };
}

export function dimensionesMontaje(caja, columnas, filas, girada = false) {
  const ancho = girada ? caja.largo : caja.ancho;
  const largo = girada ? caja.ancho : caja.largo;
  const pasoAncho = girada ? caja.pasoLargo : caja.pasoAncho;
  const pasoLargo = girada ? caja.pasoAncho : caja.pasoLargo;
  return {
    anchoMontaje: ancho + pasoAncho * (columnas - 1),
    largoMontaje: largo + pasoLargo * (filas - 1),
  };
}

export function trazadoTroquel(caja) {
  const { paneles, alto, solapa, oreja, cierre } = caja.troquel;
  const bordes = [ALETA_PEGUE_CM];
  for (const panel of paneles) bordes.push(bordes.at(-1) + panel);
  const [a, b, c, d, e] = bordes;
  const arriba = solapa;
  const abajo = arriba + alto;
  const corte = [
    [0, arriba], [a, arriba], [a, 0], [b, 0],
    [b, arriba - oreja], [c, arriba - oreja], [c, arriba],
    [d, arriba], [d, arriba - oreja], [e, arriba - oreja],
    [e, abajo + oreja], [d, abajo + oreja], [d, abajo + solapa],
    [c, abajo + solapa], [c, abajo + oreja], [b, abajo + oreja],
    [b, abajo], [0, abajo],
  ];
  const dobleces = [
    ...bordes.slice(0, -1).map(x => [x, arriba, x, abajo]),
    [a, arriba, c, arriba], [d, arriba, e, arriba],
    [b, abajo, e, abajo],
  ];
  if (cierre > 0) dobleces.push([a, cierre, b, cierre], [c, caja.ancho - cierre, d, caja.ancho - cierre]);
  return { corte, dobleces };
}

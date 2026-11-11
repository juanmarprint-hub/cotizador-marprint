const ALETA_PEGUE_CM = 1.5;

export const plantillasCaja = {
  manual: { nombre: "Caja sin oportunidad de encaje", campos: [] },
  solapas_alternadas: {
    nombre: "Caja lateral de solapas de cierre superior e inferior alternadas",
    campos: [
      { id: "cierre_mm", nombre: "Aleta de cierre superior e inferior (mm)", valor: "17" },
      { id: "ajuste", nombre: "Reducción del último panel", valor: "0.05" },
      { id: "separacion", nombre: "Separación entre piezas", valor: "0" },
    ],
  },
  fondo_automatico: {
    nombre: "Caja de solapa superior con fondo automático estándar o semiautomático",
    campos: [
      { id: "cierre_mm", nombre: "Aleta de cierre superior (mm)", valor: "17" },
      { id: "separacion", nombre: "Separación entre piezas", valor: "0" },
    ],
  },
};

export function tipoCaja(cotizacion) {
  return Object.hasOwn(plantillasCaja, cotizacion.tipo_caja) ? cotizacion.tipo_caja : "manual";
}

export function medidasCaja(cotizacion) {
  const tipo = tipoCaja(cotizacion);
  if (tipo === "manual") {
    const largo = Number(cotizacion.largo_abierta);
    const ancho = Number(cotizacion.ancho_abierta);
    return [largo, ancho].every(n => Number.isFinite(n) && n > 0)
      ? { largo, ancho, pasoLargo: largo, pasoAncho: ancho }
      : null;
  }

  const [largo, ancho, alto] = ["largo_armada", "ancho_armada", "alto_armada"]
    .map(campo => Number(cotizacion[campo]));
  if (![largo, ancho, alto].every(n => Number.isFinite(n) && n > 0)) return null;

  const fondoAutomatico = tipo === "fondo_automatico";
  const entradas = Object.fromEntries(plantillasCaja[tipo].campos.map(({ id, valor }) => [
    id, cotizacion[`diseno_${id}`] ?? valor,
  ]));
  if (Object.values(entradas).some(valor => String(valor).trim() === "")) return null;
  const cierre = Number(entradas.cierre_mm) / 10;
  const separacion = Number(entradas.separacion);
  const ajuste = fondoAutomatico ? 0.1 : Number(entradas.ajuste);
  if (![cierre, ajuste, separacion].every(n => Number.isFinite(n) && n >= 0)
      || ajuste >= ancho) return null;

  const solapa = ancho + cierre;
  const oreja = solapa / 2;
  const largoAbierta = 2 * (largo + ancho) + ALETA_PEGUE_CM - ajuste;
  const proporcionFondo = largo <= 1.5 * ancho ? 0.65 : largo <= 2.5 * ancho ? 0.7 : 0.76;
  const fondo = fondoAutomatico ? ancho * proporcionFondo : solapa;
  const anchoAbierta = alto + solapa + fondo;
  // Si las dos tapas principales se cruzan al girar una fila, no se aplica encaje.
  const ahorroPorPareja = 2 * ancho - ajuste >= ALETA_PEGUE_CM ? oreja : 0;
  return {
    largo: largoAbierta,
    ancho: anchoAbierta,
    pasoLargo: largoAbierta + separacion,
    pasoAncho: (fondoAutomatico ? anchoAbierta : alto + solapa) + separacion,
    encajePares: fondoAutomatico ? ahorroPorPareja : null,
    troquel: {
      paneles: [largo, ancho, largo, ancho - ajuste],
      alto, solapa, oreja, cierre, fondo, orejaFondo: ancho / 2,
    },
  };
}

export function posicionFila(caja, fila, filas) {
  if (caja.encajePares == null) return { avance: fila * caja.pasoAncho, invertida: false };
  // En un montaje impar, la fila suelta se dibuja primero, como en el plano.
  const filaEnParejas = fila - filas % 2;
  const parejasCompletas = Math.floor((filaEnParejas + 1) / 2);
  return {
    avance: fila * caja.pasoAncho - parejasCompletas * caja.encajePares,
    invertida: filaEnParejas >= 0 && filaEnParejas % 2 === 0,
  };
}

export function dimensionesMontaje(caja, columnas, filas, girada = false) {
  const piezasEnLinea = girada ? columnas : filas;
  const filasDeTroquel = girada ? filas : columnas;
  const horizontal = caja.largo + caja.pasoLargo * (piezasEnLinea - 1);
  const vertical = caja.ancho + posicionFila(caja, filasDeTroquel - 1, filasDeTroquel).avance;
  return {
    anchoMontaje: girada ? horizontal : vertical,
    largoMontaje: girada ? vertical : horizontal,
  };
}

export function trazadoTroquel(caja) {
  const { paneles, alto, solapa, oreja, cierre, fondo, orejaFondo } = caja.troquel;
  const bordes = [ALETA_PEGUE_CM];
  for (const panel of paneles) bordes.push(bordes.at(-1) + panel);
  const [a, b, c, d, e] = bordes;
  const arriba = solapa;
  const abajo = arriba + alto;
  if (caja.encajePares != null) {
    const alaLarga = (inicio, fin) => {
      const tramo = (fin - inicio) / 6;
      return [[fin, abajo], [fin - tramo / 4, abajo + fondo],
        [fin - tramo / 2, abajo + fondo], [fin - tramo, abajo + orejaFondo],
        [inicio + 3 * tramo, abajo + orejaFondo], [inicio + 2.6 * tramo, abajo + fondo],
        [inicio, abajo + fondo], [inicio, abajo]];
    };
    const alaCorta = (inicio, fin) => [
      [fin, abajo], [(inicio + fin) / 2, abajo + orejaFondo],
      [inicio, abajo + orejaFondo], [inicio, abajo],
    ];
    return {
      corte: [
        [0, arriba], [a, arriba], [a, 0], [b, 0],
        [b, arriba - oreja], [c, arriba - oreja], [c, arriba],
        [d, arriba], [d, arriba - oreja], [e, arriba - oreja],
        ...alaCorta(d, e), ...alaLarga(c, d), ...alaCorta(b, c), ...alaLarga(a, b),
        [0, abajo],
      ],
      dobleces: [
        ...bordes.slice(0, -1).map(x => [x, arriba, x, abajo]),
        [a, arriba, c, arriba], [d, arriba, e, arriba], [a, abajo, e, abajo],
        [b, abajo, b - (b-a)/6, abajo + orejaFondo],
        [d, abajo, d - (d-c)/6, abajo + orejaFondo],
        ...(cierre > 0 ? [[a, cierre, b, cierre]] : []),
      ],
    };
  }
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

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
  fondo_puntilla: {
    nombre: "Caja de solapa superior con fondo automático de refuerzo tipo puntilla",
    campos: [
      { id: "cierre_mm", nombre: "Aleta de cierre superior (mm)", valor: "17" },
      { id: "separacion", nombre: "Separación entre piezas", valor: "0" },
    ],
  },
  pollo_broaster: {
    nombre: "Caja fondo automático de seguridad con asa = Tipo pollo broaster",
    campos: [
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

  const puntilla = tipo === "fondo_puntilla";
  const broaster = tipo === "pollo_broaster";
  const fondoAutomatico = broaster || puntilla || tipo === "fondo_automatico";
  const entradas = Object.fromEntries(plantillasCaja[tipo].campos.map(({ id, valor }) => [
    id, cotizacion[`diseno_${id}`] ?? valor,
  ]));
  if (Object.values(entradas).some(valor => String(valor).trim() === "")) return null;
  const cierre = broaster ? 2 + ancho * 0.2 : Number(entradas.cierre_mm) / 10;
  const separacion = Number(entradas.separacion);
  const ajuste = fondoAutomatico ? 0.1 : Number(entradas.ajuste);
  if (![cierre, ajuste, separacion].every(n => Number.isFinite(n) && n >= 0)
      || ajuste >= ancho || (broaster && ancho < 0.25)) return null;

  const solapa = (broaster ? ancho * 0.6 : ancho) + cierre;
  const oreja = broaster ? ancho * 0.6 : solapa / 2;
  const largoAbierta = 2 * (largo + ancho) + ALETA_PEGUE_CM - ajuste;
  const proporcionFondo = largo <= 1.5 * ancho ? 0.65 : largo <= 2.5 * ancho ? 0.7 : 0.76;
  const fondoLargo = ancho - 0.1;
  const fondoCorto = ancho * 0.5;
  const orejaFondo = ancho * 0.5;
  const fondo = puntilla || broaster ? Math.max(fondoLargo, fondoCorto, orejaFondo)
    : fondoAutomatico ? ancho * proporcionFondo : solapa;
  const anchoAbierta = alto + solapa + fondo;
  // Si las dos tapas principales se cruzan al girar una fila, no se aplica encaje.
  const ahorroPorPareja = 2 * ancho - ajuste >= ALETA_PEGUE_CM ? oreja : 0;
  // Las tres aletas cortas permiten enfrentar los fondos en cada pareja.
  const encajeFondos = broaster ? (2 * ancho - ajuste >= ALETA_PEGUE_CM ? fondoLargo - fondoCorto : 0)
    : puntilla
    ? (2 * ancho - ajuste >= ALETA_PEGUE_CM
      ? Math.max(0, 2 * fondo - Math.max(fondoLargo + fondoCorto, 2 * orejaFondo, fondo + orejaFondo))
      : 0)
    : null;
  return {
    largo: largoAbierta,
    ancho: anchoAbierta,
    pasoLargo: largoAbierta + separacion,
    pasoAncho: (fondoAutomatico ? anchoAbierta : alto + solapa) + separacion,
    encajePares: broaster ? 0 : fondoAutomatico ? ahorroPorPareja : null,
    encajeFondos,
    troquel: {
      paneles: [largo, ancho, largo, ancho - ajuste],
      alto, solapa, oreja, cierre, fondo, orejaFondo, fondoLargo, fondoCorto, broaster,
    },
  };
}

export function posicionFila(caja, fila, filas) {
  if (caja.encajeFondos != null) {
    const unionesFondo = Math.ceil(fila / 2);
    const unionesCierre = Math.floor(fila / 2);
    return {
      avance: fila * caja.pasoAncho - unionesFondo * caja.encajeFondos - unionesCierre * caja.encajePares,
      invertida: fila % 2 === 1,
    };
  }
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
  const { paneles, alto, solapa, oreja, cierre, fondo, orejaFondo, fondoLargo, fondoCorto } = caja.troquel;
  const bordes = [ALETA_PEGUE_CM];
  for (const panel of paneles) bordes.push(bordes.at(-1) + panel);
  const [a, b, c, d, e] = bordes;
  const arriba = solapa;
  const abajo = arriba + alto;
  if (caja.troquel.broaster) {
    const tapa = (inicio, fin) => {
      const borde = (fin - inicio) * 0.06;
      return [[inicio, arriba], [inicio + borde, cierre], [inicio, cierre * 0.55],
        [inicio + borde, 0], [fin - borde, 0], [fin, cierre * 0.55],
        [fin - borde, cierre], [fin, arriba]];
    };
    const lateral = (inicio, fin) => [
      [inicio, arriba], [inicio + (fin - inicio) * 0.38, arriba - oreja],
      [fin - (fin - inicio) * 0.38, arriba - oreja], [fin, arriba],
    ];
    const base = (inicio, fin, profundidad) => [
      [fin, abajo], [fin, abajo + profundidad], [inicio, abajo + profundidad], [inicio, abajo],
    ];
    const puntaOreja = (fin) => fin - orejaFondo;
    const orejaInferior = (inicio, fin) => [
      [fin, abajo], [puntaOreja(fin), abajo + orejaFondo],
      [inicio, abajo + orejaFondo], [inicio, abajo],
    ];
    const asa = (inicio, fin) => ({
      x: inicio + (fin - inicio) * 0.32, y: cierre * 0.48,
      ancho: (fin - inicio) * 0.36, alto: cierre * 0.42, radio: cierre * 0.21,
    });
    const ranura = (inicio, fin) => ({
      x: inicio + (fin - inicio) * 0.48, y: arriba - oreja * 0.8,
      ancho: (fin - inicio) * 0.04, alto: oreja * 0.55, radio: 0,
    });
    return {
      corte: [[0, arriba + alto * 0.16], ...tapa(a, b), ...lateral(b, c),
        ...tapa(c, d), ...lateral(d, e), ...orejaInferior(d, e),
        ...base(c, d, fondoCorto), ...orejaInferior(b, c), ...base(a, b, fondoLargo),
        [0, abajo - alto * 0.16]],
      dobleces: [
        ...bordes.slice(0, -1).map(x => [x, arriba, x, abajo]),
        [a, arriba, e, arriba], [a, abajo, e, abajo],
        [a + (b - a) * 0.06, cierre, b - (b - a) * 0.06, cierre],
        [c + (d - c) * 0.06, cierre, d - (d - c) * 0.06, cierre],
        [b, abajo, puntaOreja(c), abajo + orejaFondo],
        [d, abajo, puntaOreja(e), abajo + orejaFondo],
      ],
      huecos: [asa(a, b), asa(c, d), ranura(b, c), ranura(d, e)],
    };
  }
  if (caja.encajePares != null) {
    const alaPuntilla = (inicio, fin, profundidad) => [
      [fin, abajo], [fin, abajo + profundidad],
      [inicio + Math.min((fin - inicio) / 4, profundidad * Math.tan(Math.PI / 36)), abajo + profundidad],
      [inicio, abajo],
    ];
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
    if (caja.encajeFondos != null) {
      const esquina = (inicio, fin) => [
        [fin, abajo], [fin, abajo + orejaFondo],
        [Math.max(inicio, fin - orejaFondo), abajo + orejaFondo], [inicio, abajo],
      ];
      const cortePuntilla = [
        [0, arriba], [a, arriba], [a, 0], [b, 0],
        [b, arriba - oreja], [c, arriba - oreja], [c, arriba],
        [d, arriba], [d, arriba - oreja], [e, arriba - oreja],
        ...esquina(d, e), ...alaPuntilla(c, d, fondoLargo),
        ...esquina(b, c), ...alaPuntilla(a, b, fondoCorto), [0, abajo],
      ];
      const doblecesPuntilla = [
        ...bordes.slice(0, -1).map(x => [x, arriba, x, abajo]),
        [a, arriba, c, arriba], [d, arriba, e, arriba], [a, abajo, e, abajo],
        [c, abajo, Math.max(b, c - orejaFondo), abajo + orejaFondo],
        [e, abajo, Math.max(d, e - orejaFondo), abajo + orejaFondo],
        ...(cierre > 0 ? [[a, cierre, b, cierre]] : []),
      ];
      return {
        corte: cortePuntilla.map(([x, y]) => [caja.largo - x, y]),
        dobleces: doblecesPuntilla.map(([x1, y1, x2, y2]) => [caja.largo - x1, y1, caja.largo - x2, y2]),
      };
    }
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

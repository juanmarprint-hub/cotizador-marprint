import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const anchosRollo = [35, 45, 52.5, 60, 70, 90, 105];

function numero(valor) {
  return Number(valor || 0);
}

function moneda(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

function obtenerMejoresMontajes(largoCaja, anchoCaja) {
  const margen = 2;
  const opciones = [];

  const orientaciones = [
    { nombre: "Normal", largo: largoCaja, ancho: anchoCaja },
    { nombre: "Girada", largo: anchoCaja, ancho: largoCaja },
  ];

  for (const orientacion of orientaciones) {
    for (let columnas = 1; columnas <= 10; columnas++) {
      for (let filas = 1; filas <= 10; filas++) {
        const anchoMontaje = orientacion.ancho * columnas;
        const largoMontaje = orientacion.largo * filas;
        const anchoHoja = anchoMontaje + margen;
        const largoHoja = largoMontaje + margen;

        if (anchoHoja < 35 || largoHoja < 45) continue;
        if (anchoHoja > 70 || largoHoja > 100) continue;

        for (const rollo of anchosRollo) {
          if (anchoHoja <= rollo) {
            const areaCosteo = rollo * largoHoja;
            const areaPiezas =
              orientacion.ancho * orientacion.largo * columnas * filas;

            opciones.push({
              id: `${orientacion.nombre}-${columnas}-${filas}-${rollo}`,
              orientacion: orientacion.nombre,
              columnas,
              filas,
              piezasPorHoja: columnas * filas,
              anchoMontaje,
              largoMontaje,
              anchoHoja,
              largoHoja,
              rollo,
              desperdicioAncho: rollo - anchoHoja,
              aprovechamiento: (areaPiezas / areaCosteo) * 100,
            });
          }
        }
      }
    }
  }

  const mejores = [...opciones]
    .sort((a, b) => {
      if (b.piezasPorHoja !== a.piezasPorHoja) {
        return b.piezasPorHoja - a.piezasPorHoja;
      }
      if (a.desperdicioAncho !== b.desperdicioAncho) {
        return a.desperdicioAncho - b.desperdicioAncho;
      }
      return b.aprovechamiento - a.aprovechamiento;
    })
    .slice(0, 4);

  const masPequeno = [...opciones].sort((a, b) => {
    return a.anchoHoja * a.largoHoja - b.anchoHoja * b.largoHoja;
  })[0];

  if (masPequeno && !mejores.some((m) => m.id === masPequeno.id)) {
    mejores[3] = masPequeno;
  }

  return mejores;
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usuario, setUsuario] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [pantalla, setPantalla] = useState("menu");
  const [opcionesMontaje, setOpcionesMontaje] = useState([]);
  const [montajeSeleccionado, setMontajeSeleccionado] = useState(null);
  const [resultados, setResultados] = useState([]);

  const [catalogos, setCatalogos] = useState({
    clientes: [],
    lineas: [],
    materiales: [],
    plasticos: [],
    barnices: [],
    pegues: [],
    envios: [],
    constantes: [],
    utilidades: [],
  });

  const [form, setForm] = useState({
    razon_social: "",
    nit: "",
    contacto: "",
    telefono: "",
    whatsapp: "",
    correo: "",
    direccion: "",
    ciudad: "",
    observaciones: "",
  });

  const [cotizacion, setCotizacion] = useState({
    cliente: "",
    fv: false,
    linea: "",
    nombre_producto: "",
    largo_abierta: "",
    ancho_abierta: "",
    largo_armada: "",
    ancho_armada: "",
    alto_armada: "",
    material_calibre: "",
    cantidad_1: "",
    cantidad_2: "",
    cantidad_3: "",
    cantidad_4: "",
    cantidad_5: "",
    tintas: "",
    plastico_tiro: "",
    plastico_retiro: "",
    barniz_tiro: "",
    barniz_retiro: "",
    troquelado: false,
    repujado: false,
    ventanilla: false,
    largo_ventana: "",
    ancho_ventana: "",
    pegue: "",
    envio: "",
    costo_especial: "",
  });

  useEffect(() => {
    async function cargarCatalogos() {
      const [
        clientes,
        lineas,
        materiales,
        plasticos,
        barnices,
        pegues,
        envios,
        constantes,
        utilidades,
      ] = await Promise.all([
        supabase.from("clientes").select("*").order("razon_social"),
        supabase.from("lineas").select("*").order("nombre"),
        supabase.from("materiales").select("*").order("material"),
        supabase.from("plasticos").select("*").order("ref"),
        supabase.from("barnices").select("*").order("ref"),
        supabase.from("pegues").select("*").order("ref"),
        supabase.from("envios").select("*").order("ref"),
        supabase.from("constantes").select("*").order("ref"),
        supabase.from("utilidades").select("*").order("cantidad"),
      ]);

      setCatalogos({
        clientes: clientes.data || [],
        lineas: lineas.data || [],
        materiales: materiales.data || [],
        plasticos: plasticos.data || [],
        barnices: barnices.data || [],
        pegues: pegues.data || [],
        envios: envios.data || [],
        constantes: constantes.data || [],
        utilidades: utilidades.data || [],
      });
    }

    if (usuario) cargarCatalogos();
  }, [usuario]);

  useEffect(() => {
    const largo = parseFloat(cotizacion.largo_abierta);
    const ancho = parseFloat(cotizacion.ancho_abierta);

    if (largo > 0 && ancho > 0) {
      const opciones = obtenerMejoresMontajes(largo, ancho);
      setOpcionesMontaje(opciones);
      setMontajeSeleccionado(opciones[0] || null);
    } else {
      setOpcionesMontaje([]);
      setMontajeSeleccionado(null);
    }

    setResultados([]);
  }, [cotizacion.largo_abierta, cotizacion.ancho_abierta]);

  async function login(e) {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Usuario o contraseña incorrectos");
    } else {
      setUsuario(data.user);
      setPantalla("menu");
    }
  }

  function cambiar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function cambiarCotizacion(e) {
    const { name, value, type, checked } = e.target;
    setCotizacion({
      ...cotizacion,
      [name]: type === "checkbox" ? checked : value,
    });
    setResultados([]);
  }

  async function guardarCliente(e) {
    e.preventDefault();
    setMensaje("Guardando...");

    const { error } = await supabase.from("clientes").insert([form]);

    if (error) {
      setMensaje("Error: " + error.message);
    } else {
      setMensaje("Cliente guardado correctamente ✅");
      setForm({
        razon_social: "",
        nit: "",
        contacto: "",
        telefono: "",
        whatsapp: "",
        correo: "",
        direccion: "",
        ciudad: "",
        observaciones: "",
      });
    }
  }

  function buscarPorId(lista, id) {
    return lista.find((item) => String(item.id) === String(id));
  }

  function constante(ref) {
    const item = catalogos.constantes.find((c) => c.ref === ref);
    return numero(item?.valor);
  }

  function utilidadPorTotal(total) {
    const ordenadas = [...catalogos.utilidades].sort((a, b) => {
      if (a.cantidad === null) return 1;
      if (b.cantidad === null) return -1;
      return numero(a.cantidad) - numero(b.cantidad);
    });

    const encontrada = ordenadas.find(
      (u) => u.cantidad !== null && total <= numero(u.cantidad)
    );

    if (encontrada) return numero(encontrada.porcentaje);

    const final = ordenadas.find((u) => u.cantidad === null);
    return numero(final?.porcentaje || 0.4);
  }

  function calcularCotizacion(e) {
    e.preventDefault();

    if (!montajeSeleccionado) {
      alert("No hay montaje seleccionado.");
      return;
    }

    const material = buscarPorId(
      catalogos.materiales,
      cotizacion.material_calibre
    );
    const plasticoTiro = buscarPorId(
      catalogos.plasticos,
      cotizacion.plastico_tiro
    );
    const plasticoRetiro = buscarPorId(
      catalogos.plasticos,
      cotizacion.plastico_retiro
    );
    const barnizTiro = buscarPorId(
      catalogos.barnices,
      cotizacion.barniz_tiro
    );
    const barnizRetiro = buscarPorId(
      catalogos.barnices,
      cotizacion.barniz_retiro
    );
    const pegue = buscarPorId(catalogos.pegues, cotizacion.pegue);
    const envio = buscarPorId(catalogos.envios, cotizacion.envio);

    if (!material) {
      alert("Selecciona material.");
      return;
    }

    const areaCosteoM2 =
      (montajeSeleccionado.rollo * montajeSeleccionado.largoHoja) / 10000;

    const tintas = numero(cotizacion.tintas);

    const cantidades = [1, 2, 3, 4, 5]
      .map((n) => numero(cotizacion[`cantidad_${n}`]))
      .filter((c) => c > 0);

    const nuevosResultados = cantidades.map((cantidad, index) => {
      const tirosBase = Math.ceil(
        cantidad / montajeSeleccionado.piezasPorHoja
      );

      let sobrantes = 0;

      if (tirosBase < 1000) {
        sobrantes = 100;
      } else if (tirosBase < 3000) {
        sobrantes = Math.ceil(tirosBase * 0.1);
      } else if (tirosBase > 3001) {
        sobrantes = 300;
      }

      const tirosConSobrantes = tirosBase + sobrantes;

      const papelBase =
        areaCosteoM2 * tirosConSobrantes * numero(material.valor_pap_m2);

      const papel = cotizacion.fv ? papelBase : papelBase * 1.19;

      const diseno = constante("DISEÑO");
      const ctp = constante("CTP") * tintas;

      const troquel = cotizacion.troquelado
        ? montajeSeleccionado.anchoMontaje *
          montajeSeleccionado.largoMontaje *
          constante("TROQUEL")
        : 0;

      const pesoKg =
        (numero(material.peso_basico) * areaCosteoM2 * tirosConSobrantes) /
        1000;

      const conversion =
        constante("CUADRE DE CONVERSION") +
        (pesoKg / 1000) * constante("CONVERSION X TON");

      const corte = constante("CORTE") * tirosBase;

      const impresion =
        constante("CUADRE DE IMPRESIÓN") +
        (tirosBase < 1000
          ? 1000 * tintas * constante("IMPRESIÓN")
          : tirosBase * tintas * constante("IMPRESIÓN"));

      const plastificadoTiro = plasticoTiro
        ? areaCosteoM2 * tirosBase * numero(plasticoTiro.valor_plas_m2)
        : 0;

      const plastificadoRetiro = plasticoRetiro
        ? areaCosteoM2 * tirosBase * numero(plasticoRetiro.valor_plas_m2)
        : 0;

      const barnizTiroCosto = barnizTiro
        ? constante("CUADRE BARNIZ") +
          areaCosteoM2 * tirosBase * numero(barnizTiro.valor_bar_m2)
        : 0;

      const barnizRetiroCosto = barnizRetiro
        ? constante("CUADRE BARNIZ") +
          areaCosteoM2 * tirosBase * numero(barnizRetiro.valor_bar_m2)
        : 0;

      const repujado = cotizacion.repujado
        ? constante("CUADRE TROQUEL O REPUJE") +
          areaCosteoM2 * constante("CLISE REPUJE") +
          (tirosBase < 1000
            ? constante("MILLAR TROQUELADO") * 1000
            : tirosBase * constante("MILLAR TROQUELADO"))
        : 0;

      const troquelado = cotizacion.troquelado
        ? constante("CUADRE TROQUEL O REPUJE") +
          (tirosBase < 1000
            ? constante("MILLAR TROQUELADO") * 1000
            : tirosBase * constante("MILLAR TROQUELADO"))
        : 0;

      const descartonado = cotizacion.troquelado
        ? constante("DESCARTONE/UND") * cantidad
        : 0;

      const valorVentanilla =
        ((numero(cotizacion.largo_ventana) *
          numero(cotizacion.ancho_ventana)) /
          10000) *
        constante("COSTO VENTANA M2");

      const ventanilla = cotizacion.ventanilla
        ? (constante("PEGUE DE VENTANILLA") + valorVentanilla) * cantidad
        : 0;

      const pegueCosto = pegue
        ? numero(pegue.cuadre_maquina) + numero(pegue.valor_peg_und) * cantidad
        : 0;

      const costoEspecial = numero(cotizacion.costo_especial) * cantidad;

      const empaque = constante("FACTOR EMPAQUE") * cantidad * 1000;

      const envioCosto = envio ? pesoKg * numero(envio.valor_env_kg) : 0;

      const subtotalSinComision =
        papel +
        diseno +
        ctp +
        troquel +
        conversion +
        corte +
        impresion +
        plastificadoTiro +
        plastificadoRetiro +
        barnizTiroCosto +
        barnizRetiroCosto +
        repujado +
        troquelado +
        descartonado +
        ventanilla +
        pegueCosto +
        costoEspecial +
        empaque +
        envioCosto;

      const comision = subtotalSinComision * constante("COMISION");

      const total = subtotalSinComision + comision;
      const gananciaPorcentaje = utilidadPorTotal(total);
      const gananciaPesos = total * gananciaPorcentaje;
      const totalTrabajo = total + gananciaPesos;
      const valorUnitario = totalTrabajo / cantidad;

      return {
        nombre: `Cantidad ${index + 1}`,
        cantidad,
        tirosBase,
        sobrantes,
        tirosConSobrantes,
        papel,
        diseno,
        ctp,
        troquel,
        conversion,
        corte,
        impresion,
        plastificadoTiro,
        plastificadoRetiro,
        barnizTiroCosto,
        barnizRetiroCosto,
        repujado,
        troquelado,
        descartonado,
        ventanilla,
        pegueCosto,
        costoEspecial,
        empaque,
        envioCosto,
        comision,
        total,
        gananciaPorcentaje,
        gananciaPesos,
        totalTrabajo,
        valorUnitario,
      };
    });

    setResultados(nuevosResultados);
  }

  if (!usuario) {
    return (
      <main style={{ padding: 40, fontFamily: "Arial" }}>
        <h1>Ingreso vendedores</h1>

        <form onSubmit={login}>
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", marginBottom: 10, padding: 10 }}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", marginBottom: 10, padding: 10 }}
          />

          <button type="submit">Ingresar</button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial", maxWidth: 1200 }}>
      <h1>Cotizador Marprint</h1>
      <p>Usuario: {usuario.email}</p>

      <button onClick={() => setUsuario(null)}>Cerrar sesión</button>

      {pantalla === "menu" && (
        <div>
          <h2>Menú principal</h2>

          <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
            <button
              onClick={() => setPantalla("clientes")}
              style={{ padding: 30, borderRadius: 12, fontSize: 18 }}
            >
              👤<br />
              Crear Cliente
            </button>

            <button
              onClick={() => setPantalla("cotizar")}
              style={{ padding: 30, borderRadius: 12, fontSize: 18 }}
            >
              🧾<br />
              Cotizar
            </button>
          </div>
        </div>
      )}

      {pantalla === "clientes" && (
        <div>
          <button onClick={() => setPantalla("menu")}>← Volver</button>
          <h2>Crear cliente</h2>

          <form onSubmit={guardarCliente}>
            {Object.keys(form).map((campo) => (
              <div key={campo} style={{ marginBottom: 12 }}>
                <label>{campo.replace("_", " ").toUpperCase()}</label>
                <br />
                <input
                  name={campo}
                  value={form[campo]}
                  onChange={cambiar}
                  style={{ width: "100%", padding: 10 }}
                />
              </div>
            ))}

            <button type="submit" style={{ padding: "12px 20px" }}>
              Guardar cliente
            </button>
          </form>

          <p>{mensaje}</p>
        </div>
      )}

      {pantalla === "cotizar" && (
        <div>
          <button onClick={() => setPantalla("menu")}>← Volver</button>
          <h2>Cotizador</h2>

          <form onSubmit={calcularCotizacion}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
            >
              <div>
                <label>CLIENTE *</label>
                <select
                  name="cliente"
                  value={cotizacion.cliente}
                  onChange={cambiarCotizacion}
                  required
                  style={{ width: "100%", padding: 10 }}
                >
                  <option value="">Seleccionar cliente</option>
                  {catalogos.clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razon_social}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>FV?</label>
                <input
                  type="checkbox"
                  name="fv"
                  checked={cotizacion.fv}
                  onChange={cambiarCotizacion}
                  style={{ marginLeft: 10 }}
                />
              </div>

              <div>
                <label>LÍNEA *</label>
                <select
                  name="linea"
                  value={cotizacion.linea}
                  onChange={cambiarCotizacion}
                  required
                  style={{ width: "100%", padding: 10 }}
                >
                  <option value="">Seleccionar línea</option>
                  {catalogos.lineas.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>NOMBRE DEL PRODUCTO *</label>
                <input
                  name="nombre_producto"
                  value={cotizacion.nombre_producto}
                  onChange={cambiarCotizacion}
                  required
                  style={{ width: "100%", padding: 10 }}
                />
              </div>

              <div>
                <label>LARGO ABIERTA *</label>
                <input
                  type="number"
                  step="0.01"
                  name="largo_abierta"
                  value={cotizacion.largo_abierta}
                  onChange={cambiarCotizacion}
                  required
                  style={{ width: "100%", padding: 10 }}
                />
              </div>

              <div>
                <label>ANCHO ABIERTA *</label>
                <input
                  type="number"
                  step="0.01"
                  name="ancho_abierta"
                  value={cotizacion.ancho_abierta}
                  onChange={cambiarCotizacion}
                  required
                  style={{ width: "100%", padding: 10 }}
                />
              </div>

              <div>
                <label>LARGO ARMADA</label>
                <input
                  type="number"
                  step="0.01"
                  name="largo_armada"
                  value={cotizacion.largo_armada}
                  onChange={cambiarCotizacion}
                  style={{ width: "100%", padding: 10 }}
                />
              </div>

              <div>
                <label>ANCHO ARMADA</label>
                <input
                  type="number"
                  step="0.01"
                  name="ancho_armada"
                  value={cotizacion.ancho_armada}
                  onChange={cambiarCotizacion}
                  style={{ width: "100%", padding: 10 }}
                />
              </div>

              <div>
                <label>ALTO ARMADA</label>
                <input
                  type="number"
                  step="0.01"
                  name="alto_armada"
                  value={cotizacion.alto_armada}
                  onChange={cambiarCotizacion}
                  style={{ width: "100%", padding: 10 }}
                />
              </div>

              <div>
                <label>MATERIAL Y CALIBRE *</label>
                <select
                  name="material_calibre"
                  value={cotizacion.material_calibre}
                  onChange={cambiarCotizacion}
                  required
                  style={{ width: "100%", padding: 10 }}
                >
                  <option value="">Seleccionar material</option>
                  {catalogos.materiales.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.material} - Calibre {m.calibre} -{" "}
                      {moneda(m.valor_pap_m2)}/m²
                    </option>
                  ))}
                </select>
              </div>

              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n}>
                  <label>
                    CANTIDAD {n}
                    {n === 1 ? " *" : ""}
                  </label>
                  <input
                    type="number"
                    name={`cantidad_${n}`}
                    value={cotizacion[`cantidad_${n}`]}
                    onChange={cambiarCotizacion}
                    required={n === 1}
                    style={{ width: "100%", padding: 10 }}
                  />
                </div>
              ))}

              <div>
                <label>TINTAS *</label>
                <input
                  type="number"
                  name="tintas"
                  value={cotizacion.tintas}
                  onChange={cambiarCotizacion}
                  required
                  style={{ width: "100%", padding: 10 }}
                />
              </div>

              <div>
                <label>PLÁSTICO TIRO</label>
                <select
                  name="plastico_tiro"
                  value={cotizacion.plastico_tiro}
                  onChange={cambiarCotizacion}
                  style={{ width: "100%", padding: 10 }}
                >
                  <option value="">Ninguno</option>
                  {catalogos.plasticos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.ref} - {moneda(p.valor_plas_m2)}/m²
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>PLÁSTICO RETIRO</label>
                <select
                  name="plastico_retiro"
                  value={cotizacion.plastico_retiro}
                  onChange={cambiarCotizacion}
                  style={{ width: "100%", padding: 10 }}
                >
                  <option value="">Ninguno</option>
                  {catalogos.plasticos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.ref} - {moneda(p.valor_plas_m2)}/m²
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>BARNIZ TIRO</label>
                <select
                  name="barniz_tiro"
                  value={cotizacion.barniz_tiro}
                  onChange={cambiarCotizacion}
                  style={{ width: "100%", padding: 10 }}
                >
                  <option value="">Ninguno</option>
                  {catalogos.barnices.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.ref} - {moneda(b.valor_bar_m2)}/m²
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>BARNIZ RETIRO</label>
                <select
                  name="barniz_retiro"
                  value={cotizacion.barniz_retiro}
                  onChange={cambiarCotizacion}
                  style={{ width: "100%", padding: 10 }}
                >
                  <option value="">Ninguno</option>
                  {catalogos.barnices.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.ref} - {moneda(b.valor_bar_m2)}/m²
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>TROQUELADO</label>
                <input
                  type="checkbox"
                  name="troquelado"
                  checked={cotizacion.troquelado}
                  onChange={cambiarCotizacion}
                  style={{ marginLeft: 10 }}
                />
              </div>

              <div>
                <label>REPUJADO</label>
                <input
                  type="checkbox"
                  name="repujado"
                  checked={cotizacion.repujado}
                  onChange={cambiarCotizacion}
                  style={{ marginLeft: 10 }}
                />
              </div>

              <div>
                <label>VENTANILLA</label>
                <input
                  type="checkbox"
                  name="ventanilla"
                  checked={cotizacion.ventanilla}
                  onChange={cambiarCotizacion}
                  style={{ marginLeft: 10 }}
                />
              </div>

              {cotizacion.ventanilla && (
                <>
                  <div>
                    <label>LARGO VENTANA</label>
                    <input
                      type="number"
                      step="0.01"
                      name="largo_ventana"
                      value={cotizacion.largo_ventana}
                      onChange={cambiarCotizacion}
                      style={{ width: "100%", padding: 10 }}
                    />
                  </div>

                  <div>
                    <label>ANCHO VENTANA</label>
                    <input
                      type="number"
                      step="0.01"
                      name="ancho_ventana"
                      value={cotizacion.ancho_ventana}
                      onChange={cambiarCotizacion}
                      style={{ width: "100%", padding: 10 }}
                    />
                  </div>
                </>
              )}

              <div>
                <label>PEGUE</label>
                <select
                  name="pegue"
                  value={cotizacion.pegue}
                  onChange={cambiarCotizacion}
                  style={{ width: "100%", padding: 10 }}
                >
                  <option value="">Ninguno</option>
                  {catalogos.pegues.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.ref} - {moneda(p.valor_peg_und)}/und
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>ENVÍO *</label>
                <select
                  name="envio"
                  value={cotizacion.envio}
                  onChange={cambiarCotizacion}
                  required
                  style={{ width: "100%", padding: 10 }}
                >
                  <option value="">Seleccionar envío</option>
                  {catalogos.envios.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.ref} - {moneda(e.valor_env_kg)}/kg
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>COSTO ESPECIAL $/UND</label>
                <input
                  type="number"
                  name="costo_especial"
                  value={cotizacion.costo_especial}
                  onChange={cambiarCotizacion}
                  style={{ width: "100%", padding: 10 }}
                />
              </div>
            </div>

            {opcionesMontaje.length > 0 && (
              <div style={{ marginTop: 30 }}>
                <h3>Opciones de montaje sugeridas</h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 20,
                  }}
                >
                  {opcionesMontaje.map((opcion, index) => (
                    <div
                      key={opcion.id}
                      onClick={() => setMontajeSeleccionado(opcion)}
                      style={{
                        padding: 20,
                        border:
                          montajeSeleccionado?.id === opcion.id
                            ? "3px solid #111"
                            : "1px solid #ccc",
                        borderRadius: 12,
                        cursor: "pointer",
                        background:
                          montajeSeleccionado?.id === opcion.id
                            ? "#f1f1f1"
                            : "white",
                      }}
                    >
                      <h4>Opción {index + 1}</h4>
                      <p>
                        <strong>Orientación:</strong> {opcion.orientacion}
                      </p>
                      <p>
                        <strong>Montaje:</strong> {opcion.columnas} columnas x{" "}
                        {opcion.filas} filas
                      </p>
                      <p>
                        <strong>Piezas por hoja:</strong>{" "}
                        {opcion.piezasPorHoja}
                      </p>
                      <p>
                        <strong>Medida montaje:</strong>{" "}
                        {opcion.anchoMontaje.toFixed(2)} x{" "}
                        {opcion.largoMontaje.toFixed(2)} cm
                      </p>
                      <p>
                        <strong>Medida hoja:</strong>{" "}
                        {opcion.anchoHoja.toFixed(2)} x{" "}
                        {opcion.largoHoja.toFixed(2)} cm
                      </p>
                      <p>
                        <strong>Rollo:</strong> {opcion.rollo} cm
                      </p>
                      <p>
                        <strong>Desperdicio ancho:</strong>{" "}
                        {opcion.desperdicioAncho.toFixed(2)} cm
                      </p>
                      <p>
                        <strong>Aprovechamiento:</strong>{" "}
                        {opcion.aprovechamiento.toFixed(2)}%
                      </p>

                      {montajeSeleccionado?.id === opcion.id && (
                        <strong>✅ Montaje seleccionado</strong>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 30 }}>
              <button
                type="submit"
                style={{
                  padding: "15px 30px",
                  fontSize: 18,
                  borderRadius: 10,
                }}
              >
                CALCULAR COTIZACIÓN
              </button>
            </div>
          </form>

          {resultados.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <h2>Resultado de cotización</h2>

              <div style={{ overflowX: "auto" }}>
                <table
                  border="1"
                  cellPadding="8"
                  style={{ borderCollapse: "collapse", width: "100%" }}
                >
                  <thead>
                    <tr>
                      <th>Fase</th>
                      {resultados.map((r) => (
                        <th key={r.nombre}>
                          {r.nombre}
                          <br />
                          {r.cantidad} und
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {[
                      ["TIROS BASE", "tirosBase"],
                      ["SOBRANTES", "sobrantes"],
                      ["TIROS TOTALES", "tirosConSobrantes"],
                      ["PAPEL", "papel"],
                      ["DISEÑO", "diseno"],
                      ["CTP", "ctp"],
                      ["TROQUEL", "troquel"],
                      ["CONVERSIÓN", "conversion"],
                      ["CORTE", "corte"],
                      ["IMPRESIÓN", "impresion"],
                      ["PLASTIFICADO TIRO", "plastificadoTiro"],
                      ["PLASTIFICADO RETIRO", "plastificadoRetiro"],
                      ["BARNIZ TIRO", "barnizTiroCosto"],
                      ["BARNIZ RETIRO", "barnizRetiroCosto"],
                      ["REPUJADO", "repujado"],
                      ["TROQUELADO", "troquelado"],
                      ["DESCARTONADO", "descartonado"],
                      ["VENTANILLA", "ventanilla"],
                      ["PEGUE", "pegueCosto"],
                      ["COSTO ESPECIAL", "costoEspecial"],
                      ["EMPAQUE", "empaque"],
                      ["ENVÍO", "envioCosto"],
                      ["COMISIÓN", "comision"],
                      ["TOTAL", "total"],
                    ].map(([label, key]) => (
                      <tr key={key}>
                        <td>
                          <strong>{label}</strong>
                        </td>
                        {resultados.map((r) => (
                          <td key={r.nombre + key}>
                            {["tirosBase", "sobrantes", "tirosConSobrantes"].includes(
                              key
                            )
                              ? r[key]
                              : moneda(r[key])}
                          </td>
                        ))}
                      </tr>
                    ))}

                    <tr>
                      <td>
                        <strong>GANANCIA %</strong>
                      </td>
                      {resultados.map((r) => (
                        <td key={r.nombre + "gananciaPorcentaje"}>
                          {(r.gananciaPorcentaje * 100).toFixed(0)}%
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td>
                        <strong>GANANCIA $</strong>
                      </td>
                      {resultados.map((r) => (
                        <td key={r.nombre + "gananciaPesos"}>
                          {moneda(r.gananciaPesos)}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td>
                        <strong>TOTAL TRABAJO</strong>
                      </td>
                      {resultados.map((r) => (
                        <td key={r.nombre + "totalTrabajo"}>
                          {moneda(r.totalTrabajo)}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td>
                        <strong>VALOR UNITARIO</strong>
                      </td>
                      {resultados.map((r) => (
                        <td key={r.nombre + "valorUnitario"}>
                          <strong>{moneda(r.valorUnitario)}</strong>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

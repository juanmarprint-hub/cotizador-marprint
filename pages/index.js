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
async function recuperarPassword() {
  const correo = email.trim();

  if (!correo) {
    alert("Primero escribe tu correo electrónico.");
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(
    correo,
    {
      redirectTo:
        "https://cotizador-marprint.vercel.app/restablecer",
    }
  );

  if (error) {
    alert("Error: " + error.message);
  } else {
    alert(
      "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa también Spam."
    );
  }
}
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
      <main className="marprint mp-login">
<style>{`
 .marprint{--blue:#2563eb;--navy:#132b4d;box-sizing:border-box;color:#233650;font-family:Arial,sans-serif;background:#f3f6fb;min-height:100vh;padding:32px!important;max-width:none!important}
 .marprint *{box-sizing:border-box}.marprint h1{color:var(--navy);letter-spacing:-1px;margin:0 0 12px}.marprint h2{font-size:23px}.marprint p{line-height:1.6}.marprint label{font-size:12px;font-weight:700;color:#53647b;display:block;margin-bottom:8px}
 .marprint input:not([type=checkbox]),.marprint select{width:100%;padding:12px!important;background:#fff;border:1px solid #cfdae8;border-radius:9px;font-size:15px;color:#1e3553;min-height:45px}.marprint input:focus,.marprint select:focus{outline:3px solid #bfdbfe;border-color:var(--blue)}
 .marprint button{border:1px solid #d4deec;background:white;color:var(--navy);border-radius:10px;padding:12px 18px;cursor:pointer;font-weight:700}.marprint button:hover{border-color:var(--blue);background:#eff6ff}.marprint button[type=submit]{background:var(--blue);color:white;border-color:var(--blue)}
 .marprint input[type=checkbox]{appearance:none;width:42px;height:24px;background:#cbd5e1;border-radius:20px;vertical-align:middle;position:relative;cursor:pointer}.marprint input[type=checkbox]:after{content:'';position:absolute;width:18px;height:18px;left:3px;top:3px;background:white;border-radius:50%;transition:transform .15s}.marprint input[type=checkbox]:checked{background:var(--blue)}.marprint input[type=checkbox]:checked:after{transform:translateX(18px)}.marprint input[type=checkbox]:focus-visible{outline:3px solid #93c5fd}
 .mp-card{border:1px solid #e0e7f0;border-radius:18px;background:#fff;padding:26px;margin:22px 0;box-shadow:0 5px 20px #132b4d08}.mp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}.mp-card h3{grid-column:1/-1;margin:0 0 6px;color:#132b4d;font-size:18px}.mp-card h3 small{display:block;font-size:13px;font-weight:400;color:#687991;margin-top:8px}.mp-quantities{grid-template-columns:repeat(5,minmax(0,1fr))}
 .mp-nav{display:flex;flex-direction:column;gap:12px;position:fixed;left:0;top:0;bottom:0;width:220px;padding:30px 20px;background:#132b4d;color:white}.mp-nav strong{font-size:24px;margin-bottom:28px}.mp-nav button{text-align:left;background:#ffffff0d;color:white;border-color:#ffffff20}.mp-nav button[aria-current=page]{background:#2563eb}.mp-app{padding-left:250px!important}.mp-content{max-width:1250px;margin:auto}.mp-login{display:grid;place-items:center;background:linear-gradient(135deg,#10233f,#205aba)}.mp-login-card{background:white;border-radius:22px;padding:36px;width:min(100%,440px);box-shadow:0 20px 60px #0003}.mp-login-card h1{font-size:27px}.mp-login-card form>button[type=submit]{width:100%;margin-top:12px}
 .mp-montage{width:100%;text-align:left!important;display:block}.mp-montage[aria-pressed=true]{border-color:#2563eb!important;background:#eff6ff!important}.mp-sheet{display:grid;gap:3px;background:#dce6f2;border:1px solid #b6c7db;padding:8px;margin:18px auto;max-width:100%;width:220px}.mp-piece{display:block;background:#79a9f5;border:1px solid #3979d8;border-radius:2px;min-height:5px}.mp-badge{display:inline-block;background:#dcfce7;color:#166534;padding:5px 9px;border-radius:20px;font-size:12px}.marprint table{border:0!important;background:white;font-size:13px}.marprint td,.marprint th{padding:13px!important;border:0;border-bottom:1px solid #e5ebf3;white-space:nowrap}.marprint th{background:#132b4d;color:white;position:sticky;top:0}.marprint td:not(:first-child){text-align:right}.marprint tbody tr:nth-child(even){background:#f8fafc}.marprint tbody tr:last-child{background:#e6efff;color:#1749a2;font-size:17px}.mp-table{max-height:650px;overflow:auto;border-radius:12px}.mp-menu{display:flex;gap:20px;flex-wrap:wrap}.mp-menu button{flex:1;min-width:200px;background:white;box-shadow:0 5px 20px #132b4d08;border:1px solid #e0e7f0;padding:40px!important}
 @media(max-width:1000px){.mp-nav{position:static;width:auto;flex-direction:row;flex-wrap:wrap;border-radius:14px;margin-bottom:24px;padding:18px}.mp-nav strong{margin:0 18px 0 0;align-self:center}.mp-app{padding:20px!important}.mp-quantities{grid-template-columns:repeat(3,minmax(0,1fr))}}
 @media(max-width:600px){.marprint{padding:16px!important}.mp-grid,.mp-quantities{grid-template-columns:1fr!important}.mp-card{padding:18px}.mp-login-card{padding:26px}.mp-nav strong{width:100%}}
`}</style>
<div className="mp-login-card">
<p>MARPRINT · Cotizaciones industriales</p>
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

<div style={{ marginTop: 20 }}>
  <button
    type="button"
    onClick={recuperarPassword}
    style={{
      background: "none",
      border: "none",
      color: "#0066cc",
      textDecoration: "underline",
      cursor: "pointer",
      padding: 0,
      fontSize: 14,
    }}
  >
    ¿Olvidaste tu contraseña?
  </button>
</div>
        </form>
      </div></main>
    );
  }

  return (
    <main className="marprint mp-app">
<style>{`
 .marprint{--blue:#2563eb;--navy:#132b4d;box-sizing:border-box;color:#233650;font-family:Arial,sans-serif;background:#f3f6fb;min-height:100vh;padding:32px!important;max-width:none!important}
 .marprint *{box-sizing:border-box}.marprint h1{color:var(--navy);letter-spacing:-1px;margin:0 0 12px}.marprint h2{font-size:23px}.marprint p{line-height:1.6}.marprint label{font-size:12px;font-weight:700;color:#53647b;display:block;margin-bottom:8px}
 .marprint input:not([type=checkbox]),.marprint select{width:100%;padding:12px!important;background:#fff;border:1px solid #cfdae8;border-radius:9px;font-size:15px;color:#1e3553;min-height:45px}.marprint input:focus,.marprint select:focus{outline:3px solid #bfdbfe;border-color:var(--blue)}
 .marprint button{border:1px solid #d4deec;background:white;color:var(--navy);border-radius:10px;padding:12px 18px;cursor:pointer;font-weight:700}.marprint button:hover{border-color:var(--blue);background:#eff6ff}.marprint button[type=submit]{background:var(--blue);color:white;border-color:var(--blue)}
 .marprint input[type=checkbox]{appearance:none;width:42px;height:24px;background:#cbd5e1;border-radius:20px;vertical-align:middle;position:relative;cursor:pointer}.marprint input[type=checkbox]:after{content:'';position:absolute;width:18px;height:18px;left:3px;top:3px;background:white;border-radius:50%;transition:transform .15s}.marprint input[type=checkbox]:checked{background:var(--blue)}.marprint input[type=checkbox]:checked:after{transform:translateX(18px)}.marprint input[type=checkbox]:focus-visible{outline:3px solid #93c5fd}
 .mp-card{border:1px solid #e0e7f0;border-radius:18px;background:#fff;padding:26px;margin:22px 0;box-shadow:0 5px 20px #132b4d08}.mp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}.mp-card h3{grid-column:1/-1;margin:0 0 6px;color:#132b4d;font-size:18px}.mp-card h3 small{display:block;font-size:13px;font-weight:400;color:#687991;margin-top:8px}.mp-quantities{grid-template-columns:repeat(5,minmax(0,1fr))}
 .mp-nav{display:flex;flex-direction:column;gap:12px;position:fixed;left:0;top:0;bottom:0;width:220px;padding:30px 20px;background:#132b4d;color:white}.mp-nav strong{font-size:24px;margin-bottom:28px}.mp-nav button{text-align:left;background:#ffffff0d;color:white;border-color:#ffffff20}.mp-nav button[aria-current=page]{background:#2563eb}.mp-app{padding-left:250px!important}.mp-content{max-width:1250px;margin:auto}.mp-login{display:grid;place-items:center;background:linear-gradient(135deg,#10233f,#205aba)}.mp-login-card{background:white;border-radius:22px;padding:36px;width:min(100%,440px);box-shadow:0 20px 60px #0003}.mp-login-card h1{font-size:27px}.mp-login-card form>button[type=submit]{width:100%;margin-top:12px}
 .mp-montage{width:100%;text-align:left!important;display:block}.mp-montage[aria-pressed=true]{border-color:#2563eb!important;background:#eff6ff!important}.mp-sheet{display:grid;gap:3px;background:#dce6f2;border:1px solid #b6c7db;padding:8px;margin:18px auto;max-width:100%;width:220px}.mp-piece{display:block;background:#79a9f5;border:1px solid #3979d8;border-radius:2px;min-height:5px}.mp-badge{display:inline-block;background:#dcfce7;color:#166534;padding:5px 9px;border-radius:20px;font-size:12px}.marprint table{border:0!important;background:white;font-size:13px}.marprint td,.marprint th{padding:13px!important;border:0;border-bottom:1px solid #e5ebf3;white-space:nowrap}.marprint th{background:#132b4d;color:white;position:sticky;top:0}.marprint td:not(:first-child){text-align:right}.marprint tbody tr:nth-child(even){background:#f8fafc}.marprint tbody tr:last-child{background:#e6efff;color:#1749a2;font-size:17px}.mp-table{max-height:650px;overflow:auto;border-radius:12px}.mp-menu{display:flex;gap:20px;flex-wrap:wrap}.mp-menu button{flex:1;min-width:200px;background:white;box-shadow:0 5px 20px #132b4d08;border:1px solid #e0e7f0;padding:40px!important}
 @media(max-width:1000px){.mp-nav{position:static;width:auto;flex-direction:row;flex-wrap:wrap;border-radius:14px;margin-bottom:24px;padding:18px}.mp-nav strong{margin:0 18px 0 0;align-self:center}.mp-app{padding:20px!important}.mp-quantities{grid-template-columns:repeat(3,minmax(0,1fr))}}
 @media(max-width:600px){.marprint{padding:16px!important}.mp-grid,.mp-quantities{grid-template-columns:1fr!important}.mp-card{padding:18px}.mp-login-card{padding:26px}.mp-nav strong{width:100%}}
`}</style>
<nav className="mp-nav" aria-label="Navegación principal"><strong>Marprint</strong>{[["menu","Inicio"],["clientes","Clientes"],["cotizar","Cotizaciones"]].map(([id,label])=>(<button type="button" key={id} aria-current={pantalla===id ? "page" : undefined} onClick={()=>setPantalla(id)}>{label}</button>))}</nav>
<div className="mp-content">
      <h1>Cotizador Marprint</h1>
      <p>Usuario: {usuario.email}</p>

      <button onClick={() => setUsuario(null)}>Cerrar sesión</button>

      {pantalla === "menu" && (
        <div>
          <h2>Menú principal</h2>

          <div className="mp-menu">
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

          <form onSubmit={guardarCliente} className="mp-card mp-grid">
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
            <div className="mp-card mp-grid"><h3>01 · Información general<small>Selecciona el cliente y describe el producto.</small></h3>
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

</div><div className="mp-card mp-grid "><h3>02 · Especificaciones del producto<small>Dimensiones en centímetros (cm).</small></h3>
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

</div><div className="mp-card mp-grid mp-quantities"><h3>03 · Cantidades<small>Compara hasta cinco volúmenes de producción.</small></h3>
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

</div><div className="mp-card mp-grid "><h3>04 · Procesos de fabricación<small>Configura impresión, acabados y pegue.</small></h3>
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

</div><div className="mp-card mp-grid "><h3>05 · Costos adicionales<small>Selecciona el envío y los costos especiales por unidad.</small></h3>
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
              <div className="mp-card">
                <h3>06 · Montajes sugeridos</h3><p>Selecciona una alternativa. El montaje mínimo se identifica entre las opciones sugeridas.</p>

                <div className="mp-grid">
                  {opcionesMontaje.map((opcion, index) => (
                    <button
                      type="button"
                      className="mp-montage"
                      aria-pressed={montajeSeleccionado?.id === opcion.id}
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
{opcion.id === [...opcionesMontaje].sort((a,b)=>a.anchoHoja*a.largoHoja-b.anchoHoja*b.largoHoja)[0]?.id && <span className="mp-badge">Montaje mínimo</span>}
<span aria-label={opcion.columnas + ' columnas por ' + opcion.filas + ' filas'} className="mp-sheet" style={{gridTemplateColumns:'repeat('+opcion.columnas+',1fr)',aspectRatio:opcion.anchoHoja+'/'+opcion.largoHoja}}>{Array.from({length:opcion.piezasPorHoja},(_,i)=><span className="mp-piece" key={i}/>)}</span>
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
                    </button>
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
            <div className="mp-card">
              <h2>Resultado de cotización</h2>

              <div className="mp-table">
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
    </div></main>
  );
}

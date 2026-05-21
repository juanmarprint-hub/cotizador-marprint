import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usuario, setUsuario] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [pantalla, setPantalla] = useState("menu");

  const [catalogos, setCatalogos] = useState({
    clientes: [],
    lineas: [],
    materiales: [],
    plasticos: [],
    barnices: [],
    pegues: [],
    envios: [],
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
    pegue: "",
    envio: "",
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
      ] = await Promise.all([
        supabase.from("clientes").select("*").order("razon_social"),
        supabase.from("lineas").select("*").order("nombre"),
        supabase.from("materiales").select("*").order("material"),
        supabase.from("plasticos").select("*").order("ref"),
        supabase.from("barnices").select("*").order("ref"),
        supabase.from("pegues").select("*").order("ref"),
        supabase.from("envios").select("*").order("ref"),
      ]);

      setCatalogos({
        clientes: clientes.data || [],
        lineas: lineas.data || [],
        materiales: materiales.data || [],
        plasticos: plasticos.data || [],
        barnices: barnices.data || [],
        pegues: pegues.data || [],
        envios: envios.data || [],
      });
    }

    if (usuario) {
      cargarCatalogos();
    }
  }, [usuario]);

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

  function calcularCotizacion(e) {
    e.preventDefault();
    alert("Siguiente paso: aquí conectaremos el algoritmo de montaje y costos.");
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
    <main style={{ padding: 40, fontFamily: "Arial", maxWidth: 1100 }}>
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
                marginTop: 20,
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
                      {m.material} - Calibre {m.calibre} - ${m.valor_pap_m2}/m²
                    </option>
                  ))}
                </select>
              </div>

              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n}>
                  <label>CANTIDAD {n}{n === 1 ? " *" : ""}</label>
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
                      {p.ref} - ${p.valor_plas_m2}/m²
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
                      {p.ref} - ${p.valor_plas_m2}/m²
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
                      {b.ref} - ${b.valor_bar_m2}/m²
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
                      {b.ref} - ${b.valor_bar_m2}/m²
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
                      {p.ref} - ${p.valor_peg_und}/und
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
                      {e.ref} - ${e.valor_env_kg}/kg
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
        </div>
      )}
    </main>
  );
}

import { useState } from "react";
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
    }
  }

  function cambiar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
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

const [pantalla, setPantalla] = useState("menu");

  return (
    <main style={{ padding: 40, fontFamily: "Arial", maxWidth: 800 }}>
      <h1>Cotizador Marprint</h1>
      <p>Usuario: {usuario.email}</p>

      <button onClick={() => setUsuario(null)}>Cerrar sesión</button>

      {pantalla === "menu" && (
  <div>
    <h2>Menú principal</h2>

    <div style={{ display: "flex", gap: 20, marginTop: 20 }}>

      <button
        onClick={() => setPantalla("clientes")}
        style={{
          padding: 30,
          borderRadius: 12,
          border: "1px solid #ccc",
          cursor: "pointer",
          fontSize: 18
        }}
      >
{pantalla === "clientes" && (
        👤<br />
        Crear Cliente
      </button>

      <button
        onClick={() => setPantalla("cotizar")}
        style={{
          padding: 30,
          borderRadius: 12,
          border: "1px solid #ccc",
          cursor: "pointer",
          fontSize: 18
        }}
      >
        🧾<br />
        Cotizar
      </button>

    </div>
  </div>
)}
)}

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
    </main>
  );
}

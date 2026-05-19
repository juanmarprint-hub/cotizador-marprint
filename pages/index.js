import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
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

  const [mensaje, setMensaje] = useState("");

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

  return (
    <main style={{ padding: 40, fontFamily: "Arial", maxWidth: 800 }}>
      <h1>Cotizador Marprint</h1>
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
    </main>
  );
}

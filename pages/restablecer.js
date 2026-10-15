import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Restablecer() {
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [sesionRecuperacion, setSesionRecuperacion] = useState(false);

  useEffect(() => {
    let activo = true;

    async function verificarSesion() {
      const { data } = await supabase.auth.getSession();

      if (activo && data.session) {
        setSesionRecuperacion(true);
      }
    }

    verificarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        activo &&
        session &&
        (event === "PASSWORD_RECOVERY" ||
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION")
      ) {
        setSesionRecuperacion(true);
      }
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  async function cambiarPassword(e) {
    e.preventDefault();

    if (!sesionRecuperacion) {
      setMensaje(
        "No hay una sesión válida. Solicita un nuevo correo de recuperación."
      );
      return;
    }

    if (password.length < 8) {
      setMensaje("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmar) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    setMensaje("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMensaje("Error: " + error.message);
    } else {
      setMensaje("¡Contraseña actualizada correctamente!");
      setPassword("");
      setConfirmar("");
    }

    setCargando(false);
  }

  return (
    <main
      style={{
        fontFamily: "Arial",
        maxWidth: 420,
        margin: "100px auto",
        padding: 25,
      }}
    >
      <h1>Cotizador Marprint</h1>
      <h2>Restablecer contraseña</h2>

      {!sesionRecuperacion ? (
        <p>
          Verificando enlace de recuperación... Si no se habilita el
          formulario, solicita un nuevo enlace desde el cotizador.
        </p>
      ) : (
        <form onSubmit={cambiarPassword}>
          <label>Nueva contraseña</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{
              width: "100%",
              padding: 12,
              margin: "10px 0 20px",
              boxSizing: "border-box",
            }}
          />

          <label>Confirmar contraseña</label>

          <input
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
            minLength={8}
            style={{
              width: "100%",
              padding: 12,
              margin: "10px 0 20px",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            disabled={cargando}
            style={{ padding: 12, cursor: "pointer" }}
          >
            {cargando ? "Guardando..." : "Guardar nueva contraseña"}
          </button>
        </form>
      )}

      <p>{mensaje}</p>

      <a href="/">Volver al inicio de sesión</a>
    </main>
  );
}

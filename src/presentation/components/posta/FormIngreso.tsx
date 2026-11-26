"use client";

import { useActionState } from "react";
import { claseBoton, claseCampo, tx, type TextosPosta } from "./comunes";

export interface EstadoIngreso {
  error: boolean;
  /** Se devuelve para no borrar el correo tras un error (React vacía el formulario). */
  email: string;
}

/** Login del personal de salud. La acción (Auth.js) la inyecta app/. */
export function FormIngreso({
  t,
  accion,
}: {
  t: TextosPosta;
  accion: (estado: EstadoIngreso, datos: FormData) => Promise<EstadoIngreso>;
}) {
  const [estado, enviar, enviando] = useActionState(accion, { error: false, email: "" });
  return (
    <form action={enviar} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="font-bold">{tx(t, "correo")}</span>
        <input
          key={estado.email}
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={estado.email}
          className={claseCampo}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-bold">{tx(t, "contrasena")}</span>
        <input name="password" type="password" autoComplete="current-password" required className={claseCampo} />
      </label>
      {estado.error && (
        <p role="alert" className="rounded-lg bg-rojo-suave p-3 text-rojo">
          {tx(t, "errorIngreso")}
        </p>
      )}
      <button type="submit" aria-busy={enviando} className={claseBoton}>
        {tx(t, "ingresar")}
      </button>
    </form>
  );
}

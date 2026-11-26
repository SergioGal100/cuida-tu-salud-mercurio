"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/composition/server";
import type { EstadoIngreso } from "@/presentation/components/posta/FormIngreso";

export async function ingresar(_: EstadoIngreso, datos: FormData): Promise<EstadoIngreso> {
  const email = String(datos.get("email") ?? "").slice(0, 120);
  try {
    await signIn("credentials", {
      email,
      password: datos.get("password"),
      redirectTo: "/posta",
    });
    return { error: false, email };
  } catch (e) {
    if (e instanceof AuthError) return { error: true, email };
    throw e; // la redirección de Next se propaga
  }
}

export async function salir() {
  await signOut({ redirectTo: "/posta/ingresar" });
}

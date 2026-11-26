import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "../prisma/cliente";

export type RolPersonal = "MEDICO" | "EPIDEMIOLOGO" | "ADMIN";

/** Lo que la app sabe del personal con sesión. Sin nombre: solo correo, rol y establecimiento. */
export interface PersonalSesion {
  usuarioId: string;
  email: string;
  rol: RolPersonal;
  establecimientoId: string | null;
}

// Hash real de una contraseña imposible: se compara aunque el correo no exista.
const HASH_FALSO = bcrypt.hashSync("no-existe-este-usuario", 10);

const credenciales = z.object({ email: z.email().max(120), password: z.string().min(1).max(200) });

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // un turno
  pages: { signIn: "/posta/ingresar" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(datos) {
        const r = credenciales.safeParse(datos);
        if (!r.success) throw new CredentialsSignin();
        const u = await prisma.usuario.findUnique({ where: { email: r.data.email.toLowerCase() } });
        // Se compara siempre (aun sin usuario) para no revelar qué correos existen por el tiempo de respuesta.
        const ok = await bcrypt.compare(r.data.password, u?.passwordHash ?? HASH_FALSO);
        if (!u || !u.activo || !ok) throw new CredentialsSignin();
        return { id: u.id, email: u.email, rol: u.rol, establecimientoId: u.establecimientoId };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; rol: RolPersonal; establecimientoId: string | null };
        token.uid = u.id;
        token.rol = u.rol;
        token.establecimientoId = u.establecimientoId;
      }
      return token;
    },
    session({ session, token }) {
      Object.assign(session.user, {
        id: token.uid,
        rol: token.rol,
        establecimientoId: token.establecimientoId,
      });
      return session;
    },
  },
});

/** Sesión actual del personal de salud, o null. */
export async function personalActual(): Promise<PersonalSesion | null> {
  const s = await auth();
  const u = s?.user as { id?: string; email?: string; rol?: RolPersonal; establecimientoId?: string | null } | undefined;
  if (!u?.id || !u.rol || !u.email) return null;
  return { usuarioId: u.id, email: u.email, rol: u.rol, establecimientoId: u.establecimientoId ?? null };
}

/** Atención clínica: requiere rol MEDICO o ADMIN y un establecimiento. */
export async function atencionActual(): Promise<{ usuarioId: string; establecimientoId: string } | null> {
  const p = await personalActual();
  if (!p || !p.establecimientoId || (p.rol !== "MEDICO" && p.rol !== "ADMIN")) return null;
  return { usuarioId: p.usuarioId, establecimientoId: p.establecimientoId };
}

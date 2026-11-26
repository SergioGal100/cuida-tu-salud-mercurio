import Link from "next/link";
import { contentPack } from "@/composition/contenido";
import { Ilustracion } from "@/presentation/components/ui/Ilustracion";

export const dynamic = "force-static";

export default function SinConexion() {
  const { app, ui } = contentPack;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div className="tarjeta hero flex flex-col items-center gap-4 p-6 text-center">
        <Ilustracion id="sin-conexion" className="size-36" />
        <h1 className="text-2xl font-bold">{ui.sinConexionTitulo}</h1>
        <p>{ui.sinConexionMensaje}</p>
      </div>
      <Link href="/test" className="boton-principal">
        {app.botonTest}
      </Link>
    </main>
  );
}

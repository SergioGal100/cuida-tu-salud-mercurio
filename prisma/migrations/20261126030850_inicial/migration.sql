-- CreateEnum
CREATE TYPE "Origen" AS ENUM ('AUTO', 'PROMOTOR', 'POSTA');

-- CreateEnum
CREATE TYPE "Nivel" AS ENUM ('VERDE', 'AMARILLO', 'ROJO');

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('MEDICO', 'EPIDEMIOLOGO', 'ADMIN');

-- CreateEnum
CREATE TYPE "EstadoConsulta" AS ENUM ('ABIERTA', 'ESPERA_LABORATORIO', 'CERRADA');

-- CreateEnum
CREATE TYPE "Muestra" AS ENUM ('ORINA', 'SANGRE', 'CABELLO');

-- CreateEnum
CREATE TYPE "EstadoAlerta" AS ENUM ('ABIERTA', 'VISTA', 'CERRADA');

-- CreateTable
CREATE TABLE "municipio" (
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "lat_centro" DOUBLE PRECISION NOT NULL,
    "lon_centro" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "municipio_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "establecimiento" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "municipio_codigo" TEXT NOT NULL,
    "nivel_atencion" TEXT NOT NULL,

    CONSTRAINT "establecimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "establecimiento_id" UUID,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluacion" (
    "id" UUID NOT NULL,
    "origen" "Origen" NOT NULL,
    "creada_en_dispositivo" TIMESTAMPTZ NOT NULL,
    "recibida_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "municipio_codigo" TEXT,
    "rango_edad" TEXT,
    "sexo" TEXT,
    "embarazo_lactancia" TEXT,
    "ninos_en_casa" TEXT,
    "respuestas" JSONB NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "nivel" "Nivel" NOT NULL,
    "urgente" BOOLEAN NOT NULL,
    "reglas" JSONB NOT NULL,
    "resultado" JSONB NOT NULL,
    "version_pack" TEXT NOT NULL,
    "discrepancia" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulta" (
    "id" UUID NOT NULL,
    "evaluacion_id" UUID NOT NULL,
    "establecimiento_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "fecha" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examen" JSONB NOT NULL DEFAULT '{}',
    "conducta" TEXT,
    "nivel_final" "Nivel" NOT NULL,
    "estado" "EstadoConsulta" NOT NULL DEFAULT 'ABIERTA',

    CONSTRAINT "consulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultado_laboratorio" (
    "id" UUID NOT NULL,
    "consulta_id" UUID NOT NULL,
    "muestra" "Muestra" NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,
    "fecha_toma" DATE NOT NULL,
    "laboratorio" TEXT,
    "nivel" "Nivel",
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resultado_laboratorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerta" (
    "id" UUID NOT NULL,
    "municipio_codigo" TEXT NOT NULL,
    "regla" TEXT NOT NULL,
    "desde" TIMESTAMPTZ NOT NULL,
    "hasta" TIMESTAMPTZ NOT NULL,
    "conteo" INTEGER NOT NULL,
    "estado" "EstadoAlerta" NOT NULL DEFAULT 'ABIERTA',
    "creada_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "evaluacion_municipio_codigo_nivel_idx" ON "evaluacion"("municipio_codigo", "nivel");

-- CreateIndex
CREATE INDEX "evaluacion_creada_en_dispositivo_idx" ON "evaluacion"("creada_en_dispositivo");

-- CreateIndex
CREATE INDEX "evaluacion_origen_idx" ON "evaluacion"("origen");

-- CreateIndex
CREATE UNIQUE INDEX "consulta_evaluacion_id_key" ON "consulta"("evaluacion_id");

-- CreateIndex
CREATE INDEX "consulta_establecimiento_id_estado_idx" ON "consulta"("establecimiento_id", "estado");

-- CreateIndex
CREATE INDEX "alerta_estado_idx" ON "alerta"("estado");

-- AddForeignKey
ALTER TABLE "establecimiento" ADD CONSTRAINT "establecimiento_municipio_codigo_fkey" FOREIGN KEY ("municipio_codigo") REFERENCES "municipio"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_establecimiento_id_fkey" FOREIGN KEY ("establecimiento_id") REFERENCES "establecimiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion" ADD CONSTRAINT "evaluacion_municipio_codigo_fkey" FOREIGN KEY ("municipio_codigo") REFERENCES "municipio"("codigo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_evaluacion_id_fkey" FOREIGN KEY ("evaluacion_id") REFERENCES "evaluacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_establecimiento_id_fkey" FOREIGN KEY ("establecimiento_id") REFERENCES "establecimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultado_laboratorio" ADD CONSTRAINT "resultado_laboratorio_consulta_id_fkey" FOREIGN KEY ("consulta_id") REFERENCES "consulta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_municipio_codigo_fkey" FOREIGN KEY ("municipio_codigo") REFERENCES "municipio"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT,
    "bairro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obras" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "fingerprint" TEXT,
    "tipo" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "endereco" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANEJADA',
    "dataInicio" TIMESTAMP(3),
    "dataFimPrevista" TIMESTAMP(3),
    "dataFimReal" TIMESTAMP(3),
    "percentualProgresso" INTEGER NOT NULL DEFAULT 0,
    "orcamentoEstimado" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atualizacoes_obra" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "novoStatus" TEXT,
    "novoPercentual" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atualizacoes_obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "denuncias" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "imagemUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "denuncias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cpf_key" ON "usuarios"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "obras_fingerprint_key" ON "obras"("fingerprint");

-- CreateIndex
CREATE INDEX "obras_latitude_longitude_idx" ON "obras"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "obras_bairro_idx" ON "obras"("bairro");

-- CreateIndex
CREATE INDEX "obras_status_idx" ON "obras"("status");

-- CreateIndex
CREATE INDEX "obras_fingerprint_idx" ON "obras"("fingerprint");

-- CreateIndex
CREATE INDEX "atualizacoes_obra_obraId_idx" ON "atualizacoes_obra"("obraId");

-- CreateIndex
CREATE INDEX "atualizacoes_obra_createdAt_idx" ON "atualizacoes_obra"("createdAt");

-- CreateIndex
CREATE INDEX "denuncias_obraId_idx" ON "denuncias"("obraId");

-- CreateIndex
CREATE INDEX "denuncias_usuarioId_idx" ON "denuncias"("usuarioId");

-- CreateIndex
CREATE INDEX "denuncias_status_idx" ON "denuncias"("status");

-- CreateIndex
CREATE INDEX "comentarios_obraId_idx" ON "comentarios"("obraId");

-- CreateIndex
CREATE INDEX "comentarios_usuarioId_idx" ON "comentarios"("usuarioId");

-- CreateIndex
CREATE INDEX "avaliacoes_obraId_idx" ON "avaliacoes"("obraId");

-- CreateIndex
CREATE INDEX "avaliacoes_usuarioId_idx" ON "avaliacoes"("usuarioId");

-- AddForeignKey
ALTER TABLE "atualizacoes_obra" ADD CONSTRAINT "atualizacoes_obra_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "obras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "obras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "obras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "obras"("id") ON DELETE CASCADE ON UPDATE CASCADE;


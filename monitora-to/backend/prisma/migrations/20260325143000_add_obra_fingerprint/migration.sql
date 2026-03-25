ALTER TABLE "obras"
ADD COLUMN "fingerprint" TEXT;

CREATE UNIQUE INDEX "obras_fingerprint_key" ON "obras"("fingerprint");
CREATE INDEX "obras_fingerprint_idx" ON "obras"("fingerprint");

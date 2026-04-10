-- AlterEnum: Adicionar DUE_IN_5_DAYS ao NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'DUE_IN_5_DAYS';

-- AlterTable: Adicionar asaas_customer_id nos clientes
ALTER TABLE "customers" ADD COLUMN "asaas_customer_id" TEXT;

-- AlterTable: Adicionar campos Asaas nas cobranças
ALTER TABLE "receivables" ADD COLUMN "asaas_id" TEXT;
ALTER TABLE "receivables" ADD COLUMN "payment_link" TEXT;
ALTER TABLE "receivables" ADD COLUMN "boleto_url" TEXT;
ALTER TABLE "receivables" ADD COLUMN "pix_qr_code" TEXT;
ALTER TABLE "receivables" ADD COLUMN "pix_copia_e_cola" TEXT;

-- CreateIndex: asaas_id único
CREATE UNIQUE INDEX "receivables_asaas_id_key" ON "receivables"("asaas_id");

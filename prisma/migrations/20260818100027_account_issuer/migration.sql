-- AlterTable
ALTER TABLE "account" ADD COLUMN     "issuer" TEXT NOT NULL DEFAULT 'local:credential';

-- CreateIndex
CREATE INDEX "account_issuer_accountId_idx" ON "account"("issuer", "accountId");

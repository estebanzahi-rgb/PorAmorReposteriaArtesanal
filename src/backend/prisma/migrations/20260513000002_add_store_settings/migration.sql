-- HU-05: Add store_settings table for lead time configuration
CREATE TABLE "store_settings" (
    "id"            TEXT NOT NULL DEFAULT 'singleton',
    "leadTimeHours" INTEGER NOT NULL DEFAULT 24,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    "updatedBy"     TEXT NOT NULL,
    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- Insertar fila inicial para que GET siempre devuelva un valor
INSERT INTO "store_settings" ("id", "leadTimeHours", "updatedAt", "updatedBy")
VALUES ('singleton', 24, NOW(), 'system');

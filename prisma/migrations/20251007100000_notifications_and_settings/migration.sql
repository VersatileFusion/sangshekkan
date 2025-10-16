-- CreateTable Notification (if not exists semantics left to prisma migrate)
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey"
  FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable AppSetting
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- Seed default FAMILY_CHAT_ENABLED if not present
INSERT INTO "AppSetting" ("key", "value")
SELECT 'FAMILY_CHAT_ENABLED', 'true'
WHERE NOT EXISTS (SELECT 1 FROM "AppSetting" WHERE "key" = 'FAMILY_CHAT_ENABLED');




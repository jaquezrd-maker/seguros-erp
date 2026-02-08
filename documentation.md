# SeguroPro — Sistema ERP/CRM para Corredora de Seguros
## Documentación Técnica Completa

---

## 1. PROPUESTA DE TECNOLOGÍAS Y JUSTIFICACIÓN

### Stack Seleccionado

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Frontend** | React 18 + Vite | Ecosistema maduro, componentes reutilizables, rendimiento óptimo con Virtual DOM |
| **UI Framework** | Tailwind CSS | Utility-first permite prototipado rápido y diseño consistente sin overhead de CSS personalizado |
| **Backend** | Node.js + Express | Mismo lenguaje que frontend (JS/TS), excelente para I/O asíncrono, amplio ecosistema de NPM |
| **ORM** | Prisma | Type-safety, migraciones automáticas, generación de cliente tipado |
| **Base de Datos** | PostgreSQL 16 | ACID compliant, soporte JSON nativo, extensiones PostGIS para geolocalización, escalabilidad horizontal |
| **Autenticación** | JWT + bcrypt | Stateless, escalable horizontalmente, tokens refresh para seguridad |
| **Almacenamiento** | AWS S3 / MinIO | Documentos y PDFs con acceso controlado por URLs firmadas |
| **Cola de Mensajes** | Bull + Redis | Procesamiento de notificaciones WhatsApp/Email en background |
| **Email** | Nodemailer + SendGrid | Fiabilidad en envío de recordatorios y notificaciones |
| **WhatsApp** | Meta Business API | Integración oficial para recordatorios de renovación |
| **Reportes** | PDFKit + ExcelJS | Generación server-side de reportes exportables |
| **Cache** | Redis | Sesiones, caché de consultas frecuentes, rate limiting |
| **Monitoreo** | Winston + Sentry | Logs estructurados y tracking de errores en producción |

### ¿Por qué Node.js sobre Laravel o Django?

1. **Unificación del lenguaje**: TypeScript en frontend y backend reduce fricción
2. **Rendimiento I/O**: Arquitectura event-driven ideal para muchas conexiones concurrentes
3. **Ecosistema NPM**: Bibliotecas maduras para PDF, Excel, WhatsApp API
4. **Talento local RD**: Mayor disponibilidad de desarrolladores JavaScript en el mercado dominicano
5. **Real-time**: Socket.io nativo para notificaciones en tiempo real

---

## 2. DIAGRAMA DE BASE DE DATOS (ERD)

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│      clients        │     │      policies         │     │     insurers        │
├─────────────────────┤     ├──────────────────────┤     ├─────────────────────┤
│ id (PK)             │────<│ id (PK)              │>────│ id (PK)             │
│ type (enum)         │     │ policy_number (UQ)   │     │ name                │
│ name                │     │ client_id (FK)       │     │ rnc (UQ)            │
│ cedula_rnc (UQ)     │     │ insurer_id (FK)      │     │ legal_name          │
│ phone               │     │ insurance_type_id(FK)│     │ phone               │
│ phone_alt           │     │ start_date           │     │ email               │
│ email               │     │ end_date             │     │ contact_person      │
│ address             │     │ premium              │     │ address             │
│ city                │     │ payment_method (enum)│     │ status (enum)       │
│ province            │     │ status (enum)        │     │ created_at          │
│ status (enum)       │     │ auto_renew           │     │ updated_at          │
│ notes               │     │ notes                │     └─────────────────────┘
│ created_by (FK)     │     │ created_by (FK)      │              │
│ created_at          │     │ created_at           │              │
│ updated_at          │     │ updated_at           │     ┌────────┴────────────┐
└─────────────────────┘     └──────────────────────┘     │ insurer_branches    │
         │                           │                   ├─────────────────────┤
         │                           │                   │ id (PK)             │
┌────────┴────────────┐     ┌────────┴───────────┐      │ insurer_id (FK)     │
│  client_contacts    │     │   endorsements     │      │ name                │
├─────────────────────┤     ├────────────────────┤      │ tipo (enum)         │
│ id (PK)             │     │ id (PK)            │      │ ramos               │
│ client_id (FK)      │     │ policy_id (FK)     │      └─────────────────────┘
│ name                │     │ type               │
│ role                │     │ description        │      ┌─────────────────────┐
│ phone               │     │ effective_date     │      │  insurance_types    │
│ email               │     │ premium_change     │      ├─────────────────────┤
└─────────────────────┘     │ document_url       │      │ id (PK)             │
                            │ created_at         │      │ name                │
┌─────────────────────┐     └────────────────────┘      │ category            │
│      claims         │                                  │ description         │
├─────────────────────┤     ┌────────────────────┐      └─────────────────────┘
│ id (PK)             │     │    payments        │
│ policy_id (FK)      │     ├────────────────────┤      ┌─────────────────────┐
│ claim_number (UQ)   │     │ id (PK)            │      │   commission_rules  │
│ type                │     │ policy_id (FK)     │      ├─────────────────────┤
│ date_occurred       │     │ client_id (FK)     │      │ id (PK)             │
│ date_reported       │     │ amount             │      │ insurer_id (FK)     │
│ description         │     │ payment_method     │      │ insurance_type_id   │
│ estimated_amount    │     │ payment_date       │      │ rate_percentage     │
│ approved_amount     │     │ due_date           │      │ min_premium         │
│ status (enum)       │     │ receipt_number     │      │ effective_from      │
│ priority (enum)     │     │ status (enum)      │      │ effective_to        │
│ assigned_to (FK)    │     │ notes              │      └─────────────────────┘
│ created_at          │     │ created_by (FK)    │
│ updated_at          │     │ created_at         │      ┌─────────────────────┐
└─────────────────────┘     └────────────────────┘      │    commissions      │
         │                                               ├─────────────────────┤
┌────────┴────────────┐     ┌────────────────────┐      │ id (PK)             │
│   claim_notes       │     │    documents       │      │ policy_id (FK)      │
├─────────────────────┤     ├────────────────────┤      │ producer_id (FK)    │
│ id (PK)             │     │ id (PK)            │      │ rule_id (FK)        │
│ claim_id (FK)       │     │ entity_type        │      │ premium_amount      │
│ user_id (FK)        │     │ entity_id          │      │ rate                │
│ note                │     │ name               │      │ amount              │
│ is_internal         │     │ file_path          │      │ period              │
│ created_at          │     │ file_size           │      │ status (enum)       │
└─────────────────────┘     │ mime_type          │      │ paid_date           │
                            │ category           │      │ created_at          │
┌─────────────────────┐     │ version            │      └─────────────────────┘
│       users         │     │ uploaded_by (FK)   │
├─────────────────────┤     │ created_at         │      ┌─────────────────────┐
│ id (PK)             │     └────────────────────┘      │   notifications     │
│ name                │                                  ├─────────────────────┤
│ email (UQ)          │     ┌────────────────────┐      │ id (PK)             │
│ password_hash       │     │   audit_logs       │      │ policy_id (FK)      │
│ role (enum)         │     ├────────────────────┤      │ type (enum)         │
│ phone               │     │ id (PK)            │      │ channel (enum)      │
│ status (enum)       │     │ user_id (FK)       │      │ recipient           │
│ last_login          │     │ action             │      │ message             │
│ created_at          │     │ entity_type        │      │ status (enum)       │
│ updated_at          │     │ entity_id          │      │ sent_at             │
└─────────────────────┘     │ old_values (JSON)  │      │ created_at          │
                            │ new_values (JSON)  │      └─────────────────────┘
                            │ ip_address         │
                            │ user_agent         │      ┌─────────────────────┐
                            │ created_at         │      │    renewals         │
                            └────────────────────┘      ├─────────────────────┤
                                                        │ id (PK)             │
                                                        │ policy_id (FK)      │
                                                        │ original_end_date   │
                                                        │ new_end_date        │
                                                        │ new_premium         │
                                                        │ status (enum)       │
                                                        │ processed_by (FK)   │
                                                        │ created_at          │
                                                        └─────────────────────┘
```

---

## 3. MODELOS DE BASE DE DATOS (Prisma Schema)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ===================== ENUMS =====================

enum ClientType {
  FISICA
  JURIDICA
}

enum ClientStatus {
  ACTIVO
  SUSPENDIDO
  CANCELADO
}

enum InsurerStatus {
  ACTIVA
  INACTIVA
}

enum PolicyStatus {
  VIGENTE
  VENCIDA
  CANCELADA
  EN_RENOVACION
}

enum PaymentMethod {
  MENSUAL
  TRIMESTRAL
  SEMESTRAL
  ANUAL
}

enum PaymentStatus {
  PENDIENTE
  COMPLETADO
  ANULADO
  VENCIDO
}

enum ClaimStatus {
  PENDIENTE
  EN_PROCESO
  EN_REVISION
  APROBADO
  RECHAZADO
  PAGADO
}

enum ClaimPriority {
  BAJA
  MEDIA
  ALTA
  CRITICA
}

enum CommissionStatus {
  PENDIENTE
  PAGADA
  ANULADA
}

enum UserRole {
  ADMINISTRADOR
  EJECUTIVO
  CONTABILIDAD
  SOLO_LECTURA
}

enum UserStatus {
  ACTIVO
  INACTIVO
  BLOQUEADO
}

enum NotificationChannel {
  EMAIL
  WHATSAPP
  SMS
  SISTEMA
}

enum NotificationStatus {
  PENDIENTE
  ENVIADA
  FALLIDA
  LEIDA
}

enum RenewalStatus {
  PENDIENTE
  PROCESADA
  RECHAZADA
  VENCIDA
}

// ===================== MODELS =====================

model Client {
  id          Int           @id @default(autoincrement())
  type        ClientType
  name        String        @db.VarChar(200)
  cedulaRnc   String        @unique @map("cedula_rnc") @db.VarChar(20)
  phone       String?       @db.VarChar(20)
  phoneAlt    String?       @map("phone_alt") @db.VarChar(20)
  email       String?       @db.VarChar(150)
  address     String?       @db.Text
  city        String?       @db.VarChar(100)
  province    String?       @db.VarChar(100)
  status      ClientStatus  @default(ACTIVO)
  notes       String?       @db.Text
  createdBy   Int?          @map("created_by")
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  creator     User?         @relation("ClientCreator", fields: [createdBy], references: [id])
  policies    Policy[]
  payments    Payment[]
  contacts    ClientContact[]
  documents   Document[]    @relation("ClientDocuments")

  @@map("clients")
  @@index([status])
  @@index([cedulaRnc])
  @@index([name])
}

model ClientContact {
  id        Int     @id @default(autoincrement())
  clientId  Int     @map("client_id")
  name      String  @db.VarChar(150)
  role      String? @db.VarChar(100)
  phone     String? @db.VarChar(20)
  email     String? @db.VarChar(150)

  client    Client  @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@map("client_contacts")
}

model Insurer {
  id            Int            @id @default(autoincrement())
  name          String         @db.VarChar(200)
  rnc           String         @unique @db.VarChar(20)
  legalName     String?        @map("legal_name") @db.VarChar(200)
  phone         String?        @db.VarChar(20)
  email         String?        @db.VarChar(150)
  contactPerson String?        @map("contact_person") @db.VarChar(150)
  address       String?        @db.Text
  status        InsurerStatus  @default(ACTIVA)
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")

  policies        Policy[]
  branches        InsurerBranch[]
  commissionRules CommissionRule[]

  @@map("insurers")
}

model InsurerBranch {
  id        Int    @id @default(autoincrement())
  insurerId Int    @map("insurer_id")
  name      String @db.VarChar(150)
  ramos     String[] @db.VarChar(100)

  insurer   Insurer @relation(fields: [insurerId], references: [id], onDelete: Cascade)

  @@map("insurer_branches")
}

model InsuranceType {
  id          Int     @id @default(autoincrement())
  name        String  @unique @db.VarChar(100)
  category    String? @db.VarChar(100)
  description String? @db.Text

  policies        Policy[]
  commissionRules CommissionRule[]

  @@map("insurance_types")
}

model Policy {
  id              Int            @id @default(autoincrement())
  policyNumber    String         @unique @map("policy_number") @db.VarChar(30)
  clientId        Int            @map("client_id")
  insurerId       Int            @map("insurer_id")
  insuranceTypeId Int            @map("insurance_type_id")
  startDate       DateTime       @map("start_date") @db.Date
  endDate         DateTime       @map("end_date") @db.Date
  premium         Decimal        @db.Decimal(12, 2)
  paymentMethod   PaymentMethod  @map("payment_method")
  status          PolicyStatus   @default(VIGENTE)
  autoRenew       Boolean        @default(false) @map("auto_renew")
  notes           String?        @db.Text
  createdBy       Int?           @map("created_by")
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  client        Client         @relation(fields: [clientId], references: [id])
  insurer       Insurer        @relation(fields: [insurerId], references: [id])
  insuranceType InsuranceType  @relation(fields: [insuranceTypeId], references: [id])
  creator       User?          @relation("PolicyCreator", fields: [createdBy], references: [id])
  endorsements  Endorsement[]
  claims        Claim[]
  payments      Payment[]
  commissions   Commission[]
  renewals      Renewal[]
  notifications Notification[]
  documents     Document[]     @relation("PolicyDocuments")

  @@map("policies")
  @@index([clientId])
  @@index([insurerId])
  @@index([status])
  @@index([endDate])
}

model Endorsement {
  id            Int      @id @default(autoincrement())
  policyId      Int      @map("policy_id")
  type          String   @db.VarChar(100)
  description   String?  @db.Text
  effectiveDate DateTime @map("effective_date") @db.Date
  premiumChange Decimal? @map("premium_change") @db.Decimal(12, 2)
  documentUrl   String?  @map("document_url")
  createdAt     DateTime @default(now()) @map("created_at")

  policy Policy @relation(fields: [policyId], references: [id], onDelete: Cascade)

  @@map("endorsements")
}

model Claim {
  id              Int           @id @default(autoincrement())
  policyId        Int           @map("policy_id")
  claimNumber     String        @unique @map("claim_number") @db.VarChar(30)
  type            String        @db.VarChar(100)
  dateOccurred    DateTime      @map("date_occurred") @db.Date
  dateReported    DateTime      @default(now()) @map("date_reported")
  description     String?       @db.Text
  estimatedAmount Decimal?      @map("estimated_amount") @db.Decimal(12, 2)
  approvedAmount  Decimal?      @map("approved_amount") @db.Decimal(12, 2)
  status          ClaimStatus   @default(PENDIENTE)
  priority        ClaimPriority @default(MEDIA)
  assignedTo      Int?          @map("assigned_to")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  policy    Policy      @relation(fields: [policyId], references: [id])
  assignee  User?       @relation("ClaimAssignee", fields: [assignedTo], references: [id])
  notes     ClaimNote[]
  documents Document[]  @relation("ClaimDocuments")

  @@map("claims")
  @@index([policyId])
  @@index([status])
}

model ClaimNote {
  id         Int      @id @default(autoincrement())
  claimId    Int      @map("claim_id")
  userId     Int      @map("user_id")
  note       String   @db.Text
  isInternal Boolean  @default(true) @map("is_internal")
  createdAt  DateTime @default(now()) @map("created_at")

  claim Claim @relation(fields: [claimId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id])

  @@map("claim_notes")
}

model Payment {
  id            Int           @id @default(autoincrement())
  policyId      Int           @map("policy_id")
  clientId      Int           @map("client_id")
  amount        Decimal       @db.Decimal(12, 2)
  paymentMethod String        @map("payment_method") @db.VarChar(50)
  paymentDate   DateTime      @map("payment_date") @db.Date
  dueDate       DateTime?     @map("due_date") @db.Date
  receiptNumber String?       @map("receipt_number") @db.VarChar(50)
  status        PaymentStatus @default(PENDIENTE)
  notes         String?       @db.Text
  createdBy     Int?          @map("created_by")
  createdAt     DateTime      @default(now()) @map("created_at")

  policy  Policy @relation(fields: [policyId], references: [id])
  client  Client @relation(fields: [clientId], references: [id])
  creator User?  @relation("PaymentCreator", fields: [createdBy], references: [id])

  @@map("payments")
  @@index([clientId])
  @@index([policyId])
  @@index([status])
}

model CommissionRule {
  id              Int      @id @default(autoincrement())
  insurerId       Int      @map("insurer_id")
  insuranceTypeId Int?     @map("insurance_type_id")
  ratePercentage  Decimal  @map("rate_percentage") @db.Decimal(5, 2)
  minPremium      Decimal? @map("min_premium") @db.Decimal(12, 2)
  effectiveFrom   DateTime @map("effective_from") @db.Date
  effectiveTo     DateTime? @map("effective_to") @db.Date

  insurer       Insurer        @relation(fields: [insurerId], references: [id])
  insuranceType InsuranceType? @relation(fields: [insuranceTypeId], references: [id])
  commissions   Commission[]

  @@map("commission_rules")
}

model Commission {
  id            Int              @id @default(autoincrement())
  policyId      Int              @map("policy_id")
  producerId    Int              @map("producer_id")
  ruleId        Int?             @map("rule_id")
  premiumAmount Decimal          @map("premium_amount") @db.Decimal(12, 2)
  rate          Decimal          @db.Decimal(5, 2)
  amount        Decimal          @db.Decimal(12, 2)
  period        String           @db.VarChar(20)
  status        CommissionStatus @default(PENDIENTE)
  paidDate      DateTime?        @map("paid_date") @db.Date
  createdAt     DateTime         @default(now()) @map("created_at")

  policy   Policy          @relation(fields: [policyId], references: [id])
  producer User            @relation("ProducerCommissions", fields: [producerId], references: [id])
  rule     CommissionRule? @relation(fields: [ruleId], references: [id])

  @@map("commissions")
  @@index([producerId])
  @@index([policyId])
  @@index([status])
}

model Renewal {
  id              Int           @id @default(autoincrement())
  policyId        Int           @map("policy_id")
  originalEndDate DateTime      @map("original_end_date") @db.Date
  newEndDate      DateTime?     @map("new_end_date") @db.Date
  newPremium      Decimal?      @map("new_premium") @db.Decimal(12, 2)
  status          RenewalStatus @default(PENDIENTE)
  processedBy     Int?          @map("processed_by")
  createdAt       DateTime      @default(now()) @map("created_at")

  policy    Policy @relation(fields: [policyId], references: [id])
  processor User?  @relation("RenewalProcessor", fields: [processedBy], references: [id])

  @@map("renewals")
  @@index([status])
}

model User {
  id           Int        @id @default(autoincrement())
  name         String     @db.VarChar(150)
  email        String     @unique @db.VarChar(150)
  passwordHash String     @map("password_hash")
  role         UserRole   @default(EJECUTIVO)
  phone        String?    @db.VarChar(20)
  status       UserStatus @default(ACTIVO)
  lastLogin    DateTime?  @map("last_login")
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")

  createdClients  Client[]       @relation("ClientCreator")
  createdPolicies Policy[]       @relation("PolicyCreator")
  createdPayments Payment[]      @relation("PaymentCreator")
  assignedClaims  Claim[]        @relation("ClaimAssignee")
  claimNotes      ClaimNote[]
  commissions     Commission[]   @relation("ProducerCommissions")
  renewals        Renewal[]      @relation("RenewalProcessor")
  auditLogs       AuditLog[]
  documents       Document[]

  @@map("users")
}

model Document {
  id         Int      @id @default(autoincrement())
  entityType String   @map("entity_type") @db.VarChar(50)
  entityId   Int      @map("entity_id")
  name       String   @db.VarChar(255)
  filePath   String   @map("file_path")
  fileSize   Int?     @map("file_size")
  mimeType   String?  @map("mime_type") @db.VarChar(100)
  category   String?  @db.VarChar(100)
  version    Int      @default(1)
  uploadedBy Int      @map("uploaded_by")
  createdAt  DateTime @default(now()) @map("created_at")

  uploader User     @relation(fields: [uploadedBy], references: [id])
  client   Client?  @relation("ClientDocuments", fields: [entityId], references: [id], map: "fk_doc_client")
  policy   Policy?  @relation("PolicyDocuments", fields: [entityId], references: [id], map: "fk_doc_policy")
  claim    Claim?   @relation("ClaimDocuments", fields: [entityId], references: [id], map: "fk_doc_claim")

  @@map("documents")
  @@index([entityType, entityId])
}

model Notification {
  id        Int                @id @default(autoincrement())
  policyId  Int?               @map("policy_id")
  type      String             @db.VarChar(50)
  channel   NotificationChannel
  recipient String             @db.VarChar(200)
  message   String             @db.Text
  status    NotificationStatus @default(PENDIENTE)
  sentAt    DateTime?          @map("sent_at")
  createdAt DateTime           @default(now()) @map("created_at")

  policy Policy? @relation(fields: [policyId], references: [id])

  @@map("notifications")
  @@index([status])
}

model AuditLog {
  id         Int      @id @default(autoincrement())
  userId     Int      @map("user_id")
  action     String   @db.VarChar(50)
  entityType String   @map("entity_type") @db.VarChar(50)
  entityId   Int      @map("entity_id")
  oldValues  Json?    @map("old_values")
  newValues  Json?    @map("new_values")
  ipAddress  String?  @map("ip_address") @db.VarChar(45)
  userAgent  String?  @map("user_agent") @db.Text
  createdAt  DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@map("audit_logs")
  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
}
```

---

## 4. ESTRUCTURA DE CARPETAS DEL PROYECTO

```
seguros-pro/
├── docker-compose.yml
├── .env.example
├── README.md
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   │
│   └── src/
│       ├── index.ts                    # Entry point
│       ├── app.ts                      # Express app config
│       │
│       ├── config/
│       │   ├── database.ts
│       │   ├── redis.ts
│       │   ├── s3.ts
│       │   ├── email.ts
│       │   └── whatsapp.ts
│       │
│       ├── middleware/
│       │   ├── auth.middleware.ts       # JWT verification
│       │   ├── rbac.middleware.ts       # Role-based access
│       │   ├── audit.middleware.ts      # Audit logging
│       │   ├── validation.middleware.ts # Request validation
│       │   ├── rateLimit.middleware.ts
│       │   └── errorHandler.middleware.ts
│       │
│       ├── modules/
│       │   ├── auth/
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── auth.routes.ts
│       │   │   └── auth.validation.ts
│       │   │
│       │   ├── clients/
│       │   │   ├── clients.controller.ts
│       │   │   ├── clients.service.ts
│       │   │   ├── clients.routes.ts
│       │   │   └── clients.validation.ts
│       │   │
│       │   ├── insurers/
│       │   │   ├── insurers.controller.ts
│       │   │   ├── insurers.service.ts
│       │   │   ├── insurers.routes.ts
│       │   │   └── insurers.validation.ts
│       │   │
│       │   ├── policies/
│       │   │   ├── policies.controller.ts
│       │   │   ├── policies.service.ts
│       │   │   ├── policies.routes.ts
│       │   │   └── policies.validation.ts
│       │   │
│       │   ├── claims/
│       │   │   ├── claims.controller.ts
│       │   │   ├── claims.service.ts
│       │   │   ├── claims.routes.ts
│       │   │   └── claims.validation.ts
│       │   │
│       │   ├── payments/
│       │   │   ├── payments.controller.ts
│       │   │   ├── payments.service.ts
│       │   │   ├── payments.routes.ts
│       │   │   └── payments.validation.ts
│       │   │
│       │   ├── commissions/
│       │   │   ├── commissions.controller.ts
│       │   │   ├── commissions.service.ts
│       │   │   ├── commissions.routes.ts
│       │   │   └── commissions.validation.ts
│       │   │
│       │   ├── renewals/
│       │   │   ├── renewals.controller.ts
│       │   │   ├── renewals.service.ts
│       │   │   ├── renewals.routes.ts
│       │   │   └── renewals.validation.ts
│       │   │
│       │   ├── documents/
│       │   │   ├── documents.controller.ts
│       │   │   ├── documents.service.ts
│       │   │   ├── documents.routes.ts
│       │   │   └── documents.validation.ts
│       │   │
│       │   ├── users/
│       │   │   ├── users.controller.ts
│       │   │   ├── users.service.ts
│       │   │   ├── users.routes.ts
│       │   │   └── users.validation.ts
│       │   │
│       │   ├── reports/
│       │   │   ├── reports.controller.ts
│       │   │   ├── reports.service.ts
│       │   │   ├── reports.routes.ts
│       │   │   └── generators/
│       │   │       ├── pdf.generator.ts
│       │   │       └── excel.generator.ts
│       │   │
│       │   └── notifications/
│       │       ├── notifications.controller.ts
│       │       ├── notifications.service.ts
│       │       ├── email.provider.ts
│       │       └── whatsapp.provider.ts
│       │
│       ├── jobs/
│       │   ├── renewal-checker.job.ts   # Cron: check renewals daily
│       │   ├── notification-sender.job.ts
│       │   └── commission-calculator.job.ts
│       │
│       ├── utils/
│       │   ├── logger.ts
│       │   ├── pagination.ts
│       │   ├── cedula-validator.ts     # Validación cédula dominicana
│       │   ├── rnc-validator.ts        # Validación RNC dominicana
│       │   └── policy-number.ts        # Generación secuencial
│       │
│       └── types/
│           ├── express.d.ts
│           └── global.d.ts
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   │
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       │
│       ├── api/
│       │   ├── client.ts              # Axios instance
│       │   ├── auth.api.ts
│       │   ├── clients.api.ts
│       │   ├── policies.api.ts
│       │   ├── claims.api.ts
│       │   └── ...
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── TopBar.tsx
│       │   │   └── MainLayout.tsx
│       │   ├── ui/
│       │   │   ├── Modal.tsx
│       │   │   ├── DataTable.tsx
│       │   │   ├── StatCard.tsx
│       │   │   ├── StatusBadge.tsx
│       │   │   ├── SearchBar.tsx
│       │   │   └── FormInput.tsx
│       │   └── charts/
│       │       ├── SalesChart.tsx
│       │       └── PieDistribution.tsx
│       │
│       ├── modules/
│       │   ├── dashboard/
│       │   ├── clients/
│       │   ├── insurers/
│       │   ├── policies/
│       │   ├── claims/
│       │   ├── payments/
│       │   ├── commissions/
│       │   ├── renewals/
│       │   ├── users/
│       │   └── reports/
│       │
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── usePagination.ts
│       │   └── useDebounce.ts
│       │
│       ├── context/
│       │   ├── AuthContext.tsx
│       │   └── NotificationContext.tsx
│       │
│       ├── utils/
│       │   ├── formatters.ts
│       │   └── validators.ts
│       │
│       └── types/
│           └── index.ts
│
└── docs/
    ├── API.md
    ├── DEPLOYMENT.md
    └── postman/
        └── SeguroPro.postman_collection.json
```

---

## 5. ENDPOINTS PRINCIPALES DE LA API

### Autenticación
```
POST   /api/auth/login              # Login con email/password
POST   /api/auth/refresh            # Renovar JWT
POST   /api/auth/logout             # Invalidar sesión
POST   /api/auth/forgot-password    # Recuperar contraseña
POST   /api/auth/reset-password     # Restablecer contraseña
GET    /api/auth/me                 # Perfil del usuario actual
```

### Clientes
```
GET    /api/clients                 # Listar (paginado, filtros)
GET    /api/clients/:id             # Detalle del cliente
POST   /api/clients                 # Crear cliente
PUT    /api/clients/:id             # Actualizar cliente
DELETE /api/clients/:id             # Eliminar (soft delete)
GET    /api/clients/:id/policies    # Pólizas del cliente
GET    /api/clients/:id/payments    # Pagos del cliente
GET    /api/clients/:id/claims      # Reclamos del cliente
GET    /api/clients/:id/documents   # Documentos del cliente
POST   /api/clients/:id/contacts    # Agregar contacto
```

### Aseguradoras
```
GET    /api/insurers                # Listar aseguradoras
GET    /api/insurers/:id            # Detalle
POST   /api/insurers                # Crear
PUT    /api/insurers/:id            # Actualizar
GET    /api/insurers/:id/policies   # Pólizas con esta aseguradora
GET    /api/insurers/:id/commissions # Reglas de comisión
POST   /api/insurers/:id/commission-rules  # Crear regla comisión
```

### Pólizas
```
GET    /api/policies                # Listar (filtros: status, tipo, aseguradora)
GET    /api/policies/:id            # Detalle completo
POST   /api/policies                # Crear póliza
PUT    /api/policies/:id            # Actualizar
PATCH  /api/policies/:id/status     # Cambiar estado
GET    /api/policies/expiring       # Pólizas próximas a vencer
POST   /api/policies/:id/endorsements # Crear endoso
POST   /api/policies/:id/renew      # Iniciar renovación
```

### Siniestros / Reclamos
```
GET    /api/claims                  # Listar (filtros: status, prioridad)
GET    /api/claims/:id              # Detalle con notas
POST   /api/claims                  # Registrar siniestro
PUT    /api/claims/:id              # Actualizar
PATCH  /api/claims/:id/status       # Cambiar estado
POST   /api/claims/:id/notes        # Agregar nota interna
POST   /api/claims/:id/documents    # Adjuntar documento
```

### Pagos
```
GET    /api/payments                # Listar pagos
GET    /api/payments/:id            # Detalle
POST   /api/payments                # Registrar pago
PUT    /api/payments/:id            # Actualizar
GET    /api/payments/receivables    # Cuentas por cobrar
GET    /api/payments/overdue        # Pagos vencidos
```

### Comisiones
```
GET    /api/commissions             # Listar (filtros: productor, periodo)
GET    /api/commissions/:id         # Detalle
POST   /api/commissions/calculate   # Calcular comisiones de un periodo
PATCH  /api/commissions/:id/pay     # Marcar como pagada
GET    /api/commissions/summary     # Resumen por productor
GET    /api/commissions/report/:period # Reporte mensual/anual
```

### Renovaciones
```
GET    /api/renewals                # Listar
GET    /api/renewals/pending        # Pendientes de procesar
POST   /api/renewals/:id/process    # Procesar renovación
POST   /api/renewals/:id/notify     # Enviar recordatorio
GET    /api/renewals/calendar       # Vista calendario
```

### Documentos
```
GET    /api/documents               # Listar
POST   /api/documents/upload        # Subir documento
GET    /api/documents/:id/download  # Descargar (URL firmada)
DELETE /api/documents/:id           # Eliminar
```

### Usuarios
```
GET    /api/users                   # Listar
POST   /api/users                   # Crear usuario
PUT    /api/users/:id               # Actualizar
PATCH  /api/users/:id/status        # Activar/desactivar
PUT    /api/users/:id/password      # Cambiar contraseña
GET    /api/users/:id/audit-log     # Log de actividades
```

### Reportes
```
GET    /api/reports/dashboard       # KPIs del dashboard
GET    /api/reports/sales           # Ventas por periodo
GET    /api/reports/commissions     # Comisiones por periodo
GET    /api/reports/claims          # Siniestralidad
GET    /api/reports/clients         # Cartera de clientes
GET    /api/reports/renewals        # Estado de renovaciones
GET    /api/reports/export/pdf/:type     # Exportar PDF
GET    /api/reports/export/excel/:type   # Exportar Excel
```

### Notificaciones
```
GET    /api/notifications           # Historial
POST   /api/notifications/send      # Enviar manual
GET    /api/notifications/pending   # Pendientes de envío
```

---

## 6. EJEMPLO DE CÓDIGO CRUD — Módulo de Clientes

### Service (clients.service.ts)
```typescript
import { PrismaClient, ClientType, ClientStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface ClientFilters {
  search?: string;
  type?: ClientType;
  status?: ClientStatus;
  page?: number;
  limit?: number;
}

export class ClientsService {

  async findAll(filters: ClientFilters) {
    const { search, type, status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ClientWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { cedulaRnc: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(type && { type }),
      ...(status && { status }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.client.findMany({
        where,
        include: {
          _count: { select: { policies: true, payments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        policies: {
          include: { insurer: true, insuranceType: true },
          orderBy: { createdAt: 'desc' },
        },
        payments: { orderBy: { paymentDate: 'desc' }, take: 10 },
        contacts: true,
        documents: { where: { entityType: 'client' } },
        _count: { select: { policies: true, payments: true } },
      },
    });

    if (!client) throw new Error('Cliente no encontrado');
    return client;
  }

  async create(data: Prisma.ClientCreateInput) {
    // Validar cédula/RNC única
    const existing = await prisma.client.findUnique({
      where: { cedulaRnc: data.cedulaRnc },
    });
    if (existing) throw new Error('Ya existe un cliente con esta cédula/RNC');

    return prisma.client.create({ data });
  }

  async update(id: number, data: Prisma.ClientUpdateInput) {
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) throw new Error('Cliente no encontrado');

    return prisma.client.update({ where: { id }, data });
  }

  async delete(id: number) {
    // Soft delete: cambiar estado a CANCELADO
    const client = await prisma.client.findUnique({
      where: { id },
      include: { _count: { select: { policies: { where: { status: 'VIGENTE' } } } } },
    });

    if (!client) throw new Error('Cliente no encontrado');
    if (client._count.policies > 0) {
      throw new Error('No se puede eliminar: tiene pólizas vigentes');
    }

    return prisma.client.update({
      where: { id },
      data: { status: 'CANCELADO' },
    });
  }
}
```

### Controller (clients.controller.ts)
```typescript
import { Request, Response, NextFunction } from 'express';
import { ClientsService } from './clients.service';

const service = new ClientsService();

export class ClientsController {

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.findAll({
        search: req.query.search as string,
        type: req.query.type as any,
        status: req.query.status as any,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await service.findById(parseInt(req.params.id));
      res.json({ success: true, data: client });
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await service.create({
        ...req.body,
        creator: { connect: { id: req.user!.id } },
      });
      res.status(201).json({ success: true, data: client });
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await service.update(parseInt(req.params.id), req.body);
      res.json({ success: true, data: client });
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(parseInt(req.params.id));
      res.json({ success: true, message: 'Cliente eliminado' });
    } catch (error) { next(error); }
  }
}
```

### Routes (clients.routes.ts)
```typescript
import { Router } from 'express';
import { ClientsController } from './clients.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createClientSchema, updateClientSchema } from './clients.validation';

const router = Router();
const controller = new ClientsController();

router.use(authMiddleware);

router.get('/',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'SOLO_LECTURA']),
  controller.list
);

router.get('/:id',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'SOLO_LECTURA']),
  controller.getById
);

router.post('/',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  validate(createClientSchema),
  controller.create
);

router.put('/:id',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  validate(updateClientSchema),
  controller.update
);

router.delete('/:id',
  rbacMiddleware(['ADMINISTRADOR']),
  controller.delete
);

export default router;
```

### Validation (clients.validation.ts)
```typescript
import { z } from 'zod';

// Validador de cédula dominicana (algoritmo Luhn modificado)
function isValidCedula(cedula: string): boolean {
  const clean = cedula.replace(/[-\s]/g, '');
  if (clean.length !== 11) return false;
  const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let product = parseInt(clean[i]) * weights[i];
    if (product >= 10) product -= 9;
    sum += product;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(clean[10]);
}

export const createClientSchema = z.object({
  body: z.object({
    type: z.enum(['FISICA', 'JURIDICA']),
    name: z.string().min(2).max(200),
    cedulaRnc: z.string().min(9).max(20).refine(
      (val) => val.replace(/[-\s]/g, '').length >= 9,
      'Cédula/RNC inválido'
    ),
    phone: z.string().max(20).optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
  }),
});

export const updateClientSchema = z.object({
  body: createClientSchema.shape.body.partial(),
});
```

### Middleware de Auditoría (audit.middleware.ts)
```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function auditMiddleware(entityType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      if (res.statusCode < 400 && req.user) {
        const action = req.method === 'POST' ? 'CREATE'
          : req.method === 'PUT' || req.method === 'PATCH' ? 'UPDATE'
          : req.method === 'DELETE' ? 'DELETE' : null;

        if (action) {
          prisma.auditLog.create({
            data: {
              userId: req.user.id,
              action,
              entityType,
              entityId: parseInt(req.params.id) || body?.data?.id || 0,
              newValues: req.method !== 'DELETE' ? req.body : undefined,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
            },
          }).catch(console.error);
        }
      }
      return originalJson(body);
    };

    next();
  };
}
```

---

## 7. SEGURIDAD IMPLEMENTADA

| Medida | Implementación |
|--------|---------------|
| **Autenticación** | JWT con access token (15min) + refresh token (7d) en httpOnly cookie |
| **Contraseñas** | bcrypt con salt rounds = 12 |
| **RBAC** | Middleware por ruta que verifica rol del usuario contra matriz de permisos |
| **Rate Limiting** | express-rate-limit: 100 req/min general, 5 req/min para login |
| **Validación** | Zod schemas en todas las rutas de entrada |
| **SQL Injection** | Prisma ORM con consultas parametrizadas |
| **XSS** | Helmet + sanitización de inputs |
| **CORS** | Whitelist de orígenes permitidos |
| **Auditoría** | Log de todas las acciones CRUD con usuario, IP, timestamp |
| **Documentos** | URLs firmadas de S3 con expiración de 15 minutos |
| **HTTPS** | Obligatorio en producción con certificado SSL |
| **Datos sensibles** | Encriptación AES-256 para datos PII en reposo |

---

## 8. RECOMENDACIONES DE ESCALABILIDAD FUTURA

### Fase 2 — Corto Plazo (3-6 meses)
- **Multi-tenant**: Soporte para múltiples corredoras en una sola instancia
- **Portal del Cliente**: Acceso web para que clientes consulten sus pólizas y pagos
- **App Móvil**: React Native o Capacitor para acceso desde campo
- **Firma Digital**: Integración con proveedores de firma electrónica (Ej: DocuSign)

### Fase 3 — Mediano Plazo (6-12 meses)
- **Integración DGII**: Generación automática de NCF y reportes fiscales (606/607)
- **Integración Bancaria**: Conciliación automática de pagos bancarios
- **Motor de Cotización**: Cotizador automático conectado a APIs de aseguradoras
- **Business Intelligence**: Dashboard avanzado con Metabase o PowerBI embebido

### Fase 4 — Largo Plazo (12+ meses)
- **IA/ML**: Predicción de churn de clientes, scoring de riesgo
- **Microservicios**: Descomponer en servicios independientes (notificaciones, reportes, core)
- **Kubernetes**: Orquestación de contenedores para alta disponibilidad
- **API Pública**: Para que aseguradoras puedan conectar sus sistemas
- **Compliance SIB**: Adaptación a regulaciones de la Superintendencia de Seguros de RD

### Arquitectura de Escalamiento
```
                    ┌─────────────┐
                    │   CDN/WAF   │
                    │ Cloudflare  │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │ Load Balancer│
                    │   (Nginx)   │
                    └──┬───────┬──┘
                       │       │
              ┌────────┴─┐  ┌─┴────────┐
              │  App #1  │  │  App #2  │   ← Horizontal scaling
              │ Node.js  │  │ Node.js  │
              └────┬─────┘  └─────┬────┘
                   │              │
          ┌────────┴──────────────┴────────┐
          │         PostgreSQL             │
          │    (Primary + Read Replica)    │
          └────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │       Redis         │
              │  Cache + Sessions   │
              │  + Job Queue        │
              └─────────────────────┘
```

---

## 9. VARIABLES DE ENTORNO (.env.example)

```env
# Base de datos
DATABASE_URL="postgresql://user:pass@localhost:5432/seguros_pro"

# JWT
JWT_SECRET="your-256-bit-secret-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Redis
REDIS_URL="redis://localhost:6379"

# S3 / MinIO
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="seguros-pro-docs"

# Email
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
EMAIL_FROM="notificaciones@tucorredora.com.do"

# WhatsApp Business API
WHATSAPP_TOKEN="your-meta-business-token"
WHATSAPP_PHONE_ID="your-phone-number-id"

# App
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

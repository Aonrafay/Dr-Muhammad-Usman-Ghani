# SmileCare Dental Clinic - Project Structure

## Complete Project Directory Tree

```
smilecare-dental-clinic/
├── 📁 frontend/                    # Public website (React + Vite)
│   ├── 📁 public/                 # Static assets
│   │   ├── favicon.ico
│   │   ├── logo.png
│   │   ├── robots.txt
│   │   └── site.webmanifest
│   ├── 📁 src/
│   │   ├── 📁 assets/            # Images, fonts, styles
│   │   │   ├── 📁 images/
│   │   │   │   ├── clinic/
│   │   │   │   ├── doctor/
│   │   │   │   ├── services/
│   │   │   │   └── treatments/
│   │   │   ├── 📁 fonts/
│   │   │   └── 📁 styles/
│   │   │       ├── globals.css
│   │   │       └── tailwind.css
│   │   ├── 📁 components/        # Reusable UI components
│   │   │   ├── 📁 common/       # Shared components
│   │   │   │   ├── Button/
│   │   │   │   ├── Card/
│   │   │   │   ├── Input/
│   │   │   │   ├── Modal/
│   │   │   │   └── Spinner/
│   │   │   ├── 📁 layout/       # Layout components
│   │   │   │   ├── Header/
│   │   │   │   ├── Footer/
│   │   │   │   ├── Navigation/
│   │   │   │   └── Sidebar/
│   │   │   ├── 📁 sections/     # Page sections
│   │   │   │   ├── Hero/
│   │   │   │   ├── Services/
│   │   │   │   ├── Testimonials/
│   │   │   │   └── Contact/
│   │   │   └── 📁 forms/        # Form components
│   │   │       ├── AppointmentForm/
│   │   │       ├── ContactForm/
│   │   │       └── NewsletterForm/
│   │   ├── 📁 pages/            # Page components
│   │   │   ├── Home/
│   │   │   ├── Services/
│   │   │   ├── About/
│   │   │   ├── Appointment/
│   │   │   ├── Contact/
│   │   │   ├── Blog/
│   │   │   └── Gallery/
│   │   ├── 📁 hooks/            # Custom React hooks
│   │   │   ├── useAppointment.ts
│   │   │   ├── useAuth.ts
│   │   │   └── useFormValidation.ts
│   │   ├── 📁 services/         # API service layer
│   │   │   ├── api.ts
│   │   │   ├── appointmentService.ts
│   │   │   ├── patientService.ts
│   │   │   └── serviceService.ts
│   │   ├── 📁 store/            # State management (Zustand)
│   │   │   ├── appointmentStore.ts
│   │   │   ├── authStore.ts
│   │   │   └── uiStore.ts
│   │   ├── 📁 types/            # TypeScript type definitions
│   │   │   ├── appointment.ts
│   │   │   ├── patient.ts
│   │   │   ├── service.ts
│   │   │   └── user.ts
│   │   ├── 📁 utils/            # Utility functions
│   │   │   ├── dateUtils.ts
│   │   │   ├── validation.ts
│   │   │   ├── constants.ts
│   │   │   └── helpers.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── routes.tsx
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── README.md
├── 📁 backend/                    # API server (Node.js + Express)
│   ├── 📁 src/
│   │   ├── 📁 config/           # Configuration files
│   │   │   ├── database.ts
│   │   │   ├── jwt.ts
│   │   │   ├── cloudinary.ts
│   │   │   └── mailer.ts
│   │   ├── 📁 controllers/      # Route controllers
│   │   │   ├── authController.ts
│   │   │   ├── appointmentController.ts
│   │   │   ├── patientController.ts
│   │   │   ├── serviceController.ts
│   │   │   ├── blogController.ts
│   │   │   └── contactController.ts
│   │   ├── 📁 middleware/       # Express middleware
│   │   │   ├── authMiddleware.ts
│   │   │   ├── validationMiddleware.ts
│   │   │   ├── errorMiddleware.ts
│   │   │   └── rateLimitMiddleware.ts
│   │   ├── 📁 models/          # Database models (Prisma)
│   │   │   ├── User.ts
│   │   │   ├── Patient.ts
│   │   │   ├── Appointment.ts
│   │   │   └── Service.ts
│   │   ├── 📁 routes/          # API routes
│   │   │   ├── authRoutes.ts
│   │   │   ├── appointmentRoutes.ts
│   │   │   ├── patientRoutes.ts
│   │   │   ├── serviceRoutes.ts
│   │   │   └── index.ts
│   │   ├── 📁 schemas/         # Validation schemas (Zod)
│   │   │   ├── authSchema.ts
│   │   │   ├── appointmentSchema.ts
│   │   │   ├── patientSchema.ts
│   │   │   └── serviceSchema.ts
│   │   ├── 📁 services/        # Business logic
│   │   │   ├── authService.ts
│   │   │   ├── appointmentService.ts
│   │   │   ├── emailService.ts
│   │   │   └── notificationService.ts
│   │   ├── 📁 types/           # TypeScript types
│   │   │   ├── express.d.ts
│   │   │   ├── custom.d.ts
│   │   │   └── index.ts
│   │   ├── 📁 utils/           # Utility functions
│   │   │   ├── logger.ts
│   │   │   ├── validation.ts
│   │   │   ├── dateUtils.ts
│   │   │   └── helpers.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── 📁 prisma/              # Prisma ORM files
│   │   ├── schema.prisma
│   │   ├── migrations/         # Database migrations
│   │   │   ├── 20240101000000_init/
│   │   │   ├── 20240102000000_add_appointments/
│   │   │   └── 20240103000000_add_services/
│   │   └── seed.ts            # Database seeding
│   ├── 📁 tests/              # Test files
│   │   ├── 📁 unit/
│   │   ├── 📁 integration/
│   │   └── 📁 e2e/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── dockerfile
│   └── README.md
├── 📁 admin/                     # Admin panel (Next.js)
│   ├── 📁 src/
│   │   ├── 📁 app/             # Next.js 14 app router
│   │   │   ├── 📁 (auth)/      # Authentication routes
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── 📁 (dashboard)/ # Dashboard routes
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── 📁 appointments/
│   │   │   │   ├── 📁 patients/
│   │   │   │   ├── 📁 services/
│   │   │   │   ├── 📁 staff/
│   │   │   │   ├── 📁 content/
│   │   │   │   └── 📁 settings/
│   │   │   ├── 📁 api/         # API routes (Next.js)
│   │   │   │   ├── auth/
│   │   │   │   └── webhook/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── 📁 components/      # Admin components
│   │   │   ├── 📁 ui/          # Shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   └── table.tsx
│   │   │   ├── 📁 layout/      # Layout components
│   │   │   │   ├── Sidebar/
│   │   │   │   ├── Header/
│   │   │   │   └── Breadcrumb/
│   │   │   ├── 📁 charts/      # Chart components
│   │   │   │   ├── RevenueChart/
│   │   │   │   ├── AppointmentChart/
│   │   │   │   └── PatientChart/
│   │   │   ├── 📁 forms/       # Form components
│   │   │   │   ├── AppointmentForm/
│   │   │   │   ├── PatientForm/
│   │   │   │   └── ServiceForm/
│   │   │   └── 📁 tables/      # Data table components
│   │   │       ├── AppointmentTable/
│   │   │       ├── PatientTable/
│   │   │       └── ServiceTable/
│   │   ├── 📁 lib/             # Library code
│   │   │   ├── api.ts          # API client
│   │   │   ├── auth.ts         # Authentication utilities
│   │   │   ├── db.ts           # Database utilities
│   │   │   └── utils.ts        # General utilities
│   │   ├── 📁 hooks/           # Custom hooks
│   │   │   ├── useAppointments.ts
│   │   │   ├── usePatients.ts
│   │   │   └── useServices.ts
│   │   ├── 📁 store/           # State management
│   │   │   ├── authStore.ts
│   │   │   ├── uiStore.ts
│   │   │   └── appointmentStore.ts
│   │   ├── 📁 types/           # TypeScript types
│   │   │   ├── appointment.ts
│   │   │   ├── patient.ts
│   │   │   └── user.ts
│   │   ├── 📁 styles/          # CSS styles
│   │   │   ├── globals.css
│   │   │   └── components.css
│   │   └── 📁 public/          # Static assets
│   │       ├── favicon.ico
│   │       ├── logo.png
│   │       └── admin-logo.png
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── components.json         # Shadcn/ui configuration
│   └── README.md
├── 📁 shared/                   # Shared code between projects
│   ├── 📁 types/               # Shared TypeScript types
│   │   ├── appointment.ts
│   │   ├── patient.ts
│   │   ├── service.ts
│   │   └── user.ts
│   ├── 📁 utils/               # Shared utilities
│   │   ├── dateUtils.ts
│   │   ├── validation.ts
│   │   └── constants.ts
│   └── 📁 schemas/             # Shared validation schemas
│       ├── appointmentSchema.ts
│       └── patientSchema.ts
├── 📁 docker/                   # Docker configuration
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── docker-compose.dev.yml
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── ssl/                # SSL certificates
│   └── scripts/
│       ├── init-db.sh
│       ├── backup.sh
│       └── deploy.sh
├── 📁 scripts/                  # Deployment and utility scripts
│   ├── setup.sh                # Initial setup script
│   ├── deploy.sh               # Deployment script
│   ├── backup.sh               # Backup script
│   ├── migrate.sh              # Database migration script
│   └── seed.sh                 # Database seeding script
├── 📁 docs/                     # Documentation
│   ├── api/                    # API documentation
│   │   ├── endpoints.md
│   │   └── swagger.yaml
│   ├── architecture/           # Architecture diagrams
│   │   ├── system-architecture.png
│   │   └── database-schema.png
│   ├── user-guides/            # User guides
│   │   ├── patient-guide.md
│   │   └── admin-guide.md
│   └── compliance/             # Compliance documentation
│       ├── gdpr-compliance.md
│       └── data-retention.md
├── 📁 .github/                  # GitHub workflows and templates
│   ├── 📁 workflows/
│   │   ├── ci.yml              # Continuous integration
│   │   ├── cd.yml              # Continuous deployment
│   │   └── security-scan.yml   # Security scanning
│   ├── 📁 ISSUE_TEMPLATE/
│   │   ├── bug-report.md
│   │   └── feature-request.md
│   └── PULL_REQUEST_TEMPLATE.md
├── .env.example                # Example environment variables
├── .gitignore                  # Git ignore file
├── .prettierrc                 # Code formatting configuration
├── .eslintrc.json              # ESLint configuration
├── package.json                # Root package.json (workspaces)
├── docker-compose.yml          # Docker Compose configuration
├── LICENSE                     # Project license
└── README.md                   # Main project README
```

## Key Configuration Files

### Root `package.json` (Workspaces)
```json
{
  "name": "smilecare-dental-clinic",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend",
    "admin",
    "shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\" \"npm run dev:admin\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:admin": "cd admin && npm run dev",
    "build": "npm run build:backend && npm run build:frontend && npm run build:admin",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "build:admin": "cd admin && npm run build",
    "test": "npm run test:backend && npm run test:frontend && npm run test:admin",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "format": "prettier --write .",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f"
  },
  "devDependencies": {
    "concurrently": "^8.2.0",
    "prettier": "^3.0.0",
    "eslint": "^8.45.0",
    "typescript": "^5.0.0"
  }
}
```

### Root `.env.example`
```env
# ====================
# DATABASE CONFIGURATION
# ====================
DATABASE_URL="postgresql://username:password@localhost:5432/smilecare_dev"

# ====================
# JWT CONFIGURATION
# ====================
JWT_SECRET="your-jwt-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# ====================
# CLOUDINARY CONFIGURATION
# ====================
CLOUDINARY_CLOUD_NAME
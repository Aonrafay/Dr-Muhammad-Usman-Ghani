# SmileCare Dental Clinic - Website Architecture

## System Overview

The SmileCare Dental Clinic website is a full-stack web application with three main components:
1. **Public Website** - Patient-facing interface for information and appointments
2. **Admin Panel** - Clinic management interface for staff
3. **Backend API** - Central server handling business logic and data

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Devices                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Desktop   │  │   Mobile    │  │   Tablet    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│          │               │               │                 │
└──────────┼───────────────┼───────────────┼─────────────────┘
           │               │               │
           ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare CDN                           │
│                    (Caching & Security)                     │
└─────────────────────────────────────────────────────────────┘
           │               │               │
           ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                            │
│                    (Vercel/Railway)                         │
└─────────────────────────────────────────────────────────────┘
           │               │               │
           ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Frontend      │ │   Admin Panel   │ │   Backend API   │
│  (React App)    │ │   (Next.js)     │ │  (Node.js)      │
│  Vercel Hosted  │ │  Vercel Hosted  │ │ Railway Hosted  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│                    (Railway/Neon)                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Cloudinary│ │SendGrid  │ │Google    │ │Stripe    │      │
│  │(Images)  │ │(Email)   │ │Maps      │ │(Payments)│      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Public Website (Frontend)

**Technology Stack:**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (faster development)
- **Styling**: Tailwind CSS + DaisyUI components
- **State Management**: Zustand (lightweight alternative to Redux)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Calendar**: React Big Calendar for appointments
- **Maps**: React Google Maps API
- **Animation**: Framer Motion

**Key Pages:**
- `/` - Homepage with hero, services, doctor info
- `/services` - Detailed dental services
- `/about` - Doctor biography and clinic info
- `/appointment` - Online booking system
- `/contact` - Contact form and location
- `/blog` - Dental health articles
- `/gallery` - Before/after treatment photos

**Performance Features:**
- Code splitting with React.lazy()
- Image optimization with next/image equivalent
- Service Worker for PWA capabilities
- CDN caching for static assets
- Lazy loading for below-fold content

### 2. Admin Panel

**Technology Stack:**
- **Framework**: Next.js 14 (App Router) with TypeScript
- **UI Library**: Shadcn/ui + Tailwind CSS
- **Authentication**: NextAuth.js with role-based access
- **Data Tables**: TanStack Table v8
- **Charts**: Recharts for analytics
- **Forms**: React Hook Form + Zod
- **Notifications**: Sonner toast notifications
- **Icons**: Lucide React

**Admin Modules:**
- **Dashboard** - Overview metrics and charts
- **Appointments** - Calendar view and management
- **Patients** - CRUD operations and medical records
- **Services** - Service catalog management
- **Staff** - User management and permissions
- **Content** - Blog and gallery management
- **Settings** - Clinic configuration
- **Reports** - Analytics and exports

**Security Features:**
- Role-based access control (RBAC)
- JWT token authentication
- Session management with secure cookies
- Audit logging for admin actions
- Rate limiting for API endpoints
- CSRF protection

### 3. Backend API

**Technology Stack:**
- **Runtime**: Node.js 18+ with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod for request validation
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest + Supertest
- **Logging**: Winston with rotating files
- **Monitoring**: Prometheus metrics

**API Structure:**
```
/api
├── /auth          # Authentication endpoints
├── /appointments  # Appointment management
├── /patients      # Patient records
├── /services      # Dental services
├── /blog          # Blog posts
├── /gallery       # Image gallery
├── /contact       # Contact form submissions
└── /admin         # Admin-specific endpoints
```

**Database Schema Highlights:**

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String   // Hashed with bcrypt
  role          Role     @default(PATIENT)
  patient       Patient?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Patient {
  id            String   @id @default(cuid())
  firstName     String
  lastName      String
  email         String   @unique
  phone         String
  dateOfBirth   DateTime?
  medicalHistory Json?   // JSON field for medical records
  appointments  Appointment[]
  createdAt     DateTime @default(now())
}

model Appointment {
  id            String   @id @default(cuid())
  patientId     String
  patient       Patient  @relation(fields: [patientId], references: [id])
  serviceId     String
  service       Service  @relation(fields: [serviceId], references: [id])
  date          DateTime
  duration      Int      @default(30) // minutes
  status        AppointmentStatus @default(PENDING)
  notes         String?
  createdAt     DateTime @default(now())
}

model Service {
  id            String   @id @default(cuid())
  name          String
  description   String
  duration      Int      @default(30)
  price         Float?
  category      ServiceCategory
  isActive      Boolean  @default(true)
}
```

### 4. Database Design

**PostgreSQL Configuration:**
- **Version**: PostgreSQL 14+
- **Extensions**: pg_trgm (text search), uuid-ossp
- **Connection Pooling**: PgBouncer (in production)
- **Backup Strategy**: Daily automated backups
- **Replication**: Read replicas for analytics

**Indexing Strategy:**
- B-tree indexes on foreign keys
- GIN indexes on searchable text fields
- Partial indexes for active records
- Composite indexes for common queries

### 5. External Integrations

**Payment Processing (Optional):**
- **Stripe** for online payments
- Integration for deposit payments
- Subscription for dental plans

**Communication Services:**
- **Twilio** for SMS appointment reminders
- **SendGrid** for email notifications
- **WhatsApp Business API** for patient communication

**Analytics & Monitoring:**
- **Google Analytics 4** for website traffic
- **Hotjar** for user behavior analysis
- **Sentry** for error tracking
- **Uptime Robot** for availability monitoring

## Data Flow

### Appointment Booking Flow
1. Patient visits website and navigates to appointment page
2. Patient selects service, date, and time from available slots
3. System validates availability via backend API
4. Patient fills contact form with personal details
5. Backend creates appointment record with PENDING status
6. Confirmation email sent via SendGrid
7. Admin receives notification of new appointment
8. Admin reviews and confirms appointment
9. Patient receives confirmation with calendar invite

### Admin Workflow
1. Admin logs in via secure authentication
2. Dashboard shows today's appointments and key metrics
3. Admin navigates to appointments module
4. Views calendar or list of appointments
5. Can approve, cancel, or reschedule appointments
6. Updates patient records as needed
7. Generates reports for monthly analytics
8. Manages website content through CMS

## Security Architecture

### Authentication & Authorization
- **JWT-based authentication** with refresh tokens
- **Role-based access control** (Patient, Staff, Admin, SuperAdmin)
- **Password policies** with bcrypt hashing
- **Session management** with secure, HTTP-only cookies
- **Two-factor authentication** for admin accounts (optional)

### Data Protection
- **Encryption at rest** for sensitive data
- **SSL/TLS** for all communications
- **GDPR compliance** for patient data
- **Data anonymization** for analytics
- **Regular security audits** and penetration testing

### API Security
- **Rate limiting** per IP and user
- **CORS configuration** for allowed origins
- **Input validation** and sanitization
- **SQL injection prevention** via Prisma
- **XSS protection** via Content Security Policy

## Performance Optimization

### Frontend Optimization
- **Bundle splitting** for code optimization
- **Image optimization** with WebP format
- **Lazy loading** for images and components
- **Critical CSS** inlining
- **Browser caching** strategies

### Backend Optimization
- **Database connection pooling**
- **Query optimization** with Prisma
- **Redis caching** for frequent queries
- **CDN** for static assets
- **Compression** with gzip/brotli

### Monitoring & Alerting
- **Application Performance Monitoring** (APM) with New Relic
- **Database performance monitoring**
- **Uptime monitoring** with status page
- **Error tracking** with Sentry
- **Log aggregation** with ELK stack

## Scalability Considerations

### Horizontal Scaling
- **Stateless backend** for easy scaling
- **Database read replicas** for heavy read loads
- **Redis cluster** for distributed caching
- **CDN** for global content delivery

### Vertical Scaling
- **Database optimization** with connection pooling
- **Memory optimization** for Node.js processes
- **CPU optimization** for image processing

### Disaster Recovery
- **Automated backups** with point-in-time recovery
- **Multi-region deployment** for high availability
- **Failover strategies** for critical services

## Deployment Architecture

### Development Environment
- **Local development** with Docker Compose
- **Feature branches** with preview deployments
- **Automated testing** on pull requests

### Staging Environment
- **Mirror of production** with test data
- **Performance testing** before production
- **User acceptance testing** (UAT)

### Production Environment
- **Blue-green deployment** strategy
- **Canary releases** for new features
- **Rollback capability** for quick recovery

## Cost Optimization

### Infrastructure Costs
- **Serverless functions** for sporadic workloads
- **Reserved instances** for predictable loads
- **CDN caching** to reduce bandwidth costs
- **Database optimization** to reduce size

### Development Costs
- **Open-source technologies** to reduce licensing
- **Automated testing** to reduce manual QA
- **CI/CD pipelines** to reduce deployment time

## Future Enhancements

### Phase 2 (3-6 months)
- Mobile app for patients
- Tele-dentistry consultations
- AI-powered symptom checker
- Integration with dental insurance providers

### Phase 3 (6-12 months)
- Patient portal for medical records
- Automated treatment plans
- Inventory management for dental supplies
- Advanced analytics with machine learning

---

**Architecture Version**: 1.0  
**Last Reviewed**: April 2024  
**Architect**: Technical Team  
**Approved By**: Dr. Muhammad Usman Ghani
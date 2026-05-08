# SmileCare Dental Clinic - Technical Specifications

## System Requirements

### Minimum Hardware Requirements
| Component | Development | Production |
|-----------|-------------|------------|
| **CPU** | Quad-core 2.0 GHz | 8-core 3.0 GHz |
| **RAM** | 8 GB | 16 GB |
| **Storage** | 50 GB SSD | 200 GB SSD |
| **Network** | 10 Mbps | 100 Mbps dedicated |

### Software Requirements
| Component | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18.x LTS | Runtime environment |
| **npm** | 9.x | Package management |
| **PostgreSQL** | 14+ | Database |
| **Redis** | 7.x | Caching |
| **Docker** | 24.x | Containerization |
| **Git** | 2.40+ | Version control |

## Development Environment Setup

### Prerequisites Installation

**Windows:**
```powershell
# Install Node.js via nvm-windows
nvm install 18.17.0
nvm use 18.17.0

# Install PostgreSQL
choco install postgresql14

# Install Redis
choco install redis-64

# Install Docker Desktop
choco install docker-desktop
```

**macOS/Linux:**
```bash
# Install Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install PostgreSQL
brew install postgresql@14
brew services start postgresql@14

# Install Redis
brew install redis
brew services start redis
```

## Technology Stack Details

### Frontend (Public Website)
| Technology | Version | Purpose | Configuration |
|------------|---------|---------|---------------|
| **React** | 18.2.0 | UI Library | Strict mode enabled |
| **TypeScript** | 5.0.0 | Type safety | Strict configuration |
| **Vite** | 4.4.0 | Build tool | React plugin, SWC |
| **Tailwind CSS** | 3.3.0 | Styling | JIT mode, custom config |
| **React Router** | 6.15.0 | Routing | Nested routes, lazy loading |
| **React Hook Form** | 7.45.0 | Form handling | Zod integration |
| **Zod** | 3.21.0 | Validation | Schema validation |
| **Axios** | 1.5.0 | HTTP client | Interceptors, error handling |
| **Framer Motion** | 10.16.0 | Animations | Gesture support |
| **React Query** | 4.35.0 | Data fetching | Cache management |

### Backend API
| Technology | Version | Purpose | Configuration |
|------------|---------|---------|---------------|
| **Node.js** | 18.17.0 | Runtime | ES modules |
| **Express.js** | 4.18.0 | Web framework | CORS, compression |
| **TypeScript** | 5.0.0 | Type safety | Strict mode |
| **Prisma** | 5.2.0 | ORM | PostgreSQL adapter |
| **PostgreSQL** | 14.0 | Database | Connection pooling |
| **JWT** | 9.0.0 | Authentication | RS256 algorithm |
| **Bcrypt** | 5.1.0 | Password hashing | Salt rounds: 12 |
| **Zod** | 3.21.0 | Validation | Request validation |
| **Winston** | 3.10.0 | Logging | Daily rotation |
| **Jest** | 29.6.0 | Testing | Coverage reports |
| **Supertest** | 6.3.0 | HTTP testing | Integration tests |

### Admin Panel
| Technology | Version | Purpose | Configuration |
|------------|---------|---------|---------------|
| **Next.js** | 14.0.0 | Framework | App router, SSR |
| **TypeScript** | 5.0.0 | Type safety | Strict mode |
| **Tailwind CSS** | 3.3.0 | Styling | Custom design system |
| **NextAuth.js** | 4.24.0 | Authentication | JWT sessions |
| **TanStack Table** | 8.10.0 | Data tables | Virtual scrolling |
| **Recharts** | 2.8.0 | Charts | Responsive charts |
| **React Hook Form** | 7.45.0 | Forms | Zod integration |
| **Zustand** | 4.4.0 | State management | Middleware support |
| **shadcn/ui** | 0.5.0 | UI components | Customizable |

## Database Schema Specifications

### Core Tables

**Users Table**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'patient',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Patients Table**
```sql
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    phone VARCHAR(20),
    address TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    insurance_provider VARCHAR(100),
    insurance_id VARCHAR(100),
    medical_history JSONB,
    allergies JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
```

**Appointments Table**
```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    dentist_id UUID REFERENCES users(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_time > start_time)
);

CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_dentist ON appointments(dentist_id);
```

**Services Table**
```sql
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    duration_minutes INTEGER DEFAULT 30,
    price DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(is_active) WHERE is_active = true;
```

### Database Configuration
```yaml
# PostgreSQL Configuration (postgresql.conf)
max_connections: 200
shared_buffers: 4GB
effective_cache_size: 12GB
maintenance_work_mem: 1GB
checkpoint_completion_target: 0.9
wal_buffers: 16MB
default_statistics_target: 100
```

## API Specifications

### Authentication Endpoints

**POST /api/auth/login**
```json
Request:
{
  "email": "patient@example.com",
  "password": "securepassword123"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "patient@example.com",
      "role": "patient"
    }
  }
}
```

**POST /api/auth/refresh**
```json
Request:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "new-access-token"
  }
}
```

### Appointment Endpoints

**GET /api/appointments**
```json
Query Parameters:
?page=1&limit=20&status=confirmed&date=2024-04-24

Response:
{
  "success": true,
  "data": {
    "appointments": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

**POST /api/appointments**
```json
Request:
{
  "patientId": "uuid",
  "serviceId": "uuid",
  "appointmentDate": "2024-04-25",
  "startTime": "14:30:00",
  "notes": "Regular checkup"
}

Response:
{
  "success": true,
  "data": {
    "appointment": {
      "id": "uuid",
      "appointmentDate": "2024-04-25",
      "startTime": "14:30:00",
      "status": "pending",
      "confirmationCode": "SC-20240425-1430"
    }
  }
}
```

### Patient Endpoints

**GET /api/patients/:id**
```json
Response:
{
  "success": true,
  "data": {
    "patient": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "medicalHistory": {
        "conditions": ["Hypertension"],
        "allergies": ["Penicillin"]
      },
      "appointments": [...]
    }
  }
}
```

## Performance Requirements

### Response Time Targets
| Endpoint | Target Response Time | 95th Percentile |
|----------|---------------------|-----------------|
| Homepage | < 500ms | < 800ms |
| Appointment booking | < 1s | < 2s |
| Admin dashboard | < 800ms | < 1.5s |
| API endpoints | < 200ms | < 500ms |
| Database queries | < 100ms | < 300ms |

### Concurrent Users
| Scenario | Concurrent Users | Throughput |
|----------|------------------|------------|
| Normal operation | 100 | 50 req/sec |
| Peak hours | 500 | 200 req/sec |
| Marketing campaign | 1000 | 400 req/sec |

### Availability Requirements
- **Uptime**: 99.9% (43 minutes downtime per month)
- **Backup**: Daily automated backups with 30-day retention
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour

## Security Specifications

### Authentication & Authorization
- **JWT tokens** with 15-minute expiry
- **Refresh tokens** with 7-day expiry
- **Role-based access control** (RBAC)
- **Password requirements**: Minimum 12 characters, mixed case, numbers, symbols
- **Account lockout**: After 5 failed attempts, 15-minute lock

### Data Protection
- **Encryption at rest**: AES-256 for sensitive data
- **Encryption in transit**: TLS 1.3
- **Data masking** for PII in logs
- **GDPR compliance** for patient data
- **Regular security audits** quarterly

### API Security
- **Rate limiting**: 100 requests/minute per IP
- **CORS**: Whitelisted domains only
- **Input validation**: All endpoints
- **SQL injection prevention**: Parameterized queries via Prisma
- **XSS protection**: Content Security Policy headers

## Testing Specifications

### Unit Tests
- **Coverage target**: 80% minimum
- **Framework**: Jest with TypeScript
- **Mocking**: Jest mocks for external services
- **Assertions**: Jest expect with custom matchers

### Integration Tests
- **Database**: Test with test database
- **API**: Supertest for endpoint testing
- **Authentication**: Mock JWT tokens
- **Cleanup**: Database truncation after tests

### E2E Tests
- **Framework**: Playwright
- **Browser**: Chrome, Firefox, Safari
- **Scenarios**: Critical user journeys
- **Reporting**: HTML reports with screenshots

### Performance Tests
- **Tool**: k6
- **Scenarios**: Load, stress, spike testing
- **Metrics**: Response time, throughput, error rate
- **Thresholds**: Defined per endpoint

## Deployment Specifications

### Build Process
```yaml
# Frontend Build
steps:
  - npm ci
  - npm run type-check
  - npm run test
  - npm run build
  - npm run lint

# Backend Build
steps:
  - npm ci
  - npx prisma generate
  - npm run build
  - npm run test

# Docker Build
docker build -t smilecare-frontend:latest ./frontend
docker build -t smilecare-backend:latest ./backend
docker build -t smilecare-admin:latest ./admin
```

### Environment Variables
```env
# Production Environment
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=your-256-bit-secret
CLOUDINARY_URL=cloudinary://key:secret@cloudname
SENDGRID_API_KEY=sg.key
GOOGLE_MAPS_API_KEY=AIza...
STRIPE_SECRET_KEY=sk_live_...
```

### Monitoring & Alerting
- **Application**: New Relic APM
- **Infrastructure**: Datadog
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Alerts**: PagerDuty integration
- **Uptime**: Status page with incident reporting

## Scalability Specifications

### Horizontal Scaling
- **Stateless backend** for easy scaling
- **Database read replicas** for heavy read loads
- **Redis cluster** for distributed caching
- **CDN** for global content delivery

### Vertical Scaling
- **Database optimization** with connection pooling
- **Memory optimization** for Node.js processes
- **CPU optimization** for image processing

### Load Balancing
- **Round-robin** for API servers
- **Session persistence** for admin panel
- **Health checks** every 30 seconds
- **Auto-scaling** based on CPU utilization

## Maintenance Specifications

### Regular Maintenance Tasks
| Task | Frequency | Responsibility |
|------|-----------|----------------|
| Database backup verification | Daily | System Admin |
| Security patch application | Weekly | DevOps |
| Performance monitoring review | Weekly | DevOps |
| Log rotation and cleanup | Weekly | System Admin |
| Dependency updates | Monthly | Development Team |
| Security audit | Quarterly | Security Team |
| Disaster recovery test | Bi-annually | DevOps Team |

### Backup Strategy
- **Frequency**: Daily full backup + hourly incremental
- **Retention**: 30 days for daily, 1 year for monthly
- **Storage**: AWS S3 with versioning
- **Encryption**: AES-256 at rest
- **Verification**: Automated restore test weekly

### Update Procedures
1. **Development** → **Staging** → **Production** pipeline
2. **Blue-green deployment** for zero downtime
3. **Database migrations** with rollback capability
4. **Feature flags** for gradual rollout
5. **Monitoring** during and after deployment

## Compliance Requirements

### Healthcare Regulations
- **HIPAA** compliance for patient data (if applicable)
- **GDPR** for European patients
- **Local dental practice regulations**
- **Data retention policies** (7+ years for medical records)

### Accessibility Standards
- **WCAG 2.1 AA** compliance
- **Screen reader** compatibility
- **Keyboard navigation** support
- **Color contrast** requirements
- **Responsive design** for all devices

### Performance Standards
- **Core Web Vitals** targets:
  - LCP: < 2.5s
  - FID: < 100ms
  - CLS: < 0.1
- **Mobile-friendly** design
- **Progressive Web App** capabilities

---

**Technical Specifications Version**: 1.0  
**Last Updated**: April 2024  
**Technical Lead**: Development Team  
**Approval**: Dr. Muhammad Usman Ghani
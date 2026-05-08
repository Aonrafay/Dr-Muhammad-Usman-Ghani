# SmileCare Dental Clinic - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the SmileCare Dental Clinic website and admin panel to production environments. The deployment strategy uses modern cloud platforms for reliability, scalability, and ease of maintenance.

## Deployment Options

### Option 1: Vercel + Railway (Recommended for Startups)
- **Frontend**: Vercel (React app)
- **Admin Panel**: Vercel (Next.js app)
- **Backend API**: Railway (Node.js + PostgreSQL)
- **Cost**: ~$20-50/month

### Option 2: AWS ECS/Fargate (Enterprise)
- **Frontend**: AWS Amplify or S3 + CloudFront
- **Admin Panel**: AWS Amplify
- **Backend API**: AWS ECS/Fargate
- **Database**: AWS RDS PostgreSQL
- **Cost**: ~$100-300/month

### Option 3: Docker Compose (Self-hosted)
- **All services**: Docker containers
- **Hosting**: Any VPS (DigitalOcean, Linode, etc.)
- **Cost**: ~$10-40/month

## Prerequisites

### Required Accounts
1. **GitHub Account** - For repository hosting
2. **Vercel Account** - Free tier available
3. **Railway Account** - Free credits available
4. **Cloudinary Account** - For image storage
5. **SendGrid Account** - For email services
6. **Domain Name** - Registered domain (e.g., smilecaredental.com)

### Required Tools
- **Git** - Version control
- **Node.js 18+** - Runtime
- **npm or yarn** - Package manager
- **Docker** (optional) - For containerization
- **PostgreSQL Client** - For database management

## Option 1: Vercel + Railway Deployment (Recommended)

### Step 1: Prepare Repository

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/smilecare-dental-clinic.git
   git push -u origin main
   ```

2. **Repository Structure**
   ```
   smilecare-dental-clinic/
   ├── frontend/          # Public website
   ├── backend/           # API server
   ├── admin/             # Admin panel
   └── shared/            # Shared code
   ```

### Step 2: Deploy Backend to Railway

1. **Create Railway Project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select the repository

2. **Configure Backend Service**
   - Select `backend` directory
   - Set build command: `npm run build`
   - Set start command: `npm start`
   - Set Node.js version: 18

3. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically create database
   - Note the connection URL

4. **Configure Environment Variables**
   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://[username]:[password]@[host]:[port]/[database]
   JWT_SECRET=your-256-bit-secret-key-here
   JWT_REFRESH_SECRET=your-256-bit-refresh-secret-here
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   SENDGRID_API_KEY=sg.your-api-key
   FRONTEND_URL=https://www.smilecaredental.com
   ADMIN_URL=https://admin.smilecaredental.com
   ```

5. **Run Database Migrations**
   ```bash
   # Via Railway CLI
   railway run npx prisma migrate deploy
   ```

6. **Generate Prisma Client**
   ```bash
   railway run npx prisma generate
   ```

7. **Deploy Backend**
   - Railway will automatically deploy on push
   - Get the deployment URL (e.g., `https://smilecare-backend.up.railway.app`)

### Step 3: Deploy Frontend to Vercel

1. **Import Frontend to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import from GitHub
   - Select repository

2. **Configure Frontend Project**
   - Root directory: `frontend`
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

3. **Set Environment Variables**
   ```env
   VITE_API_URL=https://smilecare-backend.up.railway.app/api
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   VITE_SITE_NAME=SmileCare Dental Clinic
   VITE_CONTACT_EMAIL=drmusmang@gmail.com
   VITE_CONTACT_PHONE=03443217547
   ```

4. **Deploy Frontend**
   - Click "Deploy"
   - Vercel will build and deploy
   - Get the deployment URL (e.g., `https://smilecare-dental-clinic.vercel.app`)

### Step 4: Deploy Admin Panel to Vercel

1. **Create Another Vercel Project**
   - Repeat Step 3 for admin panel
   - Root directory: `admin`
   - Framework: Next.js
   - Build command: `npm run build`
   - Output directory: `.next`

2. **Set Environment Variables**
   ```env
   NEXT_PUBLIC_API_URL=https://smilecare-backend.up.railway.app/api
   NEXTAUTH_SECRET=your-nextauth-secret-key
   NEXTAUTH_URL=https://admin.smilecaredental.com
   DATABASE_URL=postgresql://[username]:[password]@[host]:[port]/[database]
   ADMIN_EMAIL=drmusmang@gmail.com
   ```

3. **Deploy Admin Panel**
   - Click "Deploy"
   - Get the deployment URL (e.g., `https://smilecare-admin.vercel.app`)

### Step 5: Configure Domains

1. **Add Custom Domain to Frontend**
   - In Vercel project settings → Domains
   - Add `www.smilecaredental.com`
   - Add `smilecaredental.com` (redirect to www)

2. **Add Custom Domain to Admin Panel**
   - Add `admin.smilecaredental.com`
   - Configure SSL automatically

3. **Update DNS Records**
   - Go to your domain registrar
   - Add CNAME records:
     ```
     www → cname.vercel-dns.com
     admin → cname.vercel-dns.com
     ```
   - Add A record for root domain:
     ```
     @ → 76.76.21.21 (Vercel IP)
     ```

### Step 6: Configure External Services

1. **Cloudinary Setup**
   - Create account at [cloudinary.com](https://cloudinary.com)
   - Get cloud name, API key, and API secret
   - Update backend environment variables

2. **SendGrid Setup**
   - Create account at [sendgrid.com](https://sendgrid.com)
   - Create API key with "Mail Send" permission
   - Verify sender email (drmusmang@gmail.com)
   - Update backend environment variables

3. **Google Maps API**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable Maps JavaScript API
   - Create API key with HTTP restrictions
   - Update frontend environment variable

## Option 2: AWS Deployment

### Step 1: Infrastructure Setup

1. **Create AWS Resources**
   ```bash
   # Using AWS CLI or Console
   # 1. Create VPC with public/private subnets
   # 2. Create RDS PostgreSQL instance
   # 3. Create ECS cluster
   # 4. Create Application Load Balancer
   # 5. Create S3 bucket for frontend
   # 6. Create CloudFront distribution
   ```

2. **Database Configuration**
   ```sql
   -- Connect to RDS instance
   psql -h your-rds-endpoint -U postgres -d postgres
    
   -- Create database
   CREATE DATABASE smilecare_prod;
    
   -- Create user with limited privileges
   CREATE USER smilecare_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE smilecare_prod TO smilecare_user;
   ```

### Step 2: Deploy Backend to ECS

1. **Create Dockerfile for Backend**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npx prisma generate
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Create ECS Task Definition**
   ```json
   {
     "family": "smilecare-backend",
     "containerDefinitions": [
       {
         "name": "backend",
         "image": "your-ecr-repo/backend:latest",
         "portMappings": [{"containerPort": 3000}],
         "environment": [...],
         "secrets": [...]
       }
     ]
   }
   ```

3. **Create ECS Service**
   - Configure load balancer
   - Set auto-scaling policies
   - Configure health checks

### Step 3: Deploy Frontend to S3 + CloudFront

1. **Build and Upload Frontend**
   ```bash
   cd frontend
   npm run build
   aws s3 sync dist/ s3://smilecare-frontend-bucket
   ```

2. **Configure CloudFront**
   - Create distribution with S3 origin
   - Configure custom domain
   - Set up SSL certificate with ACM
   - Configure caching policies

### Step 4: Deploy Admin Panel to Amplify

1. **Connect Repository to Amplify**
   - Go to AWS Amplify Console
   - Connect GitHub repository
   - Select `admin` directory
   - Configure build settings

2. **Configure Environment Variables**
   - Set all required environment variables
   - Configure custom domain
   - Set up automatic deployments

## Option 3: Docker Compose Deployment

### Step 1: Prepare Server

1. **Provision VPS**
   ```bash
   # Ubuntu 22.04 LTS recommended
   # Minimum: 2 CPU, 4GB RAM, 50GB SSD
   ```

2. **Install Docker and Docker Compose**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

### Step 2: Create Docker Compose File

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: smilecare_prod
      POSTGRES_USER: smilecare_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://smilecare_user:${DB_PASSWORD}@postgres:5432/smilecare_prod
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  frontend:
    build: ./frontend
    environment:
      VITE_API_URL: http://backend:3000/api
    restart: unless-stopped

  admin:
    build: ./admin
    environment:
      NEXT_PUBLIC_API_URL: http://backend:3000/api
      DATABASE_URL: postgresql://smilecare_user:${DB_PASSWORD}@postgres:5432/smilecare_prod
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - admin
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

### Step 3: Configure Nginx Reverse Proxy

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    upstream frontend {
        server frontend:4173;
    }

    upstream admin {
        server admin:3000;
    }

    server {
        listen 80;
        server_name smilecaredental.com www.smilecaredental.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name smilecaredental.com www.smilecaredental.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    server {
        listen 443 ssl;
        server_name admin.smilecaredental.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        location / {
            proxy_pass http://admin;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### Step 4: Deploy with Docker Compose

1. **Copy project files to server**
   ```bash
   scp -r smilecare-dental-clinic user@server:/opt/
   ```

2. **Set environment variables**
   ```bash
   cd /opt/smilecare-dental-clinic
   cp .env.example .env
   # Edit .env with production values
   ```

3. **Build and start containers**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

## Post-Deployment Configuration

### Step 1: SSL Certificate Setup

**Using Let's Encrypt with Certbot:**
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d smilecaredental.com -d www.smilecaredental.com -d admin.smilecaredental.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Step 2: Database Initialization

1. **Create Admin User**
   ```sql
   INSERT INTO users (email, password_hash, role, is_active)
   VALUES (
   'drmusmang@gmail.com',
     -- Hash of 'ChangeMe123!'
     '$2b$12$YourHashedPasswordHere',
     'super_admin',
     true
   );
   ```

2. **Seed Initial Data**
   ```sql
   -- Insert default services
   INSERT INTO services (name, description, category, duration_minutes, price)
   VALUES 
     ('Dental Cleaning', 'Professional teeth cleaning', 'Preventive', 60, 100.00),
     ('Filling', 'Tooth cavity filling', 'Restorative', 45, 150.00),
     ('Root Canal', 'Root canal treatment', 'Endodontic', 120, 500.00);
   ```

### Step 3: Configure Backups

**Automated PostgreSQL Backups:**
```bash
# Create backup script
cat > /opt/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U smilecare_user smilecare_prod > $BACKUP_DIR/smilecare_$DATE.sql
# Keep only last 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
EOF

# Make executable and schedule with cron
chmod +x /opt/backup.sh
echo "0 2 * * * /opt/backup.sh" | crontab -
```

### Step 4: Monitoring Setup

1. **Install Monitoring Tools**
   ```bash
   # For Docker Compose deployment
   docker run -d \
     --name=grafana \
     -p 3000:3000 \
     grafana/grafana

   docker run -d \
     --name=prometheus \
     -p 9090:9090 \
     -v /opt/prometheus.yml:/etc/prometheus/prometheus.yml \
     prom/prometheus
   ```

2. **Configure Health Checks**
   ```bash
   # Health check endpoint should return 200 OK
   curl -f http://localhost:3000/health || exit 1
   ```

## Maintenance Procedures

### Regular Maintenance Tasks

1. **Daily Tasks**
   ```bash
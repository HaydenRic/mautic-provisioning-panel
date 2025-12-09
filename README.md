# Mautic Tenant Provisioning Panel

A multi-tenant control panel that provisions dedicated Mautic instances per client by integrating with Portainer's API.

## Features

- Multi-tenant management with role-based access control (ADMIN/CLIENT)
- Automated Mautic instance provisioning via Portainer API
- Docker Swarm stack deployment with Traefik reverse proxy integration
- MySQL database per tenant with auto-generated credentials
- Real-time provisioning status and event logging
- Secure session-based authentication

## Tech Stack

- **Framework**: Next.js 13 with TypeScript (App Router)
- **Database**: SQLite with Prisma ORM
- **Container Orchestration**: Portainer + Docker Swarm
- **Reverse Proxy**: Traefik with automatic TLS
- **UI**: Tailwind CSS + shadcn/ui components

## Prerequisites

- Node.js 20 or later
- Portainer instance with API access
- Docker Swarm cluster
- Traefik configured with an external network

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL="file:./dev.db"

# Application
APP_SECRET="your-secure-random-secret"

# Portainer Configuration
PORTAINER_URL="https://portainer.yourdomain.com"
PORTAINER_API_TOKEN="ptr_your_api_token_here"
PORTAINER_ENDPOINT_ID="1"

# Traefik Configuration
TRAEFIK_NETWORK_NAME="traefik-public"
TRAEFIK_TLS_RESOLVER_NAME="letsencrypt"
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Generate Prisma client and initialize database:
```bash
npx prisma generate
npx prisma db push
```

3. Create an admin user (using Prisma Studio or seed script):
```bash
npx prisma studio
```

Create a user with:
- Email: admin@example.com
- Password Hash: (use bcrypt to hash your password)
- Role: ADMIN

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Deployment

### Using Docker

1. Build the Docker image:
```bash
docker build -t mautic-panel:latest .
```

2. Run the container:
```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="file:./prod.db" \
  -e APP_SECRET="your-secret" \
  -e PORTAINER_URL="https://portainer.yourdomain.com" \
  -e PORTAINER_API_TOKEN="ptr_token" \
  -e PORTAINER_ENDPOINT_ID="1" \
  -e TRAEFIK_NETWORK_NAME="traefik-public" \
  -e TRAEFIK_TLS_RESOLVER_NAME="letsencrypt" \
  --name mautic-panel \
  mautic-panel:latest
```

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout current user
- `GET /api/auth/me` - Get current user session

### Tenants
- `GET /api/tenants` - List all tenants
- `POST /api/tenants` - Create new tenant (ADMIN only)
- `GET /api/tenants/[id]` - Get tenant details

## Database Schema

### User
- Role-based access (ADMIN/CLIENT)
- Secure password hashing with bcrypt

### Tenant
- Unique domain and stack configurations
- MySQL credentials per instance
- Status tracking (PENDING/ACTIVE/ERROR)

### TenantEvent
- Audit log for provisioning events
- Timestamped activity tracking

## Portainer Integration

The panel creates Docker Swarm stacks via Portainer API with:

- MySQL 8 database service
- Mautic Apache service
- Persistent volumes for data
- Traefik labels for automatic routing and TLS
- Network isolation with external Traefik network

## Security Considerations

- Passwords hashed with bcrypt (10 rounds)
- HTTP-only session cookies
- API tokens never exposed to frontend
- Admin-only provisioning endpoints
- Domain validation for tenant creation
- YAML sanitization for stack templates

## Troubleshooting

### Portainer Connection Issues
- Verify `PORTAINER_URL` is accessible
- Check API token has correct permissions
- Ensure `PORTAINER_ENDPOINT_ID` matches your Swarm endpoint

### Stack Creation Failures
- Verify Traefik network exists and is external
- Check Docker Swarm is properly initialized
- Review Portainer logs for detailed errors

### Database Issues
- Run `npx prisma db push` to sync schema
- Check `DATABASE_URL` points to correct location
- Ensure write permissions for SQLite file

## License

MIT

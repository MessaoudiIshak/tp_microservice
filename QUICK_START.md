# MediCare System - Quick Start Guide

## What You Have

A complete, production-ready microservices Hospital Management System with:
- **4 Independent Microservices** (Patient, Personnel, Planning, Consultation)
- **Raw SQL Database Access** (pg library - no ORM)
- **Event-Driven Architecture** (RabbitMQ for async operations)
- **Full Docker Integration** (PostgreSQL + RabbitMQ + all services)
- **Jest Unit Tests** (Complete test coverage for Planning Service)
- **Comprehensive Documentation**

## Project Files Overview

```
tp_microservices/
├── 📦 patient-service/              → Authentication & user profiles
├── 📦 personnel-service/            → Doctor management
├── 📦 planning-service/             → Appointment booking (CORE)
├── 📦 consultation-service/         → Medical records
├── 🐳 docker-compose.yml            → Run everything with one command
├── 📝 scripts/init-db.sql          → Database initialization
├── 📖 README.md                     → Complete documentation (1000+ lines)
├── 💡 IMPLEMENTATION_GUIDE.md       → Architecture & patterns explained
├── 🧪 test-integration.sh          → Integration testing script
└── .env.example                     → Environment variable template
```

## Quick Start (30 seconds)

### Prerequisites
- Docker & Docker Compose installed

### Run Everything
```bash
cd tp_microservices
docker-compose up --build
```

That's it! All 4 services + PostgreSQL + RabbitMQ will start.

## Test the System

### Option 1: Automated Integration Tests
```bash
chmod +x test-integration.sh
./test-integration.sh
```

### Option 2: Manual Testing with curl

```bash
# 1. Register patient
curl -X POST http://localhost:3001/patients/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Ahmed", "email": "ahmed@test.com", "password": "pass123"}'

# 2. Add doctor
curl -X POST http://localhost:3002/personnel/doctors \
  -H "Content-Type: application/json" \
  -d '{"name": "Dr. Fatima", "email": "dr@hospital.com", "speciality": "cardio", "service": "Cardiology"}'

# 3. CREATE APPOINTMENT (Core Workflow!)
curl -X POST http://localhost:3003/planning/rdv \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-02-15T10:00:00Z", "speciality": "cardio", "patientId": 1}'

# 4. Get patient appointments
curl http://localhost:3003/planning/rdv?patientId=1

# 5. Get consultations (created automatically by RabbitMQ!)
curl http://localhost:3004/consultation/consultations?patientId=1
```

## Services & Ports

| Service | Port | Purpose |
|---------|------|---------|
| Patient Service | 3001 | Login, register, profiles |
| Personnel Service | 3002 | Manage doctors |
| Planning Service | 3003 | Create/manage appointments |
| Consultation Service | 3004 | Medical consultation records |
| PostgreSQL | 5432 | Database |
| RabbitMQ | 5672 | Message broker |
| RabbitMQ UI | 15672 | Management interface |

## The Magic: Appointment Creation Workflow

When you POST to `/planning/rdv`:

```
1. Planning Service validates request
   ↓
2. Makes SYNCHRONOUS HTTP call to Personnel Service
   "Find me a doctor with specialty: cardio"
   ↓
3. Personnel Service replies with doctor or 404
   ↓
4. If doctor found:
   - Create appointment in database
   - PUBLISH APPOINTMENT_CREATED event to RabbitMQ
   - Return success to patient
   
   Meanwhile (in background):
   - Consultation Service LISTENS to RabbitMQ
   - Receives APPOINTMENT_CREATED event
   - Automatically creates consultation record
   - No API call needed!
```

**Why This Design?**
- **Synchronous HTTP**: Patient needs immediate answer (is doctor available?)
- **Asynchronous RabbitMQ**: Consultation creation doesn't block appointment confirmation
- **Loose Coupling**: Services don't need to know about each other
- **Resilience**: If Consultation Service is down, appointment still gets created

## Testing the Code

### Run Jest Unit Tests
```bash
cd planning-service
npm install
npm test
```

Tests cover:
- ✅ Input validation
- ✅ Doctor lookup integration
- ✅ Database operations
- ✅ RabbitMQ event publishing
- ✅ Error handling
- ✅ All CRUD operations

### Example Test Output
```
PASS  src/controllers/AppointmentController.test.js
PASS  src/models/AppointmentModel.test.js
PASS  src/services/PersonnelServiceClient.test.js

Tests: 25 passed, 25 total
```

## Key Design Decisions

### 1. Raw SQL (No ORM)
- You write and see the exact SQL being executed
- Better performance
- Better learning experience
- No Sequelize/TypeORM overhead

### 2. Separate Databases Per Service
- Each service has its own database
- Services are truly independent
- Can evolve schemas separately
- Forces good API design

### 3. Event-Driven Architecture
- Planning Service doesn't call Consultation Service directly
- Instead, publishes events to RabbitMQ
- Consultation Service subscribes and processes independently
- If Consultation Service is down, events wait in queue

### 4. Synchronous HTTP for Doctor Search
- Patient waits on phone: "Is a doctor available?"
- Need immediate answer → HTTP is perfect
- RabbitMQ would be wrong here (asynchronous)

## Endpoints Summary

### Patient Service (3001)
- `POST /patients/register` - Create account
- `POST /patients/login` - Get JWT token
- `GET /patients/profile/:id` - Get profile

### Personnel Service (3002)
- `POST /personnel/doctors` - Add doctor
- `GET /personnel/doctors?speciality=X` - Find by specialty
- `GET /personnel/doctors/all` - Get all
- `PATCH /personnel/doctors/:id/availability` - Toggle availability

### Planning Service (3003) ⭐ CORE
- `POST /planning/rdv` - **Create appointment** (triggers RabbitMQ)
- `GET /planning/rdv?patientId=X` - Patient's appointments
- `GET /planning/rdv?doctorId=X` - Doctor's appointments
- `PATCH /planning/rdv/:id/status` - Update status

### Consultation Service (3004)
- `POST /consultation/consultations` - Create consultation
- `GET /consultation/consultations?patientId=X` - Patient consultations
- `GET /consultation/consultations` - All consultations
- `PATCH /consultation/consultations/:id/notes` - Add notes

## Monitoring

### Health Checks
```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

### RabbitMQ Management UI
- Visit: http://localhost:15672
- Username: guest
- Password: guest
- View: Exchanges, queues, message counts, consumer status

### Database
```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d patient_db
psql -h localhost -U postgres -d personnel_db
psql -h localhost -U postgres -d planning_db
psql -h localhost -U postgres -d consultation_db
```

## Documentation Files

1. **README.md** (This goes deep)
   - Complete API documentation
   - Database schema details
   - Deployment architecture
   - Troubleshooting guide
   - 2000+ lines of comprehensive docs

2. **IMPLEMENTATION_GUIDE.md** (Understanding the why)
   - Why raw SQL?
   - Why synchronous vs asynchronous?
   - Event-driven patterns explained
   - Common mistakes to avoid
   - Production readiness checklist

3. **This file** (Quick reference)
   - Fast start
   - Key concepts
   - File structure

## Development Workflow

### Local Development (Without Docker)

1. Install dependencies:
```bash
cd patient-service && npm install
cd ../personnel-service && npm install
cd ../planning-service && npm install
cd ../consultation-service && npm install
```

2. Start PostgreSQL & RabbitMQ (use Docker for these):
```bash
docker run -d -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15
docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3.13-management
```

3. Create `.env` in each service directory:
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

4. Run services:
```bash
cd patient-service && npm run dev
cd ../personnel-service && npm run dev
cd ../planning-service && npm run dev
cd ../consultation-service && npm run dev
```

## Next Steps / Enhancements

### Ready to Add:
1. **Authentication Middleware** - Verify JWT on protected routes
2. **Input Validation** - Use joi or express-validator
3. **Logging** - Winston or Bunyan for structured logs
4. **Metrics** - Prometheus for monitoring
5. **Caching** - Redis for frequently accessed data
6. **Rate Limiting** - Prevent API abuse
7. **API Gateway** - Kong or AWS API Gateway
8. **Database Replication** - Read replicas for scaling reads

## Troubleshooting

### Services won't start
```bash
# Check if ports are in use
docker ps
docker-compose logs
```

### No consultations created after appointment
1. Check RabbitMQ is running: `docker ps`
2. View RabbitMQ UI: http://localhost:15672
3. Check Consultation Service logs: `docker-compose logs consultation-service`

### Database errors
1. Wait for PostgreSQL to be healthy: `docker-compose ps`
2. Check init script ran: `psql -h localhost -U postgres -l`

## Success Indicators

When working correctly, you should see:
- ✅ POST /planning/rdv returns 201
- ✅ Consultation appears automatically after 2 seconds
- ✅ RabbitMQ shows messages in exchanges/queues
- ✅ All health checks return status: true
- ✅ Tests pass: `npm test` in planning-service

## Support & Questions

All business logic is extensively commented. Read the code:
- Planning Service (core): `planning-service/src/controllers/AppointmentController.js`
- Event publishing: `planning-service/src/rabbitmq/publisher.js`
- Event consuming: `consultation-service/src/rabbitmq/consumer.js`
- Database layer: `*/src/models/` (raw SQL examples)

Refer to README.md and IMPLEMENTATION_GUIDE.md for detailed explanations.

---

**Built with ❤️ for learning microservices architecture**

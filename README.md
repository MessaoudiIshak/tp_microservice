# MediCare - Hospital Management System (Microservices)

A complete microservices-based Hospital Management System built with Node.js, Express, PostgreSQL, and RabbitMQ.

## System Architecture

The system consists of 4 independent microservices that communicate via HTTP (synchronous) and RabbitMQ (asynchronous):

```
┌─────────────────┐         HTTP         ┌──────────────────┐
│  Patient Service├──────────────────────►│ Planning Service │
│   (Auth)        │                       │  (Appointments)  │
└─────────────────┘                       └────────┬─────────┘
                                                   │ (HTTP)
                                          ┌────────▼─────────┐
                                          │Personnel Service │
                                          │  (Doctors)       │
                                          └──────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    RabbitMQ Message Broker                   │
│  (Topic Exchange: healthcare_events)                         │
└─────────────────────────────┬────────────────────────────────┘
                              │ (APPOINTMENT_CREATED event)
                    ┌─────────▼──────────┐
                    │Consultation Service│
                    │   (RabbitMQ        │
                    │   Consumer)        │
                    └────────────────────┘
```

## Project Structure

```
tp_microservices/
├── patient-service/               # Authentication & Profile Management
│   ├── src/
│   │   ├── controllers/
│   │   │   └── PatientController.js
│   │   ├── models/
│   │   │   └── PatientModel.js
│   │   ├── routes/
│   │   │   └── patientRoutes.js
│   │   ├── db.js
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
│
├── personnel-service/             # Medical Staff Management
│   ├── src/
│   │   ├── controllers/
│   │   │   └── DoctorController.js
│   │   ├── models/
│   │   │   └── DoctorModel.js
│   │   ├── routes/
│   │   │   └── doctorRoutes.js
│   │   ├── db.js
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
│
├── planning-service/              # Appointment Management
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── AppointmentController.js
│   │   │   └── AppointmentController.test.js
│   │   ├── models/
│   │   │   ├── AppointmentModel.js
│   │   │   └── AppointmentModel.test.js
│   │   ├── services/
│   │   │   ├── PersonnelServiceClient.js
│   │   │   └── PersonnelServiceClient.test.js
│   │   ├── rabbitmq/
│   │   │   └── publisher.js
│   │   ├── routes/
│   │   │   └── appointmentRoutes.js
│   │   ├── db.js
│   │   └── index.js
│   ├── Dockerfile
│   ├── jest.config.js
│   └── package.json
│
├── consultation-service/          # Medical Consultation Records
│   ├── src/
│   │   ├── controllers/
│   │   │   └── ConsultationController.js
│   │   ├── models/
│   │   │   └── ConsultationModel.js
│   │   ├── rabbitmq/
│   │   │   └── consumer.js
│   │   ├── routes/
│   │   │   └── consultationRoutes.js
│   │   ├── db.js
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
│
├── scripts/
│   └── init-db.sql               # Database initialization script
│
├── docker-compose.yml            # Docker Compose configuration
└── README.md                      # This file
```

## Microservices Details

### 1. Patient Service (Port 3001)

**Responsibility**: User authentication and patient profile management

**Database Fields**:
- `id` - Primary Key
- `name` - Patient Name
- `email` - Email (Unique)
- `password` - Hashed Password

**Endpoints**:
- `POST /patients/register` - Register a new patient
- `POST /patients/login` - Login and receive JWT token
- `GET /patients/profile/:patientId` - Get patient profile

**Key Technologies**:
- bcryptjs for password hashing
- jsonwebtoken for JWT generation

### 2. Personnel Service (Port 3002)

**Responsibility**: Medical staff management

**Database Fields**:
- `id` - Primary Key
- `name` - Doctor Name
- `email` - Email (Unique)
- `speciality` - Medical Specialty (e.g., cardio, dental)
- `service` - Department
- `available` - Availability Status

**Endpoints**:
- `POST /personnel/doctors` - Create a new doctor
- `GET /personnel/doctors?speciality=X` - Find doctors by specialty
- `GET /personnel/doctors/all` - Get all doctors
- `GET /personnel/doctors/:doctorId` - Get doctor by ID
- `PUT /personnel/doctors/:doctorId` - Update doctor info
- `PATCH /personnel/doctors/:doctorId/availability` - Set availability

### 3. Planning Service (Port 3003)

**Responsibility**: Appointment (RDV - Rendez-vous) management with workflow orchestration

**Database Fields**:
- `id` - Primary Key
- `date` - Appointment Date/Time
- `doctor_id` - Assigned Doctor
- `speciality` - Medical Specialty
- `patient_id` - Patient ID
- `status` - Status (UPCOMING, DONE, CANCELLED)

**Endpoints**:
- `POST /planning/rdv` - Create appointment request
- `GET /planning/rdv?patientId=X` - Get patient appointments
- `GET /planning/rdv?doctorId=X` - Get doctor appointments
- `GET /planning/rdv?status=X` - Get appointments by status
- `GET /planning/rdv/:appointmentId` - Get appointment details
- `PATCH /planning/rdv/:appointmentId/status` - Update appointment status

**Workflow (POST /planning/rdv)**:
1. Patient sends appointment request with `date`, `speciality`, `patientId`
2. Service makes synchronous HTTP call to Personnel Service to find available doctor
3. If no doctor found → return 404 error
4. If doctor found:
   - Create appointment in database with status `UPCOMING`
   - Publish `APPOINTMENT_CREATED` event to RabbitMQ
   - Return confirmation to patient

### 4. Consultation Service (Port 3004)

**Responsibility**: Medical consultation records management

**Database Fields**:
- `id` - Primary Key
- `doctor_id` - Doctor ID
- `patient_id` - Patient ID
- `speciality` - Medical Specialty
- `appointment_id` - Associated Appointment
- `consultation_date` - Consultation Date
- `notes` - Medical Notes

**Endpoints**:
- `POST /consultation/consultations` - Create consultation record
- `GET /consultation/consultations` - Get all consultations
- `GET /consultation/consultations?patientId=X` - Get patient consultations
- `GET /consultation/consultations?doctorId=X` - Get doctor consultations
- `GET /consultation/consultations/:consultationId` - Get consultation details
- `PATCH /consultation/consultations/:consultationId/notes` - Update notes

**RabbitMQ Consumer**:
- Subscribes to `healthcare.appointment_created` events
- Automatically creates consultation record when appointment is created
- Implements error handling with message requeue on failure

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 18 (Alpine) |
| Framework | Express.js | 4.18 |
| Database | PostgreSQL | 15 |
| ORM | Raw SQL (pg library) | - |
| Message Broker | RabbitMQ | 3.13 |
| Testing | Jest | 29.7 |
| Password Hashing | bcryptjs | 2.4 |
| Authentication | JWT | 9.1 |
| HTTP Client | axios | 1.6 |

## Database Schema

### Patient DB
```sql
CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Personnel DB
```sql
CREATE TABLE doctors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  speciality VARCHAR(100) NOT NULL,
  service VARCHAR(100),
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_doctors_speciality ON doctors(speciality);
CREATE INDEX idx_doctors_available ON doctors(available);
```

### Planning DB
```sql
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  date TIMESTAMP NOT NULL,
  doctor_id INT NOT NULL,
  speciality VARCHAR(100) NOT NULL,
  patient_id INT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'UPCOMING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_status ON appointments(status);
```

### Consultation DB
```sql
CREATE TABLE consultations (
  id SERIAL PRIMARY KEY,
  doctor_id INT NOT NULL,
  patient_id INT NOT NULL,
  speciality VARCHAR(100) NOT NULL,
  appointment_id INT NOT NULL,
  consultation_date TIMESTAMP NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX idx_consultations_appointment_id ON consultations(appointment_id);
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- (Optional) Node.js 18+ for local development

### Quick Start with Docker

1. Clone/navigate to the project directory:
```bash
cd tp_microservices
```

2. Start all services with Docker Compose:
```bash
docker-compose up --build
```

This will:
- Create and start PostgreSQL with 4 databases
- Start RabbitMQ with management UI
- Build and start all 4 microservices
- Apply database schema automatically

3. Services will be available at:
- Patient Service: `http://localhost:3001`
- Personnel Service: `http://localhost:3002`
- Planning Service: `http://localhost:3003`
- Consultation Service: `http://localhost:3004`
- RabbitMQ UI: `http://localhost:15672` (guest/guest)
- PostgreSQL: `localhost:5432`

### Local Development

1. Install dependencies for each service:
```bash
cd patient-service && npm install
cd ../personnel-service && npm install
cd ../planning-service && npm install
cd ../consultation-service && npm install
```

2. Create a `.env` file in each service directory:
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=patient_db
JWT_SECRET=your_secret_key
RABBITMQ_URL=amqp://guest:guest@localhost:5672
PERSONNEL_SERVICE_URL=http://localhost:3002
```

3. Start each service:
```bash
npm run dev
```

## Testing

### Run Tests for Planning Service

```bash
cd planning-service
npm test
```

This will run Jest tests for:
- AppointmentController (happy path and edge cases)
- AppointmentModel (CRUD operations)
- PersonnelServiceClient (HTTP integration)

Test coverage includes:
- ✅ Input validation
- ✅ Error handling
- ✅ Database operations
- ✅ External service integration
- ✅ RabbitMQ event publishing
- ✅ Business logic workflow

### Example Test Run
```
PASS  src/controllers/AppointmentController.test.js
PASS  src/models/AppointmentModel.test.js
PASS  src/services/PersonnelServiceClient.test.js

Test Suites: 3 passed, 3 total
Tests: 25 passed, 25 total
```

## API Usage Examples

### 1. Register Patient
```bash
curl -X POST http://localhost:3001/patients/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmed Ali",
    "email": "ahmed@example.com",
    "password": "secure123"
  }'
```

**Response**:
```json
{
  "message": "Patient registered successfully",
  "patient": {
    "id": 1,
    "name": "Ahmed Ali",
    "email": "ahmed@example.com"
  }
}
```

### 2. Login Patient
```bash
curl -X POST http://localhost:3001/patients/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed@example.com",
    "password": "secure123"
  }'
```

**Response**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "patient": {
    "id": 1,
    "name": "Ahmed Ali",
    "email": "ahmed@example.com"
  }
}
```

### 3. Add Doctor
```bash
curl -X POST http://localhost:3002/personnel/doctors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Fatima",
    "email": "fatima@hospital.com",
    "speciality": "cardio",
    "service": "Cardiology"
  }'
```

**Response**:
```json
{
  "message": "Doctor created successfully",
  "doctor": {
    "id": 1,
    "name": "Dr. Fatima",
    "email": "fatima@hospital.com",
    "speciality": "cardio",
    "service": "Cardiology",
    "available": true
  }
}
```

### 4. Find Doctor by Specialty
```bash
curl -X GET "http://localhost:3002/personnel/doctors?speciality=cardio"
```

**Response**:
```json
{
  "doctors": [
    {
      "id": 1,
      "name": "Dr. Fatima",
      "email": "fatima@hospital.com",
      "speciality": "cardio",
      "service": "Cardiology",
      "available": true
    }
  ],
  "count": 1
}
```

### 5. Create Appointment (Core Workflow)
```bash
curl -X POST http://localhost:3003/planning/rdv \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-02-15T10:00:00Z",
    "speciality": "cardio",
    "patientId": 1
  }'
```

**Response**:
```json
{
  "message": "Appointment created successfully",
  "appointment": {
    "id": 1,
    "date": "2026-02-15T10:00:00Z",
    "doctor_id": 1,
    "speciality": "cardio",
    "patient_id": 1,
    "status": "UPCOMING",
    "doctor": {
      "id": 1,
      "name": "Dr. Fatima",
      "speciality": "cardio"
    }
  }
}
```

**What happens internally**:
1. Planning Service queries Personnel Service for available cardio doctors
2. Dr. Fatima is found and appointment is created
3. `APPOINTMENT_CREATED` event is published to RabbitMQ
4. Consultation Service receives event and creates consultation record

### 6. Get Patient Appointments
```bash
curl -X GET "http://localhost:3003/planning/rdv?patientId=1"
```

### 7. Get Consultation Records
```bash
curl -X GET "http://localhost:3004/consultation/consultations?patientId=1"
```

**Response**:
```json
{
  "consultations": [
    {
      "id": 1,
      "doctor_id": 1,
      "patient_id": 1,
      "speciality": "cardio",
      "appointment_id": 1,
      "consultation_date": "2026-02-15T10:00:00Z",
      "notes": null
    }
  ],
  "count": 1
}
```

## RabbitMQ Event Flow

### Event: APPOINTMENT_CREATED

**Publisher**: Planning Service (after creating appointment)

**Topic**: `healthcare.appointment_created`

**Payload**:
```json
{
  "type": "APPOINTMENT_CREATED",
  "timestamp": "2026-02-05T10:30:00.000Z",
  "payload": {
    "appointmentId": 1,
    "rdvId": 1,
    "doctorId": 1,
    "doctorName": "Dr. Fatima",
    "patientId": 1,
    "speciality": "cardio",
    "date": "2026-02-15T10:00:00Z",
    "status": "UPCOMING"
  }
}
```

**Subscribers**: Consultation Service

**Action**: Creates consultation record in consultation_db

## Deployment Architecture

The `docker-compose.yml` file defines:

- **PostgreSQL**: Single instance with 4 separate databases
  - Health check: pg_isready
  - Volume: postgres_data
  - Network: medicare_network

- **RabbitMQ**: Message broker with management UI
  - Health check: rabbitmq-diagnostics ping
  - Volume: rabbitmq_data
  - Ports: 5672 (AMQP), 15672 (Management)

- **4 Microservices**: Each with:
  - Automatic health checks
  - Environment variable injection
  - Network communication via service names
  - Dependency management (waits for DB/RabbitMQ)

## Key Design Decisions

### 1. Raw SQL vs ORM
**Reason**: Fine-grained control, no abstraction overhead, direct database operations for educational clarity.

### 2. Synchronous HTTP for Doctor Search
**Reason**: Patients waiting on the phone need immediate answer. HTTP request/response is synchronous and fast.

### 3. Asynchronous RabbitMQ for Consultation Creation
**Reason**: Consultation creation doesn't need to block the patient's appointment confirmation. Event-driven decouples services and enables independent scaling.

### 4. Event-Driven Architecture
**Reason**: 
- Planning Service doesn't need to know about Consultation Service
- Services can be deployed/scaled independently
- Easy to add more event subscribers (e.g., Notification Service)
- Resilience: if Consultation Service is down, appointments still get created

### 5. Separate Databases per Service
**Reason**: Database independence allows each service to evolve schema independently without affecting others.

## Error Handling

### Common Error Scenarios

**400 - Bad Request**:
- Missing required fields
- Invalid appointment status
- Invalid date format

**404 - Not Found**:
- Doctor not available for specialty
- Patient/Doctor/Appointment not found
- Consultation not found

**409 - Conflict**:
- Patient already exists
- Consultation already exists for appointment

**500 - Internal Server Error**:
- Database connection issues
- RabbitMQ connection issues
- Unexpected server errors

## Monitoring & Health Checks

Health check endpoints for monitoring:
- `GET http://localhost:3001/health` - Patient Service
- `GET http://localhost:3002/health` - Personnel Service
- `GET http://localhost:3003/health` - Planning Service
- `GET http://localhost:3004/health` - Consultation Service

RabbitMQ Management UI:
- URL: `http://localhost:15672`
- Credentials: guest/guest
- View exchanges, queues, message counts

## Scalability Considerations

1. **Horizontal Scaling**: Each service can be scaled independently
2. **Database Connection Pooling**: pg library with connection pool
3. **RabbitMQ Queues**: Persistent messages survive service restarts
4. **Load Balancing**: Add reverse proxy (nginx) in front of services
5. **Caching**: Add Redis for frequently accessed data
6. **Monitoring**: Add ELK stack for logs and metrics

## Troubleshooting

### Services can't connect to database
- Check PostgreSQL container is running: `docker ps`
- Verify environment variables match docker-compose.yml
- Check network: `docker network ls`

### RabbitMQ connection errors
- Ensure RabbitMQ container is healthy: `docker-compose ps`
- Check RABBITMQ_URL format (should be amqp://...)
- View RabbitMQ logs: `docker logs medicare_rabbitmq`

### Appointment doesn't create consultation
- Check RabbitMQ logs for message delivery
- Verify Consultation Service is consuming
- Check consultation_db tables exist

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Use raw SQL in models
3. Publish events for data changes affecting other services
4. Update this README with new endpoints

## License

MIT License - Hospital Management System 2026

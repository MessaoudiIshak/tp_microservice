# MediCare Implementation Guide

## Strategy Overview

This document explains the architectural decisions and patterns used in the MediCare system.

## 1. Why Raw SQL Instead of ORM?

### The Problem with ORMs in Microservices

ORMs like Sequelize or TypeORM are powerful, but they:
- Add abstraction layers that hide what's happening in the database
- Generate inefficient queries
- Make it harder to optimize for performance
- Bind you to the ORM's patterns and conventions

### Our Approach: Raw SQL with `pg` Library

```javascript
// ✅ GOOD: Direct, explicit SQL
const query = `
  INSERT INTO doctors (name, email, speciality, service, available)
  VALUES ($1, $2, $3, $4, TRUE)
  RETURNING id, name, email, speciality, service, available
`;
const result = await pool.query(query, [name, email, speciality, service]);
return result.rows[0];
```

**Benefits**:
1. **Clarity**: You see exactly what SQL is being executed
2. **Performance**: No ORM overhead, parameterized queries prevent SQL injection
3. **Efficiency**: Returns only needed fields with RETURNING clause
4. **Learning**: Understand database operations at the SQL level

## 2. Synchronous HTTP vs Asynchronous Events

### The Problem

When a patient requests an appointment, we need the answer immediately. If we made this asynchronous:
- Patient would wait indefinitely for confirmation
- Bad user experience

### The Solution: Hybrid Approach

**Synchronous HTTP** (Planning → Personnel):
```
Patient: "I want a cardio appointment"
Planning Service:
  1. Makes synchronous HTTP call to Personnel Service
  2. Waits for response
  3. If doctor found → continues to step 4
  4. If no doctor → returns 404 immediately
  
Timeline: 100ms total (instant feedback to patient)
```

**Asynchronous RabbitMQ** (Planning → Consultation):
```
Planning Service:
  1. Creates appointment
  2. Publishes APPOINTMENT_CREATED event to RabbitMQ
  3. Returns immediately to patient
  
Consultation Service (listening):
  1. Receives event
  2. Creates consultation record
  3. No time pressure - can retry if database is slow
  
Timeline: Decoupled - can happen in 10ms or 10 seconds
```

### Why This Works

```
Synchronous (HTTP):
Planning ----[HTTP]----> Personnel
  ↓
  [Wait for response]
  ↓
  [Create appointment]
  
Asynchronous (RabbitMQ):
Planning: [Create appointment] → [Publish event] → [Return to patient]
         
         RabbitMQ Queue
         ↓
      [APPOINTMENT_CREATED event]
         ↓
      Consultation Service subscribes
         ↓
      [Create consultation record]
```

## 3. Event-Driven Architecture Pattern

### The Key Insight

**Tight Coupling Problem** (Bad):
```
Planning Service -----[Direct Call]----→ Consultation Service
"Hey, create a consultation for this appointment!"
```

If Consultation Service is down → Appointment creation fails ❌

**Loose Coupling Solution** (Good):
```
Planning Service → [APPOINTMENT_CREATED Event] → RabbitMQ Message Queue
                                                       ↓
                                                  Consultation Service
                                                  (subscribes when ready)
```

If Consultation Service is down → Event stays in queue → Consultation Service catches up when it restarts ✅

### Event Flow in MediCare

```javascript
// Step 1: Planning Service publishes event (src/rabbitmq/publisher.js)
await publisher.publishEvent('APPOINTMENT_CREATED', {
  appointmentId: 1,
  rdvId: 1,
  doctorId: 1,
  patientId: 5,
  speciality: 'cardio',
  date: '2026-02-15T10:00:00Z',
  status: 'UPCOMING',
});

// Step 2: Event goes to RabbitMQ Topic Exchange
// Topic: healthcare_events
// Routing Key: healthcare.appointment_created
// Exchange Type: topic (allows wildcards like healthcare.*)

// Step 3: Consultation Service consumer listens
await channel.bindQueue(queue.queue, exchangeName, 'healthcare.appointment_created');

await channel.consume(queue.queue, async (msg) => {
  if (msg) {
    const event = JSON.parse(msg.content.toString());
    
    if (event.type === 'APPOINTMENT_CREATED') {
      // Create consultation record
      await ConsultationModel.createConsultation(...);
    }
    
    // Acknowledge message
    channel.ack(msg);
  }
});
```

## 4. Database Independence Pattern

Each microservice has its own database:

```
┌──────────────────┐    ┌──────────────────┐
│ patient_db       │    │ personnel_db     │
│ ├─ patients      │    │ ├─ doctors       │
└──────────────────┘    └──────────────────┘

┌──────────────────┐    ┌──────────────────┐
│ planning_db      │    │ consultation_db  │
│ ├─ appointments  │    │ ├─ consultations │
└──────────────────┘    └──────────────────┘
```

### Why Separate Databases?

1. **Independent Evolution**: Each service can change schema without affecting others
   ```sql
   -- Planning can add new column without touching personnel_db
   ALTER TABLE appointments ADD COLUMN notes TEXT;
   ```

2. **Separate Scaling**: Can scale database connections per service
   ```javascript
   // Personnel Service gets heavy traffic of doctor searches
   // Can scale to dedicated PostgreSQL instance
   // Patient Service remains on shared instance
   ```

3. **Data Consistency**: No cross-database joins (forces good design)
   - Services must communicate via API
   - Encourages caching of frequently needed data

## 5. Appointment Creation Workflow (Core Logic)

This is the most important workflow in the system:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    POST /planning/rdv                                │
│                                                                       │
│ 1. VALIDATE: Check date, speciality, patientId provided             │
│    ↓                                                                  │
│ 2. SYNC HTTP CALL: Call Personnel Service                           │
│    GET /personnel/doctors?speciality=cardio                         │
│    ↓                                                                  │
│ 3. CHECK RESPONSE:                                                   │
│    ├─ No doctors found → Return 404 error                           │
│    └─ Doctor found → Continue to step 4                             │
│    ↓                                                                  │
│ 4. CREATE APPOINTMENT: Insert into planning_db.appointments         │
│    Status = 'UPCOMING'                                               │
│    ↓                                                                  │
│ 5. PUBLISH EVENT: Send APPOINTMENT_CREATED to RabbitMQ             │
│    Exchange: healthcare_events                                       │
│    Routing Key: healthcare.appointment_created                      │
│    ↓                                                                  │
│ 6. RETURN SUCCESS: 201 with appointment details                     │
│                                                                       │
│ [Consultation Service listens and creates record asynchronously]    │
└─────────────────────────────────────────────────────────────────────┘
```

### Code Implementation

```javascript
async createAppointment(req, res) {
  // Step 1: Validate input
  const { date, speciality, patientId } = req.body;
  if (!date || !speciality || !patientId) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Step 2: Call Personnel Service (SYNCHRONOUS)
  const doctor = await PersonnelServiceClient.findDoctorBySpeciality(speciality);

  // Step 3: Check if doctor found
  if (!doctor) {
    return res.status(404).json({ error: 'No doctor available' });
  }

  // Step 4: Create appointment
  const appointment = await AppointmentModel.createAppointment(
    date,
    doctor.id,
    speciality,
    patientId,
    'UPCOMING'
  );

  // Step 5: Publish event (ASYNCHRONOUS)
  await publisher.publishEvent('APPOINTMENT_CREATED', {
    appointmentId: appointment.id,
    rdvId: appointment.id,
    doctorId: doctor.id,
    patientId: patientId,
    speciality: speciality,
    date: date,
    status: 'UPCOMING',
  });

  // Step 6: Return success
  res.status(201).json({
    message: 'Appointment created successfully',
    appointment: { ...appointment, doctor }
  });
}
```

## 6. Error Handling Patterns

### Level 1: Input Validation
```javascript
if (!date || !speciality || !patientId) {
  return res.status(400).json({ error: 'Date, speciality, and patientId are required' });
}
```

### Level 2: Service Integration Errors
```javascript
try {
  const doctor = await PersonnelServiceClient.findDoctorBySpeciality(speciality);
} catch (error) {
  return res.status(500).json({ error: 'Unable to fetch doctors from Personnel Service' });
}
```

### Level 3: Database Errors
```javascript
try {
  const result = await pool.query(query, [values]);
} catch (error) {
  console.error('Database error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}
```

### Level 4: RabbitMQ Error Handling
```javascript
// Message doesn't get acknowledged if error occurs
// RabbitMQ will requeue it automatically
await channel.consume(queue.queue, async (msg) => {
  try {
    await handleAppointmentCreated(event.payload);
    channel.ack(msg);  // ✅ Success - acknowledge
  } catch (error) {
    console.error('Error:', error);
    channel.nack(msg, false, true);  // ❌ Failed - requeue
  }
});
```

## 7. Authentication Pattern (JWT)

Patient Service uses JWT for stateless authentication:

```javascript
// Login: Generate token
const token = jwt.sign(
  { id: patient.id, email: patient.email, name: patient.name },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Client stores token and sends with requests
// Authorization: Bearer <token>

// Future: Add auth middleware to Planning Service
// const decoded = jwt.verify(token, process.env.JWT_SECRET);
// patientId = decoded.id;
```

## 8. Testing Strategy

### Unit Tests
Mock external dependencies:

```javascript
jest.mock('../src/services/PersonnelServiceClient');

it('should return 404 if no doctor found', async () => {
  PersonnelServiceClient.findDoctorBySpeciality.mockResolvedValue(null);
  
  await AppointmentController.createAppointment(mockReq, mockRes);
  
  expect(mockRes.status).toHaveBeenCalledWith(404);
});
```

### Integration Tests (Manual with curl)

```bash
# 1. Create doctor
curl -X POST http://localhost:3002/personnel/doctors \
  -d '{"name": "Dr. Ahmed", "speciality": "cardio"}'

# 2. Create appointment
curl -X POST http://localhost:3003/planning/rdv \
  -d '{"date": "2026-02-15T10:00:00Z", "speciality": "cardio", "patientId": 1}'

# 3. Verify consultation created
curl -X GET http://localhost:3004/consultation/consultations?patientId=1
```

## 9. Docker Compose Strategy

```yaml
# Wait for dependencies
planning-service:
  depends_on:
    postgres:
      condition: service_healthy
    rabbitmq:
      condition: service_healthy

# Health checks ensure service is ready
postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 10s
    timeout: 5s
    retries: 5

rabbitmq:
  healthcheck:
    test: rabbitmq-diagnostics -q ping
    interval: 30s
    timeout: 10s
    retries: 5
```

## 10. Production Readiness Checklist

### Current Implementation
- ✅ Raw SQL with parameterized queries (prevents SQL injection)
- ✅ Error handling at multiple levels
- ✅ Environment variables for configuration
- ✅ Docker containerization
- ✅ Health check endpoints
- ✅ Graceful shutdown handling
- ✅ RabbitMQ message persistence

### Before Production
- ❌ Add authentication/authorization middleware
- ❌ Add request validation (joi/express-validator)
- ❌ Add logging (winston/bunyan)
- ❌ Add monitoring/metrics (prometheus)
- ❌ Add API rate limiting
- ❌ Add CORS security headers
- ❌ Use HTTPS/TLS
- ❌ Database connection pooling optimization
- ❌ Add database backups
- ❌ Add load balancer (nginx/HAProxy)
- ❌ Add caching layer (Redis)
- ❌ Add database read replicas
- ❌ Implement circuit breaker pattern for HTTP calls

## 11. Common Mistakes to Avoid

### ❌ Mistake 1: Direct Database Calls Between Services
```javascript
// BAD - Tight coupling, database schema dependency
const sql = `SELECT * FROM personnel_db.doctors WHERE speciality = $1`;
```

**Solution**: Use HTTP API
```javascript
// GOOD - Loosely coupled, via API
const response = await axios.get(`${baseURL}/personnel/doctors`, { params: { speciality } });
```

### ❌ Mistake 2: Synchronous Wait for Asynchronous Operations
```javascript
// BAD - Waiting for event processing defeats the purpose
await publishEvent('APPOINTMENT_CREATED', data);
await sleep(2000);  // Wait for Consultation Service
```

**Solution**: Trust the queue
```javascript
// GOOD - Return immediately, event processing happens in background
await publishEvent('APPOINTMENT_CREATED', data);
res.status(201).json(appointment);  // Return immediately
```

### ❌ Mistake 3: No Error Handling for External Services
```javascript
// BAD - Crashes if Personnel Service is down
const doctor = await PersonnelServiceClient.findDoctorBySpeciality(speciality);
```

**Solution**: Graceful error handling
```javascript
// GOOD - Returns meaningful error
try {
  const doctor = await PersonnelServiceClient.findDoctorBySpeciality(speciality);
  if (!doctor) throw new Error(`No doctor available for ${speciality}`);
} catch (error) {
  return res.status(503).json({ error: 'Service unavailable. Please try again.' });
}
```

### ❌ Mistake 4: Storing Other Service's Data
```javascript
// BAD - Storing doctor details in appointments table
const appointment = {
  id: 1,
  doctorId: 1,
  doctorName: 'Dr. Ahmed',  // Don't store!
  doctorSpeciality: 'cardio' // Store only the reference
};
```

**Solution**: Store only references
```javascript
// GOOD - Store only IDs, query for details when needed
const appointment = {
  id: 1,
  doctor_id: 1,  // Reference only
  speciality: 'cardio'  // Denormalized for performance
};

// When you need doctor name, call Personnel Service
const doctor = await PersonnelServiceClient.getDoctorById(appointment.doctor_id);
```

## Conclusion

MediCare demonstrates enterprise microservices patterns:
1. **Synchronous** communication for immediate responses (HTTP)
2. **Asynchronous** communication for independent operations (RabbitMQ)
3. **Raw SQL** for direct database control
4. **Event-driven** architecture for loose coupling
5. **Database independence** for service autonomy
6. **Error handling** at every level

These patterns make the system:
- **Scalable**: Services can be deployed independently
- **Resilient**: Failures are isolated
- **Maintainable**: Clear separation of concerns
- **Testable**: Dependencies can be mocked
- **Understandable**: Explicit business logic

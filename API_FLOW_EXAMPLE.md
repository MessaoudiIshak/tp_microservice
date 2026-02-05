# MediCare Complete API Flow Example

This document demonstrates the entire appointment creation workflow with real API calls and responses.

## Scenario: Patient Ahmed books a cardiology appointment

### Step 1: Patient Registers

**Request:**
```bash
curl -X POST http://localhost:3001/patients/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmed Ali",
    "email": "ahmed@patient.com",
    "password": "SecurePassword123"
  }'
```

**Response (201 Created):**
```json
{
  "message": "Patient registered successfully",
  "patient": {
    "id": 1,
    "name": "Ahmed Ali",
    "email": "ahmed@patient.com"
  }
}
```

### Step 2: Patient Logs In

**Request:**
```bash
curl -X POST http://localhost:3001/patients/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed@patient.com",
    "password": "SecurePassword123"
  }'
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhaG1lZEBwYXRpZW50LmNvbSIsIm5hbWUiOiJBaG1lZCBBbGkiLCJpYXQiOjE2NzQ5NzY4NTYsImV4cCI6MTY3NTA2MzI1Nn0.h3kL9f2m1n...",
  "patient": {
    "id": 1,
    "name": "Ahmed Ali",
    "email": "ahmed@patient.com"
  }
}
```

**Note:** Save this token for future authenticated requests.

---

### Step 3: Hospital Admin Adds Cardiologist

**Request:**
```bash
curl -X POST http://localhost:3002/personnel/doctors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Fatima Al-Rashid",
    "email": "fatima@hospital.com",
    "speciality": "cardio",
    "service": "Cardiology Department"
  }'
```

**Response (201 Created):**
```json
{
  "message": "Doctor created successfully",
  "doctor": {
    "id": 1,
    "name": "Dr. Fatima Al-Rashid",
    "email": "fatima@hospital.com",
    "speciality": "cardio",
    "service": "Cardiology Department",
    "available": true
  }
}
```

### Step 4: Verify Doctor is Available

**Request:**
```bash
curl -X GET "http://localhost:3002/personnel/doctors?speciality=cardio"
```

**Response (200 OK):**
```json
{
  "doctors": [
    {
      "id": 1,
      "name": "Dr. Fatima Al-Rashid",
      "email": "fatima@hospital.com",
      "speciality": "cardio",
      "service": "Cardiology Department",
      "available": true
    }
  ],
  "count": 1
}
```

---

### Step 5: **THE CORE WORKFLOW** - Patient Books Appointment

Ahmed needs a cardiology appointment on February 15, 2026 at 10:00 AM.

**Request:**
```bash
curl -X POST http://localhost:3003/planning/rdv \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-02-15T10:00:00Z",
    "speciality": "cardio",
    "patientId": 1
  }'
```

**What Happens Behind the Scenes:**

1. **Planning Service Receives Request**
   ```
   ✓ Validates: date, speciality, patientId present
   ```

2. **Planning Service Calls Personnel Service** (Synchronous HTTP)
   ```
   GET /personnel/doctors?speciality=cardio
   → Response: Dr. Fatima found ✓
   ```

3. **If Doctor Not Found** → Return 404
   ```json
   { "error": "No available doctor found for speciality: cardio" }
   ```

4. **Since Doctor Found:**
   - Create appointment in `planning_db.appointments`
   - Status: UPCOMING
   - Doctor ID: 1
   - Patient ID: 1

5. **Publish Event to RabbitMQ**
   ```json
   {
     "type": "APPOINTMENT_CREATED",
     "timestamp": "2026-02-05T10:30:45.000Z",
     "payload": {
       "appointmentId": 1,
       "rdvId": 1,
       "doctorId": 1,
       "doctorName": "Dr. Fatima Al-Rashid",
       "patientId": 1,
       "speciality": "cardio",
       "date": "2026-02-15T10:00:00Z",
       "status": "UPCOMING"
     }
   }
   ```

6. **Return Success to Patient**

**Response (201 Created):**
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
      "name": "Dr. Fatima Al-Rashid",
      "speciality": "cardio"
    }
  }
}
```

**⏱️ Total Response Time: ~100ms** (Patient gets immediate confirmation!)

---

### Step 6: Consultation Service Automatically Processes Event

**What Happens Asynchronously (in background):**

1. **Consultation Service is Listening on RabbitMQ**
   ```javascript
   // Subscribed to: healthcare_events exchange
   // Routing key: healthcare.appointment_created
   ```

2. **Receives APPOINTMENT_CREATED Event** (~10-100ms later)
   ```
   Message pulled from queue
   ↓
   Parsed JSON
   ↓
   Event type verified: APPOINTMENT_CREATED ✓
   ```

3. **Creates Consultation Record**
   ```sql
   INSERT INTO consultations (
     doctor_id, patient_id, speciality, 
     appointment_id, consultation_date
   ) VALUES (
     1, 1, 'cardio', 1, '2026-02-15T10:00:00Z'
   )
   RETURNING *
   ```

4. **Result in consultation_db**
   ```
   ✓ Consultation ID: 1
   ✓ Doctor ID: 1
   ✓ Patient ID: 1
   ✓ Appointment ID: 1
   ✓ Consultation Date: 2026-02-15T10:00:00Z
   ```

5. **Acknowledges Message**
   ```
   RabbitMQ removes message from queue
   ✓ Message processed successfully
   ```

**⏱️ Time to Process: ~50ms**

---

### Step 7: Verify Appointment Was Created

**Request:**
```bash
curl -X GET "http://localhost:3003/planning/rdv?patientId=1"
```

**Response (200 OK):**
```json
{
  "appointments": [
    {
      "id": 1,
      "date": "2026-02-15T10:00:00Z",
      "doctor_id": 1,
      "speciality": "cardio",
      "patient_id": 1,
      "status": "UPCOMING"
    }
  ],
  "count": 1
}
```

### Step 8: Verify Consultation Was Created Automatically

**Request:**
```bash
curl -X GET "http://localhost:3004/consultation/consultations?patientId=1"
```

**Response (200 OK):**
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

**Magic:** 🎉 Consultation was created automatically by the RabbitMQ event!

---

## Step 9: Doctor Views Patient Appointments

**Request:**
```bash
curl -X GET "http://localhost:3003/planning/rdv?doctorId=1"
```

**Response (200 OK):**
```json
{
  "appointments": [
    {
      "id": 1,
      "date": "2026-02-15T10:00:00Z",
      "doctor_id": 1,
      "speciality": "cardio",
      "patient_id": 1,
      "status": "UPCOMING"
    }
  ],
  "count": 1
}
```

---

## Step 10: Doctor Adds Consultation Notes

After the appointment, Dr. Fatima adds notes:

**Request:**
```bash
curl -X PATCH http://localhost:3004/consultation/consultations/1/notes \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Patient shows signs of mild hypertension. Recommended lifestyle changes and follow-up in 3 months. Prescribed amlodipine 5mg once daily."
  }'
```

**Response (200 OK):**
```json
{
  "message": "Consultation notes updated",
  "consultation": {
    "id": 1,
    "doctor_id": 1,
    "patient_id": 1,
    "speciality": "cardio",
    "appointment_id": 1,
    "consultation_date": "2026-02-15T10:00:00Z",
    "notes": "Patient shows signs of mild hypertension. Recommended lifestyle changes and follow-up in 3 months. Prescribed amlodipine 5mg once daily."
  }
}
```

---

## Step 11: Mark Appointment as Complete

**Request:**
```bash
curl -X PATCH http://localhost:3003/planning/rdv/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "DONE"}'
```

**Response (200 OK):**
```json
{
  "message": "Appointment status updated",
  "appointment": {
    "id": 1,
    "date": "2026-02-15T10:00:00Z",
    "doctor_id": 1,
    "speciality": "cardio",
    "patient_id": 1,
    "status": "DONE"
  }
}
```

---

## Complete Timeline

```
T=0ms:     Patient posts to /planning/rdv
           ↓
T=10ms:    Planning Service validates input ✓
           ↓
T=20ms:    Planning Service calls Personnel Service
           ← Personnel Service responds with Dr. Fatima ✓
           ↓
T=50ms:    Appointment created in database ✓
           ↓
T=60ms:    APPOINTMENT_CREATED event published to RabbitMQ ✓
           ↓
T=100ms:   Response returned to patient ✓
           [Patient gets confirmation: "Appointment booked!"]
           
           MEANWHILE (Asynchronously):
           
T=110ms:   Consultation Service receives event from RabbitMQ
           ↓
T=130ms:   Consultation record created in database ✓
           ↓
T=140ms:   Message acknowledged to RabbitMQ ✓
```

---

## Error Scenarios

### Scenario 1: No Available Doctor

**Request:**
```bash
curl -X POST http://localhost:3003/planning/rdv \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-02-15T10:00:00Z",
    "speciality": "neurology",
    "patientId": 1
  }'
```

**Response (404 Not Found):**
```json
{
  "error": "No available doctor found for speciality: neurology"
}
```

**Why:** No doctor with neurology speciality exists or all are unavailable.

---

### Scenario 2: Missing Required Fields

**Request:**
```bash
curl -X POST http://localhost:3003/planning/rdv \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-02-15T10:00:00Z"
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "Date, speciality, and patientId are required"
}
```

---

### Scenario 3: Invalid Status Update

**Request:**
```bash
curl -X PATCH http://localhost:3003/planning/rdv/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "PENDING"}'
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid status. Must be one of: UPCOMING, DONE, CANCELLED"
}
```

**Valid statuses:** UPCOMING, DONE, CANCELLED

---

## Summary: The Flow

```
┌─────────────────────────────────────────────────────────────┐
│  PATIENT FLOW                                               │
├─────────────────────────────────────────────────────────────┤
│ 1. Register (Patient Service)                              │
│ 2. Login (Patient Service) → Get JWT Token                 │
│ 3. Book Appointment (Planning Service)                     │
│    - Planning queries Personnel Service (sync HTTP)        │
│    - Gets doctor info                                      │
│    - Creates appointment                                   │
│    - Publishes event to RabbitMQ                          │
│    - Returns confirmation (100ms response)                 │
│ 4. Get appointment details (Planning Service)              │
│ 5. Get consultation records (Consultation Service)         │
│    - Records created automatically by RabbitMQ event!      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  DOCTOR FLOW                                                │
├─────────────────────────────────────────────────────────────┤
│ 1. Doctor created (Personnel Service)                      │
│ 2. View appointments (Planning Service)                    │
│ 3. View patient consultations (Consultation Service)       │
│ 4. Add consultation notes (Consultation Service)           │
│ 5. Mark appointment as done (Planning Service)             │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Insights

1. **Synchronous HTTP** (Planning → Personnel)
   - Patient needs immediate answer
   - "Is a doctor available?" → Yes/No in 50ms

2. **Asynchronous RabbitMQ** (Planning → Consultation)
   - Consultation creation doesn't block patient response
   - Event stays in queue if service is down
   - Automatic recovery when service restarts

3. **Database Independence**
   - Each service has separate database
   - No cross-database dependencies
   - Services can be deployed independently

4. **Event-Driven Decoupling**
   - Planning Service doesn't call Consultation Service directly
   - Just publishes event to RabbitMQ
   - Consultation Service subscribes and processes
   - Easy to add new services (Notification Service, etc.)

---

This demonstrates enterprise-grade microservices architecture! 🚀

-- Create databases for each microservice
CREATE DATABASE patient_db;
CREATE DATABASE personnel_db;
CREATE DATABASE planning_db;
CREATE DATABASE consultation_db;

-- Patient Service Tables
\c patient_db;

CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personnel Service Tables
\c personnel_db;

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

-- Planning Service Tables
\c planning_db;

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

-- Consultation Service Tables
\c consultation_db;

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

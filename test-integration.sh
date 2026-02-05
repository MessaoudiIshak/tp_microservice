#!/bin/bash

# Medicare Hospital Management System - Testing Script
# Tests the complete workflow end-to-end

echo "================================"
echo "MediCare System Integration Test"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PATIENT_API="http://localhost:3001"
PERSONNEL_API="http://localhost:3002"
PLANNING_API="http://localhost:3003"
CONSULTATION_API="http://localhost:3004"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to make requests
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_status=$4
  local description=$5

  echo -e "${YELLOW}Testing: $description${NC}"
  
  if [ -n "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X $method "$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  else
    response=$(curl -s -w "\n%{http_code}" -X $method "$endpoint" \
      -H "Content-Type: application/json")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" == "$expected_status" ]; then
    echo -e "${GREEN}✓ PASSED (HTTP $http_code)${NC}"
    echo "Response: $body"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ FAILED (Expected $expected_status, got $http_code)${NC}"
    echo "Response: $body"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  echo ""
}

# 1. Test Patient Service - Register
echo -e "${YELLOW}=== PATIENT SERVICE TESTS ===${NC}"
test_endpoint "POST" "$PATIENT_API/patients/register" \
  '{"name": "Ahmed Ali", "email": "ahmed@test.com", "password": "password123"}' \
  "201" \
  "Register new patient"

# 2. Test Patient Service - Login
test_endpoint "POST" "$PATIENT_API/patients/login" \
  '{"email": "ahmed@test.com", "password": "password123"}' \
  "200" \
  "Patient login"

# 3. Test Personnel Service - Create Doctor
echo -e "${YELLOW}=== PERSONNEL SERVICE TESTS ===${NC}"
test_endpoint "POST" "$PERSONNEL_API/personnel/doctors" \
  '{"name": "Dr. Fatima", "email": "fatima@hospital.com", "speciality": "cardio", "service": "Cardiology"}' \
  "201" \
  "Create doctor"

# 4. Test Personnel Service - Find doctors by specialty
test_endpoint "GET" "$PERSONNEL_API/personnel/doctors?speciality=cardio" \
  "" \
  "200" \
  "Find doctors by specialty"

# 5. Test Planning Service - Create Appointment
echo -e "${YELLOW}=== PLANNING SERVICE TESTS ===${NC}"
test_endpoint "POST" "$PLANNING_API/planning/rdv" \
  '{"date": "2026-02-15T10:00:00Z", "speciality": "cardio", "patientId": 1}' \
  "201" \
  "Create appointment (triggers RabbitMQ event)"

# 6. Test Planning Service - Get appointments for patient
test_endpoint "GET" "$PLANNING_API/planning/rdv?patientId=1" \
  "" \
  "200" \
  "Get patient appointments"

# 7. Test Consultation Service - Get consultations
echo -e "${YELLOW}=== CONSULTATION SERVICE TESTS ===${NC}"
# Wait for RabbitMQ event processing
echo "Waiting 2 seconds for RabbitMQ event processing..."
sleep 2

test_endpoint "GET" "$CONSULTATION_API/consultation/consultations?patientId=1" \
  "" \
  "200" \
  "Get patient consultations (should be created by RabbitMQ event)"

# 8. Test error cases
echo -e "${YELLOW}=== ERROR HANDLING TESTS ===${NC}"
test_endpoint "POST" "$PLANNING_API/planning/rdv" \
  '{"date": "2026-02-15T10:00:00Z", "speciality": "invalid_specialty", "patientId": 999}' \
  "404" \
  "Create appointment with non-existent specialty (should fail)"

test_endpoint "POST" "$PATIENT_API/patients/register" \
  '{"name": "Test", "email": "ahmed@test.com"}' \
  "400" \
  "Register with missing password (should fail)"

# Summary
echo ""
echo "================================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo "================================"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
fi

const ConsultationModel = require('../src/models/ConsultationModel');
const db = require('../src/db');

jest.mock('../src/db');

describe('Consultation Service - Consultation Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createConsultation', () => {
    it('should create a new consultation', async () => {
      const mockConsultation = {
        id: 1,
        doctor_id: 1,
        patient_id: 1,
        speciality: 'cardio',
        appointment_id: 1,
        consultation_date: '2024-01-15T10:00:00Z',
        notes: null,
      };

      db.query.mockResolvedValue({
        rows: [mockConsultation],
      });

      const result = await ConsultationModel.createConsultation(1, 1, 'cardio', 1);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO consultations'),
        [1, 1, 'cardio', 1]
      );

      expect(result).toEqual(mockConsultation);
    });

    it('should set consultation_date to current time', async () => {
      const mockConsultation = {
        id: 1,
        doctor_id: 2,
        patient_id: 3,
        speciality: 'dental',
        appointment_id: 5,
        consultation_date: expect.any(String),
        notes: null,
      };

      db.query.mockResolvedValue({
        rows: [mockConsultation],
      });

      await ConsultationModel.createConsultation(2, 3, 'dental', 5);

      expect(db.query).toHaveBeenCalled();
      const callArgs = db.query.mock.calls[0];
      expect(callArgs[0]).toContain('INSERT INTO consultations');
    });
  });

  describe('getConsultationById', () => {
    it('should return consultation if found', async () => {
      const mockConsultation = {
        id: 1,
        doctor_id: 1,
        patient_id: 1,
        speciality: 'cardio',
        notes: 'Patient stable',
      };

      db.query.mockResolvedValue({
        rows: [mockConsultation],
      });

      const result = await ConsultationModel.getConsultationById(1);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [1]
      );

      expect(result).toEqual(mockConsultation);
    });

    it('should return null if consultation not found', async () => {
      db.query.mockResolvedValue({
        rows: [],
      });

      const result = await ConsultationModel.getConsultationById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('getConsultationsByPatientId', () => {
    it('should return consultations for a patient', async () => {
      const mockConsultations = [
        {
          id: 1,
          doctor_id: 1,
          patient_id: 1,
          speciality: 'cardio',
          consultation_date: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          doctor_id: 2,
          patient_id: 1,
          speciality: 'dental',
          consultation_date: '2024-01-20T14:00:00Z',
        },
      ];

      db.query.mockResolvedValue({
        rows: mockConsultations,
      });

      const result = await ConsultationModel.getConsultationsByPatientId(1);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE patient_id = $1'),
        [1]
      );

      expect(result).toEqual(mockConsultations);
      expect(result.length).toBe(2);
    });

    it('should return empty array if patient has no consultations', async () => {
      db.query.mockResolvedValue({
        rows: [],
      });

      const result = await ConsultationModel.getConsultationsByPatientId(999);

      expect(result).toEqual([]);
    });
  });

  describe('getConsultationsByDoctorId', () => {
    it('should return consultations for a doctor', async () => {
      const mockConsultations = [
        {
          id: 1,
          doctor_id: 1,
          patient_id: 1,
          speciality: 'cardio',
        },
        {
          id: 3,
          doctor_id: 1,
          patient_id: 3,
          speciality: 'cardio',
        },
      ];

      db.query.mockResolvedValue({
        rows: mockConsultations,
      });

      const result = await ConsultationModel.getConsultationsByDoctorId(1);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE doctor_id = $1'),
        [1]
      );

      expect(result).toEqual(mockConsultations);
      expect(result.length).toBe(2);
    });

    it('should return empty array if doctor has no consultations', async () => {
      db.query.mockResolvedValue({
        rows: [],
      });

      const result = await ConsultationModel.getConsultationsByDoctorId(999);

      expect(result).toEqual([]);
    });
  });

  describe('getConsultationByAppointmentId', () => {
    it('should return consultation for an appointment', async () => {
      const mockConsultation = {
        id: 1,
        doctor_id: 1,
        patient_id: 1,
        appointment_id: 1,
        speciality: 'cardio',
        notes: null,
      };

      db.query.mockResolvedValue({
        rows: [mockConsultation],
      });

      const result = await ConsultationModel.getConsultationByAppointmentId(1);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE appointment_id = $1'),
        [1]
      );

      expect(result).toEqual(mockConsultation);
    });

    it('should return null if no consultation for appointment', async () => {
      db.query.mockResolvedValue({
        rows: [],
      });

      const result = await ConsultationModel.getConsultationByAppointmentId(999);

      expect(result).toBeUndefined();
    });
  });

  describe('updateConsultationNotes', () => {
    it('should update consultation notes', async () => {
      const updatedConsultation = {
        id: 1,
        doctor_id: 1,
        patient_id: 1,
        speciality: 'cardio',
        notes: 'Patient showed significant improvement',
      };

      db.query.mockResolvedValue({
        rows: [updatedConsultation],
      });

      const result = await ConsultationModel.updateConsultationNotes(
        1,
        'Patient showed significant improvement'
      );

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE consultations'),
        expect.arrayContaining(['Patient showed significant improvement', 1])
      );

      expect(result).toEqual(updatedConsultation);
    });

    it('should set notes to empty string if provided', async () => {
      const updatedConsultation = {
        id: 1,
        doctor_id: 1,
        patient_id: 1,
        notes: '',
      };

      db.query.mockResolvedValue({
        rows: [updatedConsultation],
      });

      const result = await ConsultationModel.updateConsultationNotes(1, '');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE consultations'),
        expect.arrayContaining(['', 1])
      );

      expect(result.notes).toBe('');
    });

    it('should return null if consultation not found', async () => {
      db.query.mockResolvedValue({
        rows: [],
      });

      const result = await ConsultationModel.updateConsultationNotes(
        999,
        'Some notes'
      );

      expect(result).toBeUndefined();
    });
  });

  describe('getAllConsultations', () => {
    it('should return all consultations', async () => {
      const mockConsultations = [
        { id: 1, doctor_id: 1, patient_id: 1 },
        { id: 2, doctor_id: 2, patient_id: 2 },
        { id: 3, doctor_id: 1, patient_id: 3 },
      ];

      db.query.mockResolvedValue({
        rows: mockConsultations,
      });

      const result = await ConsultationModel.getAllConsultations();

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM consultations')
      );

      expect(result).toEqual(mockConsultations);
      expect(result.length).toBe(3);
    });

    it('should return empty array if no consultations exist', async () => {
      db.query.mockResolvedValue({
        rows: [],
      });

      const result = await ConsultationModel.getAllConsultations();

      expect(result).toEqual([]);
    });
  });
});

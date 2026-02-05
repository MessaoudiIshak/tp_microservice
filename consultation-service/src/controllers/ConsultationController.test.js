const ConsultationController = require('../src/controllers/ConsultationController');
const ConsultationModel = require('../src/models/ConsultationModel');

jest.mock('../src/db');
jest.mock('../src/models/ConsultationModel');

describe('Consultation Service - Consultation Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {},
      query: {},
      params: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('createConsultation', () => {
    it('should return 400 if required fields missing', async () => {
      mockReq.body = { doctorId: 1 };

      await ConsultationController.createConsultation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Doctor ID, patient ID, speciality, and appointment ID are required',
      });
    });

    it('should create consultation successfully', async () => {
      const newConsultation = {
        id: 1,
        doctor_id: 1,
        patient_id: 1,
        speciality: 'cardio',
        appointment_id: 1,
        consultation_date: '2024-01-15T10:00:00Z',
        notes: null,
      };

      mockReq.body = {
        doctorId: 1,
        patientId: 1,
        speciality: 'cardio',
        appointmentId: 1,
      };

      ConsultationModel.createConsultation.mockResolvedValue(newConsultation);

      await ConsultationController.createConsultation(mockReq, mockRes);

      expect(ConsultationModel.createConsultation).toHaveBeenCalledWith(
        1,
        1,
        'cardio',
        1
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Consultation created successfully',
          consultation: newConsultation,
        })
      );
    });
  });

  describe('getConsultationById', () => {
    it('should return 404 if consultation not found', async () => {
      mockReq.params = { consultationId: '999' };

      ConsultationModel.getConsultationById.mockResolvedValue(null);

      await ConsultationController.getConsultationById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Consultation not found',
      });
    });

    it('should return consultation by id', async () => {
      const mockConsultation = {
        id: 1,
        doctor_id: 1,
        patient_id: 1,
        speciality: 'cardio',
        appointment_id: 1,
        consultation_date: '2024-01-15T10:00:00Z',
        notes: 'Patient is stable',
      };

      mockReq.params = { consultationId: '1' };

      ConsultationModel.getConsultationById.mockResolvedValue(mockConsultation);

      await ConsultationController.getConsultationById(mockReq, mockRes);

      expect(ConsultationModel.getConsultationById).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith(mockConsultation);
    });
  });

  describe('getConsultationsByPatientId', () => {
    it('should return 400 if patient id missing', async () => {
      mockReq.query = {};

      await ConsultationController.getConsultationsByPatientId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Patient ID query parameter is required',
      });
    });

    it('should return consultations by patient id', async () => {
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

      mockReq.query = { patientId: '1' };

      ConsultationModel.getConsultationsByPatientId.mockResolvedValue(
        mockConsultations
      );

      await ConsultationController.getConsultationsByPatientId(mockReq, mockRes);

      expect(ConsultationModel.getConsultationsByPatientId).toHaveBeenCalledWith(
        '1'
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        consultations: mockConsultations,
        count: 2,
      });
    });

    it('should return empty array if patient has no consultations', async () => {
      mockReq.query = { patientId: '999' };

      ConsultationModel.getConsultationsByPatientId.mockResolvedValue([]);

      await ConsultationController.getConsultationsByPatientId(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        consultations: [],
        count: 0,
      });
    });
  });

  describe('getConsultationsByDoctorId', () => {
    it('should return 400 if doctor id missing', async () => {
      mockReq.query = {};

      await ConsultationController.getConsultationsByDoctorId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Doctor ID query parameter is required',
      });
    });

    it('should return consultations by doctor id', async () => {
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
          patient_id: 2,
          speciality: 'cardio',
        },
      ];

      mockReq.query = { doctorId: '1' };

      ConsultationModel.getConsultationsByDoctorId.mockResolvedValue(
        mockConsultations
      );

      await ConsultationController.getConsultationsByDoctorId(mockReq, mockRes);

      expect(ConsultationModel.getConsultationsByDoctorId).toHaveBeenCalledWith(
        '1'
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        consultations: mockConsultations,
        count: 2,
      });
    });
  });

  describe('getConsultationByAppointmentId', () => {
    it('should return 400 if appointment id missing', async () => {
      mockReq.query = {};

      await ConsultationController.getConsultationByAppointmentId(
        mockReq,
        mockRes
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Appointment ID query parameter is required',
      });
    });

    it('should return consultation by appointment id', async () => {
      const mockConsultation = {
        id: 1,
        doctor_id: 1,
        patient_id: 1,
        appointment_id: 1,
        speciality: 'cardio',
      };

      mockReq.query = { appointmentId: '1' };

      ConsultationModel.getConsultationByAppointmentId.mockResolvedValue(
        mockConsultation
      );

      await ConsultationController.getConsultationByAppointmentId(
        mockReq,
        mockRes
      );

      expect(
        ConsultationModel.getConsultationByAppointmentId
      ).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith(mockConsultation);
    });

    it('should return 404 if consultation not found for appointment', async () => {
      mockReq.query = { appointmentId: '999' };

      ConsultationModel.getConsultationByAppointmentId.mockResolvedValue(null);

      await ConsultationController.getConsultationByAppointmentId(
        mockReq,
        mockRes
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Consultation not found for this appointment',
      });
    });
  });

  describe('updateConsultationNotes', () => {
    it('should return 400 if notes missing', async () => {
      mockReq.params = { consultationId: '1' };
      mockReq.body = {};

      await ConsultationController.updateConsultationNotes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Consultation notes are required',
      });
    });

    it('should return 404 if consultation not found', async () => {
      mockReq.params = { consultationId: '999' };
      mockReq.body = { notes: 'Patient showed improvement' };

      ConsultationModel.updateConsultationNotes.mockResolvedValue(null);

      await ConsultationController.updateConsultationNotes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Consultation not found',
      });
    });

    it('should update consultation notes successfully', async () => {
      const updatedConsultation = {
        id: 1,
        doctor_id: 1,
        patient_id: 1,
        speciality: 'cardio',
        notes: 'Patient showed improvement',
      };

      mockReq.params = { consultationId: '1' };
      mockReq.body = { notes: 'Patient showed improvement' };

      ConsultationModel.updateConsultationNotes.mockResolvedValue(
        updatedConsultation
      );

      await ConsultationController.updateConsultationNotes(mockReq, mockRes);

      expect(ConsultationModel.updateConsultationNotes).toHaveBeenCalledWith(
        '1',
        'Patient showed improvement'
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Consultation notes updated',
          consultation: updatedConsultation,
        })
      );
    });
  });
});

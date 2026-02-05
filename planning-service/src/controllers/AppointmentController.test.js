const AppointmentModel = require('../src/models/AppointmentModel');
const AppointmentController = require('../src/controllers/AppointmentController');
const PersonnelServiceClient = require('../src/services/PersonnelServiceClient');
const publisher = require('../src/rabbitmq/publisher');

// Mock dependencies
jest.mock('../src/db');
jest.mock('../src/services/PersonnelServiceClient');
jest.mock('../src/rabbitmq/publisher');

describe('Planning Service - Appointment Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup request/response mocks
    mockReq = {
      body: {},
      query: {},
      params: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('createAppointment', () => {
    it('should return 400 if required fields are missing', async () => {
      mockReq.body = { date: '2026-02-15T10:00:00Z' };

      await AppointmentController.createAppointment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Date, speciality, and patientId are required',
      });
    });

    it('should return 404 if no doctor found with speciality', async () => {
      mockReq.body = {
        date: '2026-02-15T10:00:00Z',
        speciality: 'cardio',
        patientId: 1,
      };

      PersonnelServiceClient.findDoctorBySpeciality.mockResolvedValue(null);

      await AppointmentController.createAppointment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No available doctor found for speciality: cardio',
      });
    });

    it('should create appointment and publish event on success', async () => {
      const mockDoctor = {
        id: 1,
        name: 'Dr. Ahmed',
        speciality: 'cardio',
      };

      const mockAppointment = {
        id: 100,
        date: '2026-02-15T10:00:00Z',
        doctor_id: 1,
        speciality: 'cardio',
        patient_id: 5,
        status: 'UPCOMING',
      };

      mockReq.body = {
        date: '2026-02-15T10:00:00Z',
        speciality: 'cardio',
        patientId: 5,
      };

      PersonnelServiceClient.findDoctorBySpeciality.mockResolvedValue(mockDoctor);
      AppointmentModel.createAppointment = jest.fn().mockResolvedValue(mockAppointment);
      publisher.publishEvent.mockResolvedValue(undefined);

      await AppointmentController.createAppointment(mockReq, mockRes);

      expect(AppointmentModel.createAppointment).toHaveBeenCalledWith(
        '2026-02-15T10:00:00Z',
        1,
        'cardio',
        5,
        'UPCOMING'
      );

      expect(publisher.publishEvent).toHaveBeenCalledWith(
        'APPOINTMENT_CREATED',
        expect.objectContaining({
          appointmentId: 100,
          rdvId: 100,
          doctorId: 1,
          patientId: 5,
          speciality: 'cardio',
        })
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Appointment created successfully',
          appointment: expect.objectContaining({
            id: 100,
            status: 'UPCOMING',
          }),
        })
      );
    });

    it('should handle PersonnelServiceClient errors gracefully', async () => {
      mockReq.body = {
        date: '2026-02-15T10:00:00Z',
        speciality: 'cardio',
        patientId: 5,
      };

      PersonnelServiceClient.findDoctorBySpeciality.mockRejectedValue(
        new Error('Unable to fetch doctors from Personnel Service')
      );

      await AppointmentController.createAppointment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });
  });

  describe('getAppointments', () => {
    it('should return 400 if no query parameters provided', async () => {
      mockReq.query = {};

      await AppointmentController.getAppointments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Provide patientId, doctorId, or status query parameter',
      });
    });

    it('should get appointments by patientId', async () => {
      const mockAppointments = [
        { id: 1, patient_id: 5, status: 'UPCOMING' },
        { id: 2, patient_id: 5, status: 'DONE' },
      ];

      mockReq.query = { patientId: '5' };
      AppointmentModel.getAppointmentsByPatientId = jest.fn().mockResolvedValue(mockAppointments);

      await AppointmentController.getAppointments(mockReq, mockRes);

      expect(AppointmentModel.getAppointmentsByPatientId).toHaveBeenCalledWith('5');
      expect(mockRes.json).toHaveBeenCalledWith({
        appointments: mockAppointments,
        count: 2,
      });
    });

    it('should get appointments by doctorId', async () => {
      const mockAppointments = [
        { id: 1, doctor_id: 3, status: 'UPCOMING' },
      ];

      mockReq.query = { doctorId: '3' };
      AppointmentModel.getAppointmentsByDoctorId = jest.fn().mockResolvedValue(mockAppointments);

      await AppointmentController.getAppointments(mockReq, mockRes);

      expect(AppointmentModel.getAppointmentsByDoctorId).toHaveBeenCalledWith('3');
      expect(mockRes.json).toHaveBeenCalledWith({
        appointments: mockAppointments,
        count: 1,
      });
    });

    it('should get appointments by status', async () => {
      const mockAppointments = [
        { id: 1, status: 'UPCOMING' },
        { id: 2, status: 'UPCOMING' },
      ];

      mockReq.query = { status: 'UPCOMING' };
      AppointmentModel.getAppointmentsByStatus = jest.fn().mockResolvedValue(mockAppointments);

      await AppointmentController.getAppointments(mockReq, mockRes);

      expect(AppointmentModel.getAppointmentsByStatus).toHaveBeenCalledWith('UPCOMING');
      expect(mockRes.json).toHaveBeenCalledWith({
        appointments: mockAppointments,
        count: 2,
      });
    });
  });

  describe('getAppointmentById', () => {
    it('should return 404 if appointment not found', async () => {
      mockReq.params = { appointmentId: '999' };
      AppointmentModel.getAppointmentById = jest.fn().mockResolvedValue(null);

      await AppointmentController.getAppointmentById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Appointment not found',
      });
    });

    it('should return appointment if found', async () => {
      const mockAppointment = {
        id: 1,
        doctor_id: 3,
        patient_id: 5,
        status: 'UPCOMING',
      };

      mockReq.params = { appointmentId: '1' };
      AppointmentModel.getAppointmentById = jest.fn().mockResolvedValue(mockAppointment);

      await AppointmentController.getAppointmentById(mockReq, mockRes);

      expect(AppointmentModel.getAppointmentById).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith(mockAppointment);
    });
  });

  describe('updateAppointmentStatus', () => {
    it('should return 400 if invalid status provided', async () => {
      mockReq.params = { appointmentId: '1' };
      mockReq.body = { status: 'INVALID_STATUS' };

      await AppointmentController.updateAppointmentStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining('Invalid status'),
      });
    });

    it('should return 404 if appointment not found', async () => {
      mockReq.params = { appointmentId: '999' };
      mockReq.body = { status: 'DONE' };
      AppointmentModel.updateAppointmentStatus = jest.fn().mockResolvedValue(null);

      await AppointmentController.updateAppointmentStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Appointment not found',
      });
    });

    it('should update appointment status successfully', async () => {
      const mockAppointment = {
        id: 1,
        doctor_id: 3,
        patient_id: 5,
        status: 'DONE',
      };

      mockReq.params = { appointmentId: '1' };
      mockReq.body = { status: 'DONE' };
      AppointmentModel.updateAppointmentStatus = jest.fn().mockResolvedValue(mockAppointment);

      await AppointmentController.updateAppointmentStatus(mockReq, mockRes);

      expect(AppointmentModel.updateAppointmentStatus).toHaveBeenCalledWith('1', 'DONE');
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Appointment status updated',
        appointment: mockAppointment,
      });
    });

    it('should accept all valid statuses', async () => {
      const validStatuses = ['UPCOMING', 'DONE', 'CANCELLED'];
      
      for (const status of validStatuses) {
        jest.clearAllMocks();
        
        const mockAppointment = {
          id: 1,
          status,
        };

        mockReq.params = { appointmentId: '1' };
        mockReq.body = { status };
        AppointmentModel.updateAppointmentStatus = jest.fn().mockResolvedValue(mockAppointment);

        await AppointmentController.updateAppointmentStatus(mockReq, mockRes);

        expect(AppointmentModel.updateAppointmentStatus).toHaveBeenCalledWith('1', status);
      }
    });
  });
});

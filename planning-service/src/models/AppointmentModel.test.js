const AppointmentModel = require('../src/models/AppointmentModel');

// Mock the database
jest.mock('../src/db', () => ({
  query: jest.fn(),
}));

const db = require('../src/db');

describe('Planning Service - Appointment Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAppointment', () => {
    it('should create an appointment and return the created record', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            date: '2026-02-15T10:00:00Z',
            doctor_id: 3,
            speciality: 'cardio',
            patient_id: 5,
            status: 'UPCOMING',
          },
        ],
      };

      db.query.mockResolvedValue(mockResult);

      const result = await AppointmentModel.createAppointment(
        '2026-02-15T10:00:00Z',
        3,
        'cardio',
        5,
        'UPCOMING'
      );

      expect(db.query).toHaveBeenCalled();
      expect(result).toEqual(mockResult.rows[0]);
    });
  });

  describe('getAppointmentById', () => {
    it('should retrieve an appointment by id', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            date: '2026-02-15T10:00:00Z',
            doctor_id: 3,
            speciality: 'cardio',
            patient_id: 5,
            status: 'UPCOMING',
          },
        ],
      };

      db.query.mockResolvedValue(mockResult);

      const result = await AppointmentModel.getAppointmentById(1);

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = $1'), [1]);
      expect(result).toEqual(mockResult.rows[0]);
    });

    it('should return undefined if appointment not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await AppointmentModel.getAppointmentById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('getAppointmentsByPatientId', () => {
    it('should retrieve all appointments for a patient', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            date: '2026-02-15T10:00:00Z',
            doctor_id: 3,
            patient_id: 5,
            status: 'UPCOMING',
          },
          {
            id: 2,
            date: '2026-02-20T14:00:00Z',
            doctor_id: 4,
            patient_id: 5,
            status: 'DONE',
          },
        ],
      };

      db.query.mockResolvedValue(mockResult);

      const result = await AppointmentModel.getAppointmentsByPatientId(5);

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE patient_id = $1'), [5]);
      expect(result.length).toBe(2);
      expect(result[0].patient_id).toBe(5);
    });

    it('should return empty array if no appointments found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await AppointmentModel.getAppointmentsByPatientId(999);

      expect(result).toEqual([]);
    });
  });

  describe('getAppointmentsByDoctorId', () => {
    it('should retrieve all appointments for a doctor', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            date: '2026-02-15T10:00:00Z',
            doctor_id: 3,
            patient_id: 5,
            status: 'UPCOMING',
          },
        ],
      };

      db.query.mockResolvedValue(mockResult);

      const result = await AppointmentModel.getAppointmentsByDoctorId(3);

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE doctor_id = $1'), [3]);
      expect(result.length).toBe(1);
    });
  });

  describe('updateAppointmentStatus', () => {
    it('should update appointment status and return updated record', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            date: '2026-02-15T10:00:00Z',
            doctor_id: 3,
            speciality: 'cardio',
            patient_id: 5,
            status: 'DONE',
          },
        ],
      };

      db.query.mockResolvedValue(mockResult);

      const result = await AppointmentModel.updateAppointmentStatus(1, 'DONE');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE appointments'),
        ['DONE', 1]
      );
      expect(result.status).toBe('DONE');
    });
  });

  describe('getAppointmentsByStatus', () => {
    it('should retrieve all appointments with specific status', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            date: '2026-02-15T10:00:00Z',
            doctor_id: 3,
            patient_id: 5,
            status: 'UPCOMING',
          },
          {
            id: 2,
            date: '2026-02-20T14:00:00Z',
            doctor_id: 4,
            patient_id: 6,
            status: 'UPCOMING',
          },
        ],
      };

      db.query.mockResolvedValue(mockResult);

      const result = await AppointmentModel.getAppointmentsByStatus('UPCOMING');

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE status = $1'), [
        'UPCOMING',
      ]);
      expect(result.length).toBe(2);
      expect(result.every(a => a.status === 'UPCOMING')).toBe(true);
    });
  });
});

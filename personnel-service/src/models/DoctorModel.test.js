const DoctorModel = require('../src/models/DoctorModel');
const db = require('../src/db');

jest.mock('../src/db');

describe('Personnel Service - Doctor Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDoctor', () => {
    it('should create a doctor with availability true', async () => {
      const mockDoctor = {
        id: 1,
        name: 'Dr. Fatima',
        email: 'fatima@hospital.com',
        speciality: 'cardio',
        service: 'Cardiology',
        available: true,
      };

      db.query.mockResolvedValue({
        rows: [mockDoctor],
      });

      const result = await DoctorModel.createDoctor(
        'Dr. Fatima',
        'fatima@hospital.com',
        'cardio',
        'Cardiology'
      );

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO doctors'),
        ['Dr. Fatima', 'fatima@hospital.com', 'cardio', 'Cardiology', true]
      );

      expect(result).toEqual(mockDoctor);
    });
  });

  describe('getDoctorsBySpeciality', () => {
    it('should return doctors with matching speciality', async () => {
      const mockDoctors = [
        {
          id: 1,
          name: 'Dr. Fatima',
          email: 'fatima@hospital.com',
          speciality: 'cardio',
          available: true,
        },
        {
          id: 3,
          name: 'Dr. Hassan',
          email: 'hassan@hospital.com',
          speciality: 'cardio',
          available: false,
        },
      ];

      db.query.mockResolvedValue({
        rows: mockDoctors,
      });

      const result = await DoctorModel.getDoctorsBySpeciality('cardio');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE speciality = $1'),
        ['cardio']
      );

      expect(result).toEqual(mockDoctors);
      expect(result.length).toBe(2);
    });

    it('should return empty array if no doctors match speciality', async () => {
      db.query.mockResolvedValue({
        rows: [],
      });

      const result = await DoctorModel.getDoctorsBySpeciality('neuro');

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('getDoctorById', () => {
    it('should return doctor if found', async () => {
      const mockDoctor = {
        id: 1,
        name: 'Dr. Fatima',
        email: 'fatima@hospital.com',
        speciality: 'cardio',
        available: true,
      };

      db.query.mockResolvedValue({
        rows: [mockDoctor],
      });

      const result = await DoctorModel.getDoctorById(1);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [1]
      );

      expect(result).toEqual(mockDoctor);
    });

    it('should return null if doctor not found', async () => {
      db.query.mockResolvedValue({
        rows: [],
      });

      const result = await DoctorModel.getDoctorById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('getAllDoctors', () => {
    it('should return all doctors ordered by speciality and name', async () => {
      const mockDoctors = [
        { id: 1, name: 'Dr. Fatima', speciality: 'cardio' },
        { id: 2, name: 'Dr. Ahmed', speciality: 'dental' },
        { id: 3, name: 'Dr. Hassan', speciality: 'dental' },
      ];

      db.query.mockResolvedValue({
        rows: mockDoctors,
      });

      const result = await DoctorModel.getAllDoctors();

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY speciality, name')
      );

      expect(result).toEqual(mockDoctors);
      expect(result.length).toBe(3);
    });

    it('should return empty array if no doctors exist', async () => {
      db.query.mockResolvedValue({
        rows: [],
      });

      const result = await DoctorModel.getAllDoctors();

      expect(result).toEqual([]);
    });
  });

  describe('updateDoctor', () => {
    it('should update doctor details', async () => {
      const updatedDoctor = {
        id: 1,
        name: 'Dr. Fatima Updated',
        email: 'fatima.new@hospital.com',
        speciality: 'cardio',
        service: 'Cardiology',
        available: true,
      };

      db.query.mockResolvedValue({
        rows: [updatedDoctor],
      });

      const result = await DoctorModel.updateDoctor(
        1,
        'Dr. Fatima Updated',
        'fatima.new@hospital.com',
        'cardio',
        'Cardiology'
      );

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE doctors'),
        expect.arrayContaining([
          'Dr. Fatima Updated',
          'fatima.new@hospital.com',
          'cardio',
          'Cardiology',
        ])
      );

      expect(result).toEqual(updatedDoctor);
    });

    it('should return null if doctor not found', async () => {
      db.query.mockResolvedValue({
        rows: [],
      });

      const result = await DoctorModel.updateDoctor(
        999,
        'Dr. Fake',
        'fake@hospital.com',
        'cardio',
        'Cardiology'
      );

      expect(result).toBeUndefined();
    });
  });

  describe('setAvailability', () => {
    it('should set doctor availability to true', async () => {
      const updatedDoctor = {
        id: 1,
        name: 'Dr. Fatima',
        speciality: 'cardio',
        available: true,
      };

      db.query.mockResolvedValue({
        rows: [updatedDoctor],
      });

      const result = await DoctorModel.setAvailability(1, true);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE doctors SET available ='),
        [true, 1]
      );

      expect(result).toEqual(updatedDoctor);
    });

    it('should set doctor availability to false', async () => {
      const updatedDoctor = {
        id: 1,
        name: 'Dr. Fatima',
        speciality: 'cardio',
        available: false,
      };

      db.query.mockResolvedValue({
        rows: [updatedDoctor],
      });

      const result = await DoctorModel.setAvailability(1, false);

      expect(result.available).toBe(false);
    });

    it('should return null if doctor not found', async () => {
      db.query.mockResolvedValue({
        rows: [],
      });

      const result = await DoctorModel.setAvailability(999, true);

      expect(result).toBeUndefined();
    });
  });
});

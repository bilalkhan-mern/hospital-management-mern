import { StatusCodes } from 'http-status-codes';
import Department from '../models/Department.js';
import { AppError } from '../utils/AppError.js';

export const createDepartment = async (req, res) => {
  const department = await Department.create(req.body);
  res.status(StatusCodes.CREATED).json({ success: true, message: 'Department created successfully.', data: department });
};

export const getDepartments = async (_req, res) => {
  const departments = await Department.find().sort({ name: 1 });
  res.json({ success: true, data: departments });
};

export const updateDepartment = async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!department) {
    throw new AppError('Department not found.', StatusCodes.NOT_FOUND);
  }

  res.json({ success: true, message: 'Department updated successfully.', data: department });
};

export const deleteDepartment = async (req, res) => {
  const department = await Department.findByIdAndDelete(req.params.id);
  if (!department) {
    throw new AppError('Department not found.', StatusCodes.NOT_FOUND);
  }

  res.json({ success: true, message: 'Department deleted successfully.' });
};

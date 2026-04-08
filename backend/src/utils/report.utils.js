import cloudinary from '../config/cloudinary.js';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

export const getReportFileType = (mimetype = '') => (mimetype === 'application/pdf' ? 'pdf' : 'image');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportsDirectory = path.resolve(__dirname, '../../uploads/reports');

const getFileExtension = (file) => {
  if (file.mimetype === 'application/pdf') {
    return '.pdf';
  }

  if (file.mimetype === 'image/png') {
    return '.png';
  }

  if (file.mimetype === 'image/webp') {
    return '.webp';
  }

  return '.jpg';
};

export const uploadBufferToCloudinary = (file, folder = 'hospital-reports') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        format: file.mimetype === 'application/pdf' ? 'pdf' : undefined,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });

export const persistLocalReportFile = async (file) => {
  await fs.mkdir(reportsDirectory, { recursive: true });
  const localFileName = `${randomUUID()}${getFileExtension(file)}`;
  const absolutePath = path.join(reportsDirectory, localFileName);
  await fs.writeFile(absolutePath, file.buffer);
  return localFileName;
};

export const getLocalReportPath = (localFileName = '') => {
  if (!localFileName) {
    return '';
  }

  return path.join(reportsDirectory, localFileName);
};

export const getReportAccessUrl = (report, { download = false } = {}) => {
  if (!report) {
    return '';
  }

  if (report.fileUrl) {
    return report.fileUrl;
  }

  if (report.fileType === 'pdf' && report.publicId) {
    return cloudinary.url(report.publicId, {
      resource_type: 'raw',
      secure: true,
      sign_url: true,
      type: 'upload',
    });
  }

  if (report.publicId) {
    return cloudinary.url(report.publicId, {
      resource_type: 'image',
      secure: true,
      sign_url: true,
      type: 'upload',
    });
  }

  return '';
};

export const deleteCloudinaryAsset = async (publicId, fileType) => {
  if (!publicId) {
    return;
  }

  if (fileType === 'pdf') {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      return;
    } catch (_error) {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      return;
    }
  }

  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
};

export const deleteLocalReportFile = async (localFileName) => {
  const localPath = getLocalReportPath(localFileName);
  if (!localPath) {
    return;
  }

  try {
    await fs.unlink(localPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};

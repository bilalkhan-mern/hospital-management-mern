import api from '../api/axios';

export const getReportFilename = (report) => {
  const baseName = (report?.title || 'report').replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'report';
  const extension = report?.fileType === 'pdf' ? 'pdf' : 'file';
  return `${baseName}.${extension}`;
};

export const fetchReportBlob = async (reportId, { download = false } = {}) => {
  const response = await api.get(`/reports/${reportId}/file`, {
    params: download ? { download: 'true' } : undefined,
    responseType: 'blob',
  });

  return response.data;
};

export const downloadReportFile = async (report) => {
  const blob = await fetchReportBlob(report._id, { download: true });
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = getReportFilename(report);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(blobUrl);
};

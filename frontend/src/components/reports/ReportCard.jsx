import { formatDate } from '../../lib/format';
import { downloadReportFile } from '../../lib/reportFiles';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { getReportTypeLabel } from '../../lib/reportTypes';

const ReportCard = ({ report, onPreview, onDelete, onRestore, actions = [] }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadReportFile(report);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to download this report right now.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article className="report-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-slate-900">{report.title}</h3>
            <span className="data-chip">{getReportTypeLabel(report.type)}</span>
            <span className={`data-chip ${report.fileType === 'pdf' ? '!bg-rose-100 !text-rose-700' : '!bg-sky-100 !text-sky-700'}`}>
              {report.fileType?.toUpperCase()}
            </span>
            <span className="data-chip capitalize">{report.uploadedBy}</span>
          </div>
          {report.description && <p className="mt-2 text-sm leading-6 text-slate-600">{report.description}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => onPreview?.(report)}>
            Preview
          </button>
          <button type="button" className="btn-secondary" onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Preparing...' : 'Download'}
          </button>
          {onDelete && (
            <button type="button" className="btn-secondary" onClick={() => onDelete(report)}>
              Archive
            </button>
          )}
          {onRestore && (
            <button type="button" className="btn-primary" onClick={() => onRestore(report)}>
              Restore
            </button>
          )}
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={action.tone === 'primary' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => action.onClick(report)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="record-grid">
        <div className="record-meta">
          <p className="record-label">Patient</p>
          <p className="record-value">{report.patientId?.user?.name || report.appointmentId?.patient?.user?.name || 'Patient'}</p>
        </div>
        <div className="record-meta">
          <p className="record-label">Doctor</p>
          <p className="record-value">{report.doctorId?.user?.name || report.appointmentId?.doctor?.user?.name || 'Not assigned'}</p>
        </div>
        <div className="record-meta">
          <p className="record-label">Appointment</p>
          <p className="record-value">
            {report.appointmentId?.date ? `${formatDate(report.appointmentId.date)} at ${report.appointmentId?.timeSlot || ''}` : 'Linked visit'}
          </p>
          <p className="record-subvalue capitalize">{report.appointmentId?.status || 'report record'}</p>
        </div>
        <div className="record-meta">
          <p className="record-label">Created</p>
          <p className="record-value">{formatDate(report.createdAt)}</p>
        </div>
        <div className="record-meta">
          <p className="record-label">Report Date</p>
          <p className="record-value">{formatDate(report.reportDate || report.createdAt)}</p>
        </div>
        <div className="record-meta">
          <p className="record-label">Record Status</p>
          <p className="record-value">{report.isDeleted ? 'Archived' : 'Active'}</p>
        </div>
      </div>
    </article>
  );
};

export default ReportCard;

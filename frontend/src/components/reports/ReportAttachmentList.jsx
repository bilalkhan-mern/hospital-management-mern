import { useState } from 'react';
import toast from 'react-hot-toast';
import { downloadReportFile } from '../../lib/reportFiles';

const ReportAttachmentList = ({ reports = [], onPreview, title = 'Attached Reports', emptyMessage = 'No reports attached.' }) => {
  const [downloadingId, setDownloadingId] = useState('');

  const handleDownload = async (report) => {
    try {
      setDownloadingId(report._id);
      await downloadReportFile(report);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to download this attached report.');
    } finally {
      setDownloadingId('');
    }
  };

  return (
    <div className="record-meta mt-3">
      <p className="record-label">{title}</p>
      {!reports.length ? (
        <p className="record-value">{emptyMessage}</p>
      ) : (
        <div className="mt-2 space-y-2">
          {reports.map((report) => (
            <div key={report._id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{report.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                  {report.fileType} · uploaded by {report.uploadedBy}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary" onClick={() => onPreview?.(report)}>
                  Preview
                </button>
                <button type="button" className="btn-secondary" onClick={() => handleDownload(report)} disabled={downloadingId === report._id}>
                  {downloadingId === report._id ? 'Preparing...' : 'Download'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportAttachmentList;

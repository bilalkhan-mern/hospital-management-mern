import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import InlineLoader from '../common/InlineLoader';
import { downloadReportFile, fetchReportBlob } from '../../lib/reportFiles';

const ReportPreviewModal = ({ report, onClose }) => {
  const [blobUrl, setBlobUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    let nextBlobUrl = '';

    const loadPreview = async () => {
      if (!report?._id) {
        setBlobUrl('');
        setPreviewError('');
        return;
      }

      try {
        setLoading(true);
        setPreviewError('');
        const blob = await fetchReportBlob(report._id);
        nextBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(nextBlobUrl);
      } catch (error) {
        setPreviewError(error.response?.data?.message || 'Unable to preview this report right now.');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (nextBlobUrl) {
        URL.revokeObjectURL(nextBlobUrl);
      }
    };
  }, [report]);

  if (!report) {
    return null;
  }

  const handleDownload = async () => {
    try {
      await downloadReportFile(report);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to download this report right now.');
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/55 px-4">
      <div className="card w-full max-w-5xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="section-title">{report.title}</h3>
            <p className="section-copy">
              {report.fileType?.toUpperCase()} report by {report.uploadedBy}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={handleDownload}>
              Download
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="mt-5 max-h-[72vh] overflow-auto rounded-[24px] border border-slate-200 bg-slate-50 p-3">
          {loading ? (
            <InlineLoader label="Loading report preview..." />
          ) : previewError ? (
            <div className="error-banner">{previewError}</div>
          ) : report.fileType === 'pdf' ? (
            <object data={blobUrl} type="application/pdf" className="h-[68vh] w-full rounded-[18px] bg-white">
              <div className="flex h-[68vh] items-center justify-center rounded-[18px] border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                PDF preview is unavailable in this browser. Use the download button to open the file.
              </div>
            </object>
          ) : (
            <img src={blobUrl} alt={report.title} className="mx-auto max-h-[68vh] rounded-[18px] object-contain" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPreviewModal;

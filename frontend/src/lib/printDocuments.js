import { formatDate } from './format';

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const openPrintableWindow = (title, html) => {
  if (typeof window === 'undefined') {
    return false;
  }

  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  if (!printWindow) {
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { margin: 0; padding: 28px; font-family: "Segoe UI", Arial, sans-serif; background: #edf4f3; color: #0f172a; }
          .sheet { max-width: 920px; margin: 0 auto; background: #fff; border-radius: 28px; padding: 32px; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08); }
          .title { font-size: 28px; font-weight: 800; color: #0f766e; margin: 0; }
          .subtitle { color: #64748b; margin-top: 8px; line-height: 1.6; }
          .grid { display: grid; gap: 14px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 22px; }
          .card { border: 1px solid #dbe4ea; border-radius: 18px; padding: 14px; background: #f8fafc; }
          .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; color: #94a3b8; font-weight: 700; }
          .value { margin-top: 8px; font-size: 15px; font-weight: 700; color: #0f172a; }
          .block { margin-top: 24px; border: 1px solid #dbe4ea; border-radius: 20px; padding: 18px; }
          .block-title { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 10px; }
          .meta { color: #475569; line-height: 1.7; font-size: 14px; }
          .list { margin: 0; padding-left: 18px; }
          @media print { body { background: #fff; padding: 0; } .sheet { box-shadow: none; border-radius: 0; max-width: none; } }
        </style>
      </head>
      <body>
        <div class="sheet">${html}</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => printWindow.print();
  return true;
};

export const printInvoiceDocument = (appointment) => {
  if (!appointment) {
    return false;
  }

  const html = `
    <h1 class="title">Consultation Invoice</h1>
    <p class="subtitle">Invoice generated from the hospital management billing workflow.</p>
    <div class="grid">
      <div class="card"><div class="label">Patient</div><div class="value">${escapeHtml(appointment.patient?.user?.name || 'Patient')}</div></div>
      <div class="card"><div class="label">Doctor</div><div class="value">${escapeHtml(appointment.doctor?.user?.name || 'Doctor')}</div></div>
      <div class="card"><div class="label">Visit</div><div class="value">${escapeHtml(formatDate(appointment.date))} ${appointment.timeSlot ? `at ${escapeHtml(appointment.timeSlot)}` : ''}</div></div>
      <div class="card"><div class="label">Status</div><div class="value">${escapeHtml(appointment.status || 'pending')}</div></div>
      <div class="card"><div class="label">Amount</div><div class="value">Rs. ${escapeHtml(appointment.amount ?? 0)}</div></div>
      <div class="card"><div class="label">Payment</div><div class="value">${escapeHtml(appointment.paymentStatus || 'unpaid')} ${appointment.paymentMethod ? `· ${escapeHtml(appointment.paymentMethod)}` : ''}</div></div>
    </div>
  `;

  return openPrintableWindow('Consultation Invoice', html);
};

export const printReportSummaryDocument = (report) => {
  if (!report) {
    return false;
  }

  const html = `
    <h1 class="title">Report Summary</h1>
    <p class="subtitle">Clinical report metadata sheet generated for archive, sharing, or PDF export.</p>
    <div class="grid">
      <div class="card"><div class="label">Title</div><div class="value">${escapeHtml(report.title)}</div></div>
      <div class="card"><div class="label">Type</div><div class="value">${escapeHtml(report.type || report.fileType || 'report')}</div></div>
      <div class="card"><div class="label">Patient</div><div class="value">${escapeHtml(report.patientId?.user?.name || report.appointmentId?.patient?.user?.name || 'Patient')}</div></div>
      <div class="card"><div class="label">Doctor</div><div class="value">${escapeHtml(report.doctorId?.user?.name || report.appointmentId?.doctor?.user?.name || 'Not assigned')}</div></div>
      <div class="card"><div class="label">Report Date</div><div class="value">${escapeHtml(formatDate(report.reportDate || report.createdAt))}</div></div>
      <div class="card"><div class="label">Uploaded By</div><div class="value">${escapeHtml(report.uploadedBy || 'system')}</div></div>
    </div>
    <div class="block">
      <div class="block-title">Description</div>
      <div class="meta">${escapeHtml(report.description || 'No description added for this report.')}</div>
    </div>
    <div class="block">
      <div class="block-title">Linked Appointment</div>
      <div class="meta">${report.appointmentId?.date ? `${escapeHtml(formatDate(report.appointmentId.date))} ${report.appointmentId?.timeSlot ? `at ${escapeHtml(report.appointmentId.timeSlot)}` : ''}` : 'Appointment reference not available'}</div>
    </div>
  `;

  return openPrintableWindow('Report Summary', html);
};

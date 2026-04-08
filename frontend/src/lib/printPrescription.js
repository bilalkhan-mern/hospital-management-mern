import { formatDate } from './format';

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderMedicines = (medicines = []) =>
  medicines
    .map(
      (medicine, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(medicine.name)}</td>
          <td>${escapeHtml(medicine.dosage)}</td>
          <td>${escapeHtml(medicine.frequency)}</td>
          <td>${escapeHtml(medicine.days)} day(s)</td>
          <td>${escapeHtml(medicine.notes || '-')}</td>
        </tr>
      `
    )
    .join('');

const renderReports = (reports = []) =>
  reports.length
    ? reports
      .map(
        (report) => `
          <li>
            <strong>${escapeHtml(report.title)}</strong>
            <span>${escapeHtml(report.type || 'report')} · ${escapeHtml(formatDate(report.reportDate || report.createdAt || new Date()))}</span>
          </li>
        `
      )
      .join('')
    : '<li><span>No linked reports</span></li>';

export const printPrescriptionDocument = ({ prescription, patient, doctorName, hospitalName = 'Hospital Management System' }) => {
  if (typeof window === 'undefined' || !prescription) {
    return false;
  }

  const printWindow = window.open('', '_blank', 'width=1100,height=900');
  if (!printWindow) {
    return false;
  }

  const appointmentLabel = prescription.appointment?.date
    ? `${formatDate(prescription.appointment.date)}${prescription.appointment?.timeSlot ? ` at ${prescription.appointment.timeSlot}` : ''}`
    : 'Linked appointment';

  const printableHtml = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Prescription - ${escapeHtml(patient?.user?.name || patient?.name || 'Patient')}</title>
        <style>
          :root {
            color-scheme: light;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 32px;
            font-family: "Segoe UI", Arial, sans-serif;
            background: #eef4f4;
            color: #0f172a;
          }
          .sheet {
            max-width: 960px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 28px;
            padding: 36px;
            box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
          }
          .header {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            border-bottom: 2px solid #d7ece8;
            padding-bottom: 24px;
          }
          .brand {
            font-size: 28px;
            font-weight: 800;
            color: #0f766e;
            letter-spacing: 0.04em;
          }
          .muted {
            color: #64748b;
            font-size: 13px;
            line-height: 1.6;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
            margin-top: 28px;
          }
          .meta-card {
            border: 1px solid #dbe4ea;
            border-radius: 18px;
            padding: 16px;
            background: #f8fafc;
          }
          .meta-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            font-weight: 700;
            color: #94a3b8;
          }
          .meta-value {
            margin-top: 8px;
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
          }
          .section {
            margin-top: 28px;
          }
          .section-title {
            font-size: 16px;
            font-weight: 800;
            letter-spacing: 0.04em;
            color: #0f172a;
            margin-bottom: 12px;
          }
          .panel {
            border: 1px solid #dbe4ea;
            border-radius: 22px;
            padding: 18px;
            background: #fff;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 12px 10px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
            text-align: left;
            font-size: 13px;
          }
          th {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: #64748b;
          }
          ul {
            margin: 0;
            padding-left: 18px;
          }
          li + li {
            margin-top: 10px;
          }
          li span {
            display: block;
            color: #64748b;
            font-size: 12px;
            margin-top: 3px;
          }
          .footer {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: flex-end;
          }
          .signature {
            min-width: 220px;
            border-top: 1px solid #0f172a;
            padding-top: 10px;
            text-align: center;
            font-size: 12px;
            color: #475569;
          }
          @media print {
            body {
              background: #fff;
              padding: 0;
            }
            .sheet {
              box-shadow: none;
              border-radius: 0;
              max-width: none;
              padding: 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div>
              <div class="brand">${escapeHtml(hospitalName)}</div>
              <p class="muted">Clinically structured prescription sheet generated from the hospital workflow system.</p>
            </div>
            <div class="muted">
              <div><strong>Issued On:</strong> ${escapeHtml(formatDate(prescription.createdAt || new Date()))}</div>
              <div><strong>Prescription ID:</strong> ${escapeHtml(prescription._id || 'N/A')}</div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="meta-label">Patient</div>
              <div class="meta-value">${escapeHtml(patient?.user?.name || patient?.name || 'Patient')}</div>
              <div class="muted">${escapeHtml(patient?.user?.email || patient?.email || 'No email recorded')}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Prescribing Doctor</div>
              <div class="meta-value">${escapeHtml(doctorName || 'Assigned Doctor')}</div>
              <div class="muted">${escapeHtml(prescription.doctor?.specialization || 'General consultation')}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Appointment</div>
              <div class="meta-value">${escapeHtml(appointmentLabel)}</div>
              <div class="muted">${escapeHtml(prescription.appointment?.status || 'completed')}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Diagnosis</div>
              <div class="meta-value">${escapeHtml(prescription.diagnosis || 'Not recorded')}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Medicine Plan</div>
            <div class="panel">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Medicine</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>${renderMedicines(prescription.medicines || [])}</tbody>
              </table>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Doctor Advice</div>
            <div class="panel">${escapeHtml(prescription.advice || 'Follow the prescribed treatment plan and attend follow-up if symptoms continue.')}</div>
          </div>

          <div class="section">
            <div class="section-title">Linked Reports</div>
            <div class="panel">
              <ul>${renderReports(prescription.reports || [])}</ul>
            </div>
          </div>

          <div class="footer">
            <div class="muted">This prescription was generated from the secure hospital management workflow.</div>
            <div class="signature">Doctor Signature</div>
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(printableHtml);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
  };

  return true;
};

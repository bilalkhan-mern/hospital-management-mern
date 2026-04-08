# Project Documentation

This document explains the full feature set, workflow, and file/report management flow of the Hospital Management Web App.

## 1. Project Overview

This is a complete MERN-based hospital operations system built for four access levels:
- `super_admin`
- `admin`
- `doctor`
- `patient`

The system connects all major hospital workflows in one place:
- user authentication
- doctor onboarding and approval
- department management
- schedule-based appointment booking
- consultation handling
- prescriptions
- payments
- file/report management
- responsive dashboards for every role

## 2. Main Modules

### Authentication Module
- patient self-registration
- doctor self-registration with admin approval
- shared login for all roles
- JWT access token and refresh token
- secure logout and token refresh flow
- role-protected frontend routes
- role-protected backend APIs

### Admin Management Module
- super admin can create more admins
- super admin can create super admins
- activate or deactivate admins
- delete admins with safety checks
- prevent self-deletion and last-super-admin removal

### Department Module
- admin manages hospital departments
- department links doctors to hospital units
- patients can understand doctor placement by department

### Doctor Management Module
- admin creates doctors directly
- admin edits doctor profiles
- admin deletes doctors
- admin approves doctor applications
- admin rejects doctor applications

### Scheduling Module
- doctor schedule contains:
  - working days
  - start time
  - end time
  - slot duration
- backend generates valid slots dynamically
- booked slots are removed automatically
- invalid slots are rejected by backend

### Appointment Module
- patient books appointment with selected doctor
- admin sees all appointments
- doctor sees only assigned appointments
- patient sees only own appointments
- supports:
  - pending
  - completed
  - cancelled
- patient reschedule flow
- doctor reschedule flow
- reschedule history log stored on same appointment
- completed appointments are treated as locked clinical records

### Prescription Module
- doctor can add prescription only after appointment completion
- only one prescription is allowed per appointment
- structured medicines data instead of plain text
- doctor can select reports from the same appointment while creating prescription
- patient can review diagnosis, medicines, advice, and linked reports
- doctor sees closed/completed consultation state clearly
- doctor and patient can print a formal prescription sheet

### Billing Module
- each doctor has consultation fee
- appointment auto-attaches fee during booking
- appointment stores:
  - amount
  - paymentStatus
  - paymentMethod
  - paidAt
- patient can mark payment
- admin can manage payment state
- all panels show paid/unpaid visibility

### File / Report Management Module
- upload report to appointment
- supports PDF and image files only
- 5MB max file size
- uses `multer`
- stores file in Cloudinary
- also stores protected local copy for stable preview/download
- report records store:
  - title
  - description
  - type
  - reportDate
- supported report types:
  - `lab`
  - `xray`
  - `mri`
  - `prescription`
  - `other`
- role-based preview/download access
- patient can upload own reports anytime for own appointments
- doctor can upload reports only after completed consultation
- doctor report upload is limited to pending report appointments
- reports are soft deleted, not hard deleted
- admin can restore archived reports
- report summary print/export support

### Audit Log Module
- records sensitive system activity for admin visibility
- includes events such as:
  - doctor create, update, approve, reject, delete
  - admin create, activate, deactivate, delete
- appointment booking, cancellation, reschedule, payment updates
- prescription creation
- report upload, archive, restore
- searchable audit stream by actor, action, and date

### Error Recovery Module
- route-level error boundary page
- retry button
- go back button
- back to dashboard shortcut

### Notification UX Layer
- admin, doctor, and patient each get lightweight notification cards
- built for quick operational awareness on mobile and desktop

## 3. Database Models

### User
- shared authentication entity
- fields include:
  - `name`
  - `email`
  - `password`
  - `phone`
  - `role`
  - `adminType`
  - `isActive`
  - `refreshToken`

### Doctor
- linked to `User`
- fields include:
  - `user`
  - `department`
  - `specialization`
  - `qualification`
  - `experience`
  - `consultationFee`
  - `bio`
  - `schedule`
  - `isApproved`

### Patient
- linked to `User`
- fields include:
  - `user`
  - `age`
  - `gender`
  - `bloodGroup`
  - `address`
  - `medicalHistory`

### Department
- fields include:
  - `name`
  - `description`

### Appointment
- links patient and doctor
- fields include:
  - `patient`
  - `doctor`
  - `date`
  - `timeSlot`
  - `status`
  - `symptoms`
  - `notes`
  - `amount`
  - `paymentStatus`
  - `paymentMethod`
  - `paidAt`
  - `rescheduleHistory`

### Prescription
- linked to appointment, doctor, patient
- fields include:
  - `appointment`
  - `doctor`
  - `patient`
  - `diagnosis`
  - `medicines[]`
  - `advice`
  - `reports[]`

### Report
- linked to patient and appointment, optionally doctor
- fields include:
  - `patientId`
  - `doctorId`
  - `appointmentId`
  - `fileUrl`
  - `publicId`
  - `mimeType`
  - `originalName`
  - `localFileName`
  - `type`
  - `reportDate`
  - `fileType`
  - `title`
  - `description`
  - `uploadedBy`
  - `isDeleted`
  - `createdAt`

### AuditLog
- stores:
  - `actor`
  - `actorRole`
  - `action`
  - `entityType`
  - `entityId`
  - `message`
  - `metadata`
  - timestamps

## 4. End-To-End Workflow

## Authentication Workflow
1. patient registers directly or doctor submits registration request
2. admin approves doctor request if needed
3. user logs in through shared login page
4. app stores access token and refresh token
5. frontend redirects by role:
   - admin -> `/admin`
   - doctor -> `/doctor-panel`
   - patient -> `/patient-panel`

## Admin Workflow
1. super admin or admin logs in
2. admin manages departments
3. admin creates or edits doctors
4. admin reviews pending doctor requests
5. admin monitors patients, appointments, payments, and reports
6. admin can archive reports through soft delete
7. admin can restore archived reports
8. admin can review audit logs
9. super admin manages other admins if needed

## Patient Workflow
1. patient logs in
2. opens `Find Doctor`
3. searches doctors by specialization, department, or name
4. selects doctor and date
5. backend generates valid schedule slots
6. patient books appointment
7. fee is auto-attached
8. patient can later:
   - reschedule pending visit
   - cancel pending visit if not completed
   - pay unpaid visit
   - upload related reports with type and report date
   - view prescriptions after consultation
   - view linked reports inside prescription details

## Doctor Workflow
1. doctor logs in after approval
2. doctor updates profile and schedule
3. doctor sees only assigned appointments
4. doctor may:
   - mark pending appointment completed
   - cancel pending visit
   - reschedule pending visit
5. after completion doctor can:
   - upload doctor report for that visit
   - create prescription
   - select only same-appointment reports while creating prescription
   - open patient history
6. once appointment becomes completed, it is treated as locked for further status changes

## Appointment Lifecycle
1. patient chooses doctor
2. backend checks doctor schedule and date
3. backend generates available slots
4. patient books slot
5. appointment is stored as `pending`
6. doctor handles visit
7. appointment becomes `completed` or `cancelled`
8. completed visits can receive prescription and reports
9. payment state remains visible through full lifecycle

## Reschedule Workflow
- both patient and doctor can reschedule pending appointments
- system updates same appointment instead of creating duplicate
- previous date and slot are saved in `rescheduleHistory`
- reason and actor are recorded

## Prescription Workflow
1. doctor completes appointment
2. doctor opens prescription workspace
3. doctor selects appointment
4. system loads active reports for that same appointment
5. doctor selects which reports should be linked to the prescription
6. doctor adds:
   - diagnosis
   - medicines list
   - dosage
   - frequency
   - days
   - notes
   - advice
7. prescription becomes visible in patient panel
8. linked reports appear in doctor and patient prescription details
9. only one prescription can exist for one appointment
10. printable prescription sheet is available in both doctor and patient panels

## Billing Workflow
1. doctor consultation fee is defined in doctor profile
2. when patient books, fee is copied to appointment `amount`
3. appointment starts as `unpaid`
4. patient or admin can mark it paid
5. payment method is stored as:
   - cash
   - upi
   - card
6. `paidAt` is captured for completed payment entry

## File / Report Workflow

### Upload Flow
1. patient or doctor selects appointment
2. user chooses PDF or image file
3. user selects report type
4. user selects actual report date
5. frontend sends multipart form data
6. backend validates file type, type enum, report date, and max size
7. backend validates appointment ownership/assignment rules
8. file uploads to Cloudinary
9. backend also saves protected local file copy
10. report record is stored in MongoDB

### Access Flow
- patient can see only own reports
- doctor can see only reports of assigned appointments
- admin can see all reports
- soft deleted reports are hidden from normal user queries
- admin can still include deleted reports optionally when needed

### Preview And Download Flow
1. user clicks `Preview` or `Download`
2. frontend requests authenticated backend route
3. backend checks role access to the report
4. backend serves the protected local copy first
5. frontend shows preview or downloads file

### Soft Delete Flow
1. admin archives report from report section
2. backend sets `isDeleted = true`
3. file is not removed from Cloudinary immediately
4. report disappears from patient and doctor normal views
5. deleted report does not appear in prescription report selectors

### Restore Flow
1. admin switches to archived report view
2. admin restores required report
3. backend sets `isDeleted = false`
4. linked prescription keeps working because report relationship is preserved
5. restored report becomes visible again in normal workflows

### Audit Flow
1. important action happens in system
2. backend stores audit entry with actor, action, entity, and metadata
3. admin opens `Audit Logs`
4. recent operational trail is visible in one scrollable view

## 5. Panel Structure

## Admin Panel Sections
- `Overview`
- `Operations`
- `Doctors`
- `Patients`
- `Appointments`
- `Reports`
- `Audit Logs`
- `Admin Control`

Admin panel provides:
- dashboard counts
- department management
- doctor create/edit/delete
- doctor search
- patient snapshot
- patient search
- appointment oversight
- appointment search and status filtering
- payment management
- invoice print/export
- report oversight
- report archive action
- report restore action
- report type/uploader filters
- report summary print/export
- audit activity stream
- audit actor/action/date filters
- multi-admin management for super admin

## Doctor Panel Sections
- `Appointments`
- `Prescriptions`
- `Reports`
- `Patient History`
- `Profile`

Doctor panel provides:
- assigned appointment handling
- appointment search
- prescription studio and prescription queue
- report selection inside prescription creation
- appointment report upload/view with type and report date
- pending report search for only eligible appointments
- patient history lookup
- schedule/profile management
- doctor notification cards
- report summary print/export

## Patient Panel Sections
- `Find Doctor`
- `My Appointments`
- `My Prescriptions`
- `My Reports`
- `My Profile`

Patient panel provides:
- doctor discovery
- booking flow
- appointment tracking
- payment actions
- prescription review with linked reports
- prescription search and report-type filtering
- report upload/history with type and report date
- profile management
- patient notification cards
- report summary print/export

## 6. Validation And Constraints

- reports can only be uploaded for valid appointments
- only patient or assigned doctor can upload reports
- doctor can upload report only after appointment completion
- patient can upload report anytime for own appointment
- prescription can only be created after appointment status = completed
- only one prescription per appointment
- reports linked to prescription must belong to same appointment
- completed appointments cannot be modified by doctor status updates
- patient can access own data only
- doctor can access assigned appointment data only
- admin has full access

## 7. UI / UX Work Completed

- responsive dashboards for desktop, tablet, mobile
- professional left-sidebar navigation
- section-based panel navigation
- denser data presentation for large lists
- formal record blocks instead of paragraph-style data
- premium hero/dashboard header
- consistent teal, slate, and orange visual language
- `Manrope` typography
- inline error banners and field-level validation
- preview modal for reports
- linked report display inside prescription details

## 8. Seed Data Available

### Super Admin
- `admin@hospital.com` / `Admin@123`

### Demo Doctors
- `neha@hospital.com` / `Doctor@123`
- `arjun@hospital.com` / `Doctor@123`
- `kavya@hospital.com` / `Doctor@123`
- `rohan@hospital.com` / `Doctor@123`
- `priya@hospital.com` / `Doctor@123`
- `sana@hospital.com` / `Doctor@123`
- `vivek@hospital.com` / `Doctor@123`
- `meera@hospital.com` / `Doctor@123`

### Demo Patients
- `asha@example.com` / `Patient@123`
- `rahul@example.com` / `Patient@123`
- `sneha@example.com` / `Patient@123`
- `imran@example.com` / `Patient@123`
- `pooja@example.com` / `Patient@123`
- `karan@example.com` / `Patient@123`

### Demo Data Status
- seeded doctors
- seeded patients
- seeded appointments
- seeded prescriptions
- report system ready for live uploads

## 9. Important Files

### Backend
- [server.js](C:\Users\Daily\OneDrive\Documents\hospital management\backend\src\server.js)
- [app.js](C:\Users\Daily\OneDrive\Documents\hospital management\backend\src\app.js)
- [auth.controller.js](C:\Users\Daily\OneDrive\Documents\hospital management\backend\src\controllers\auth.controller.js)
- [admin.controller.js](C:\Users\Daily\OneDrive\Documents\hospital management\backend\src\controllers\admin.controller.js)
- [doctor.controller.js](C:\Users\Daily\OneDrive\Documents\hospital management\backend\src\controllers\doctor.controller.js)
- [patient.controller.js](C:\Users\Daily\OneDrive\Documents\hospital management\backend\src\controllers\patient.controller.js)
- [report.controller.js](C:\Users\Daily\OneDrive\Documents\hospital management\backend\src\controllers\report.controller.js)
- [Report.js](C:\Users\Daily\OneDrive\Documents\hospital management\backend\src\models\Report.js)
- [Prescription.js](C:\Users\Daily\OneDrive\Documents\hospital management\backend\src\models\Prescription.js)

### Frontend
- [AdminPanelPage.jsx](C:\Users\Daily\OneDrive\Documents\hospital management\frontend\src\pages\admin\AdminPanelPage.jsx)
- [DoctorPanelPage.jsx](C:\Users\Daily\OneDrive\Documents\hospital management\frontend\src\pages\doctor\DoctorPanelPage.jsx)
- [PatientPanelPage.jsx](C:\Users\Daily\OneDrive\Documents\hospital management\frontend\src\pages\patient\PatientPanelPage.jsx)
- [ReportCard.jsx](C:\Users\Daily\OneDrive\Documents\hospital management\frontend\src\components\reports\ReportCard.jsx)
- [ReportPreviewModal.jsx](C:\Users\Daily\OneDrive\Documents\hospital management\frontend\src\components\reports\ReportPreviewModal.jsx)
- [ReportAttachmentList.jsx](C:\Users\Daily\OneDrive\Documents\hospital management\frontend\src\components\reports\ReportAttachmentList.jsx)
- [reportTypes.js](C:\Users\Daily\OneDrive\Documents\hospital management\frontend\src\lib\reportTypes.js)

## 10. Setup Summary

### Backend
```bash
cd backend
npm install
copy .env.example .env
npm run seed:admin
npm run seed:demo-doctors
npm run seed:demo-patients
npm run seed:demo-appointments
npm run dev
```

### Frontend
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## 11. Conclusion

This project is now a connected hospital business and care workflow system, not just a simple CRUD app.

It supports:
- operations management
- clinical consultation workflow
- prescriptions with report linking
- payments
- admin hierarchy
- secure file/report handling with categorization and soft delete
- responsive role-based dashboards

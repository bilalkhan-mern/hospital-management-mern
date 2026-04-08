<<<<<<< HEAD
# Hospital Management Web App

Complete MERN-based hospital workflow system with secure role-based access for `super_admin`, `admin`, `doctor`, and `patient`.

## What The System Includes

- role-based authentication with JWT access and refresh tokens
- patient self-registration
- doctor self-registration with admin approval
- multi-admin management with `super_admin` safeguards
- dynamic doctor schedules and backend-generated appointment slots
- appointment booking, cancellation, completion, and rescheduling
- structured prescriptions with medicine rows and linked reports
- appointment-level billing and payment tracking
- secure file/report management with categorization, soft delete, restore, preview, and download
- printable prescription sheets for doctor and patient workflows
- audit logs for sensitive operational actions
- advanced search and filtering across admin, doctor, and patient workspaces
- separate archived reports workspace with restore controls
- mock role-based notification cards for quicker operational visibility
- invoice and report-summary print/export support
- friendly route-level error recovery page
- responsive admin, doctor, and patient dashboards
- demo seed data for doctors, patients, appointments, and prescriptions

## Tech Stack

### Frontend
- React with Vite
- Tailwind CSS
- React Router DOM
- Axios
- React Hook Form
- Context API
- React Hot Toast

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Joi validation
- bcryptjs
- JWT
- multer
- Cloudinary

## Project Structure

```text
hospital management/
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- scripts/
|   |   |-- services/
|   |   |-- utils/
|   |   |-- validators/
|   |   |-- app.js
|   |   `-- server.js
|   |-- uploads/
|   |-- .env.example
|   `-- package.json
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- context/
|   |   |-- hooks/
|   |   |-- lib/
|   |   |-- pages/
|   |   |-- router/
|   |   |-- styles/
|   |   `-- main.jsx
|   |-- .env.example
|   `-- package.json
|-- API-REQUESTS.md
|-- PROJECT-DOCUMENTATION.md
`-- README.md
```

## Roles In The System

### Super Admin
- create admin and super admin accounts
- activate or deactivate admins
- delete admins with safety restrictions
- access full admin dashboard

### Admin
- manage departments
- create, edit, delete doctors
- approve or reject doctor applications
- view patients
- view and manage appointments
- manage payments
- view reports
- soft delete reports

### Doctor
- manage profile and schedule
- view only assigned appointments
- update appointment status
- reschedule pending appointments
- add structured prescriptions after completed visits
- select and link appointment reports into prescriptions
- upload and view reports linked to appointments
- view patient history

### Patient
- register and log in
- search doctors by name, department, specialization
- book appointments using generated time slots
- reschedule or cancel pending appointments
- pay for appointments
- view prescriptions and linked reports
- upload and view reports
- manage profile

## Core Features

### Authentication And Security
- JWT access token + refresh token
- route protection on frontend and backend
- bcrypt password hashing
- role-based authorization middleware
- doctor login blocked until approval
- inactive admins blocked from login
- self-deactivation and last-super-admin deletion are prevented

### Doctor Scheduling
- working days
- start time
- end time
- slot duration
- backend-generated available slots per date
- double-booking prevention

### Appointment System
- book appointment with selected doctor
- role-filtered appointment visibility
- statuses:
  - `pending`
  - `completed`
  - `cancelled`
- reschedule workflow for patient and doctor
- reschedule history log on the same appointment
- completed appointments are treated as locked medical records

### Prescription System
- only completed appointments can receive prescriptions
- only one prescription per appointment
- structured prescription schema with:
  - `diagnosis`
  - `medicines[]`
    - `name`
    - `dosage`
    - `frequency`
    - `days`
    - `notes`
  - `advice`
  - `reports[]`
- reports linked to prescriptions must belong to the same appointment
- completed visits with prescription are clearly marked in doctor UI

### Billing And Payments
- doctor-level `consultationFee`
- appointment-level billing fields:
  - `amount`
  - `paymentStatus`
  - `paymentMethod`
  - `paidAt`
- fee auto-attached when appointment is booked
- unpaid vs paid visibility in all panels
- patient and admin payment actions from UI

### File / Report Management
- multer upload handling
- accepts PDF and image files only
- max file size `5MB`
- Cloudinary cloud storage
- protected local copy for reliable preview/download
- title and description for each report
- `type` field:
  - `lab`
  - `xray`
  - `mri`
  - `prescription`
  - `other`
- `reportDate` field for actual clinical report date
- report linked to patient, doctor, and appointment
- strict report access by role
- soft delete support with `isDeleted`
- deleted reports are excluded from normal doctor/patient views
- admin can restore archived reports from the admin report workspace

### Printable Prescription Support
- patient can print a clean prescription sheet from `My Prescriptions`
- doctor can print a clean prescription sheet from patient history
- print view includes:
  - patient and doctor information
  - diagnosis
  - medicine table
  - advice
  - linked reports

### Audit Log System
- tracks critical activities like:
  - doctor create/update/delete/approve/reject
  - admin create/activate/deactivate/delete
  - appointment book/reschedule/cancel/payment update
  - prescription creation
  - report upload/archive/restore

## Database Models

- `User`
- `Doctor`
- `Patient`
- `Department`
- `Appointment`
- `Prescription`
- `Report`
- `AuditLog`

## Demo Accounts

### Super Admin
- `admin@hospital.com` / `Admin@123`

### Doctors
- `neha@hospital.com` / `Doctor@123` - Cardiology
- `arjun@hospital.com` / `Doctor@123` - Neurology
- `kavya@hospital.com` / `Doctor@123` - Orthopedics
- `rohan@hospital.com` / `Doctor@123` - Dermatology
- `priya@hospital.com` / `Doctor@123` - Pediatrics
- `sana@hospital.com` / `Doctor@123` - Gynecology
- `vivek@hospital.com` / `Doctor@123` - ENT
- `meera@hospital.com` / `Doctor@123` - General Medicine

### Patients
- `asha@example.com` / `Patient@123`
- `rahul@example.com` / `Patient@123`
- `sneha@example.com` / `Patient@123`
- `imran@example.com` / `Patient@123`
- `pooja@example.com` / `Patient@123`
- `karan@example.com` / `Patient@123`

## Setup

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

## Environment Variables

### Backend `.env`
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hospital-management
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
ADMIN_EMAIL=admin@hospital.com
ADMIN_PASSWORD=Admin@123
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend `.env`
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Run URLs

- frontend: `http://localhost:5173`
- backend: `http://localhost:5000`
- API base: `http://localhost:5000/api`

## Important Documentation

- full workflow: [PROJECT-DOCUMENTATION.md](C:\Users\Daily\OneDrive\Documents\hospital management\PROJECT-DOCUMENTATION.md)
- API examples: [API-REQUESTS.md](C:\Users\Daily\OneDrive\Documents\hospital management\API-REQUESTS.md)

## Main Files

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
- [main.jsx](C:\Users\Daily\OneDrive\Documents\hospital management\frontend\src\main.jsx)
- [router index](C:\Users\Daily\OneDrive\Documents\hospital management\frontend\src\router\index.jsx)
- [AuthContext.jsx](C:\Users\Daily\OneDrive\Documents\hospital management\frontend\src\context\AuthContext.jsx)
- [AdminPanelPage.jsx](C:\Users\Daily\OneDrive\Documents\hospital management\frontend\src\pages\admin\AdminPanelPage.jsx)
- [DoctorPanelPage.jsx](C:\Users\Daily\OneDrive\Documents\hospital management\frontend\src\pages\doctor\DoctorPanelPage.jsx)
- [PatientPanelPage.jsx](C:\Users\Daily\OneDrive\Documents\hospital management\frontend\src\pages\patient\PatientPanelPage.jsx)
- [ReportCard.jsx](C:\Users\Daily\OneDrive\Documents\hospital management\frontend\src\components\reports\ReportCard.jsx)
- [ReportPreviewModal.jsx](C:\Users\Daily\OneDrive\Documents\hospital management\frontend\src\components\reports\ReportPreviewModal.jsx)
- [ReportAttachmentList.jsx](C:\Users\Daily\OneDrive\Documents\hospital management\frontend\src\components\reports\ReportAttachmentList.jsx)

## Build Status

- frontend production build verified successfully
- backend syntax checks passed on latest report-management updates
=======
# hospital-management-fullstack
A full-stack Hospital Management System built with the MERN stack (MongoDB, Express, React, Node.js). The application supports role-based access for Admin, Doctors, and Patients, featuring authentication, appointment scheduling, dashboards, and secure API integration.
>>>>>>> d7bd1a6567ed149e67991ead35214088a3c44ae5

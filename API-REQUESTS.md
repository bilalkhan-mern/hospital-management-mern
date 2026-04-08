# Sample API Requests

## Authentication

### Register Patient
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Asha Kumar",
  "email": "asha@example.com",
  "password": "Patient@123",
  "phone": "+919999999999",
  "age": 29,
  "gender": "female",
  "bloodGroup": "B+",
  "address": "Kolkata, India"
}
```

### Register Doctor Request
```http
POST /api/auth/register-doctor
Content-Type: application/json

{
  "name": "Dr. Kavya Rao",
  "email": "kavya@hospital.com",
  "password": "Doctor@123",
  "phone": "+919888888888",
  "department": "<department_id>",
  "specialization": "Orthopedic Surgeon",
  "qualification": "MS Orthopedics",
  "experience": 6,
  "consultationFee": 700,
  "schedule": {
    "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "startTime": "09:00",
    "endTime": "14:00",
    "slotDuration": 30
  },
  "bio": "Focused on bone, joint, and mobility care"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@hospital.com",
  "password": "Admin@123"
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

## Admin

### Create Department
```http
POST /api/departments
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "name": "Cardiology",
  "description": "Heart and vascular care"
}
```

### Create Doctor
```http
POST /api/admin/doctors
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "name": "Dr. Neha Sharma",
  "email": "neha@hospital.com",
  "password": "Doctor@123",
  "phone": "+918888888888",
  "department": "<department_id>",
  "specialization": "Cardiologist",
  "qualification": "MD Cardiology",
  "experience": 8,
  "consultationFee": 900,
  "schedule": {
    "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "startTime": "09:00",
    "endTime": "13:00",
    "slotDuration": 30
  },
  "bio": "Specialist in preventive and clinical cardiology"
}
```

### Update Doctor
```http
PUT /api/admin/doctors/<doctor_id>
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "name": "Dr. Neha Sharma",
  "phone": "+918888888888",
  "department": "<department_id>",
  "specialization": "Cardiologist",
  "qualification": "MD Cardiology",
  "experience": 9,
  "consultationFee": 1000,
  "schedule": {
    "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "startTime": "09:00",
    "endTime": "14:00",
    "slotDuration": 30
  },
  "bio": "Updated profile details"
}
```

### Approve Doctor Request
```http
PATCH /api/admin/doctors/<doctor_id>/approve
Authorization: Bearer <admin_access_token>
```

### Reject Doctor Request
```http
DELETE /api/admin/doctors/<doctor_id>/reject
Authorization: Bearer <admin_access_token>
```

### Create Admin
```http
POST /api/admin/admins
Authorization: Bearer <super_admin_access_token>
Content-Type: application/json

{
  "name": "Operations Admin",
  "email": "ops-admin@hospital.com",
  "password": "Admin@123",
  "phone": "+919876543210",
  "adminType": "admin"
}
```

### Update Payment Status
```http
PATCH /api/admin/appointments/<appointment_id>/payment
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "paymentStatus": "paid",
  "paymentMethod": "upi"
}
```

### Get All Reports Including Deleted
```http
GET /api/reports?includeDeleted=true
Authorization: Bearer <admin_access_token>
```

### Get Audit Logs
```http
GET /api/admin/audit-logs?limit=40
Authorization: Bearer <admin_access_token>
```

## Patient

### Get Patient-Visible Doctors
```http
GET /api/patients/doctors?search=cardio&page=1&limit=6
Authorization: Bearer <patient_access_token>
```

### Get Generated Slots For Doctor
```http
GET /api/patients/doctors/<doctor_id>/slots?date=2026-04-08
Authorization: Bearer <patient_access_token>
```

### Book Appointment
```http
POST /api/patients/appointments
Authorization: Bearer <patient_access_token>
Content-Type: application/json

{
  "doctorId": "<doctor_id>",
  "date": "2026-04-08T00:00:00.000Z",
  "timeSlot": "10:00",
  "symptoms": "Headache and fatigue"
}
```

### Cancel Appointment
```http
PATCH /api/patients/appointments/<appointment_id>/cancel
Authorization: Bearer <patient_access_token>
```

### Patient Reschedule Appointment
```http
PATCH /api/patients/appointments/<appointment_id>/reschedule
Authorization: Bearer <patient_access_token>
Content-Type: application/json

{
  "date": "2026-04-10T00:00:00.000Z",
  "timeSlot": "11:00",
  "reason": "Need a later consultation time"
}
```

### Patient Pay Appointment
```http
PATCH /api/patients/appointments/<appointment_id>/payment
Authorization: Bearer <patient_access_token>
Content-Type: application/json

{
  "paymentStatus": "paid",
  "paymentMethod": "card"
}
```

## Doctor

### Update Appointment Status
```http
PATCH /api/doctors/appointments/<appointment_id>/status
Authorization: Bearer <doctor_access_token>
Content-Type: application/json

{
  "status": "completed",
  "notes": "Patient responded well to treatment"
}
```

### Doctor Reschedule Appointment
```http
PATCH /api/doctors/appointments/<appointment_id>/reschedule
Authorization: Bearer <doctor_access_token>
Content-Type: application/json

{
  "date": "2026-04-11T00:00:00.000Z",
  "timeSlot": "12:00",
  "reason": "Doctor availability changed"
}
```

### Add Prescription With Linked Reports
```http
POST /api/doctors/prescriptions
Authorization: Bearer <doctor_access_token>
Content-Type: application/json

{
  "appointmentId": "<appointment_id>",
  "reports": ["<report_id_1>", "<report_id_2>"],
  "medicines": [
    {
      "name": "Paracetamol",
      "dosage": "650mg",
      "frequency": "Twice daily",
      "days": 5,
      "notes": "After meals"
    },
    {
      "name": "Vitamin C",
      "dosage": "500mg",
      "frequency": "Once daily",
      "days": 7,
      "notes": "Morning dose"
    }
  ],
  "diagnosis": "Seasonal viral fever",
  "advice": "Hydration, rest, and follow-up if fever continues"
}
```

### Doctor Patient History
```http
GET /api/doctors/patients/<patient_id>/history
Authorization: Bearer <doctor_access_token>
```

## Reports / File Management

### Upload Report
```http
POST /api/reports/upload
Authorization: Bearer <doctor_or_patient_access_token>
Content-Type: multipart/form-data

appointmentId=<appointment_id>
title=Blood Test Report
description=Pre-consultation CBC report
type=lab
reportDate=2026-04-04
file=<pdf_or_image_file>
```

### Get Patient Reports
```http
GET /api/reports/patient/<patient_id>
Authorization: Bearer <patient_or_admin_access_token>
```

### Get Appointment Reports
```http
GET /api/reports/appointment/<appointment_id>
Authorization: Bearer <doctor_or_patient_or_admin_access_token>
```

### Stream / Preview / Download Report
```http
GET /api/reports/<report_id>/file
Authorization: Bearer <authorized_access_token>
```

### Download Report Attachment
```http
GET /api/reports/<report_id>/file?download=true
Authorization: Bearer <authorized_access_token>
```

### Soft Delete Report
```http
DELETE /api/reports/<report_id>
Authorization: Bearer <admin_access_token>
```

### Restore Archived Report
```http
PATCH /api/reports/<report_id>/restore
Authorization: Bearer <admin_access_token>
```

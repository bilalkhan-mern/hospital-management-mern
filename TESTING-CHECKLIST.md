# Testing Checklist

This checklist is designed for client demos, QA walkthroughs, and final project validation.

## Demo Accounts

### Super Admin
- Email: `admin@hospital.com`
- Password: `Admin@123`

### Doctor
- Email: `neha@hospital.com`
- Password: `Doctor@123`

### Patient
- Email: `asha@example.com`
- Password: `Patient@123`

## Demo Goal

Show the full hospital workflow clearly:
- admin manages hospital operations
- patient books a doctor
- doctor handles the assigned visit
- doctor uploads report and creates prescription
- patient sees final prescription, reports, and billing state

## Pre-Demo Setup

- [ ] backend server is running
- [ ] frontend server is running
- [ ] MongoDB is running
- [ ] demo seed data is already inserted
- [ ] Cloudinary credentials are configured in backend `.env`
- [ ] report preview and download are working with newly uploaded files

## Phase 1: Super Admin / Admin Demo

### Login
- [ ] log in as `admin@hospital.com`
- [ ] confirm redirect to `/admin`
- [ ] confirm role-based access is working

### Overview Section
- [ ] open `Overview`
- [ ] show counts for:
  - doctors
  - patients
  - appointments
  - reports
- [ ] explain this is the admin control center

### Operations Section
- [ ] open `Operations`
- [ ] show `Add Doctor` form
- [ ] show `Add Department` form
- [ ] explain doctor schedule setup:
  - working days
  - start time
  - end time
  - slot duration

### Doctors Section
- [ ] open `Doctors`
- [ ] show doctor roster
- [ ] click `Edit` on a doctor
- [ ] show doctor details can be updated
- [ ] show delete option
- [ ] if pending doctors exist, show approval / rejection flow

### Patients Section
- [ ] open `Patients`
- [ ] show registered patient list
- [ ] explain admin visibility of patient records

### Appointments Section
- [ ] open `Appointments`
- [ ] show appointment records with:
  - patient
  - doctor
  - date and slot
  - status
  - billing amount
  - payment state
- [ ] show payment management action

### Reports Section
- [ ] open `Reports`
- [ ] show report metadata:
  - report title
  - report type
  - report date
  - uploader
  - linked appointment
- [ ] show preview action
- [ ] show soft delete behavior
- [ ] explain deleted reports are archived, not physically removed immediately

### Admin Control Section
- [ ] open `Admin Control`
- [ ] show create admin form
- [ ] explain:
  - super admin can create admins
  - activate/deactivate admins
  - remove admins
  - self-protection rules exist

## Phase 2: Patient Demo

### Login
- [ ] log in as `asha@example.com`
- [ ] confirm redirect to `/patient-panel`

### Find Doctor Section
- [ ] open `Find Doctor`
- [ ] search by specialization or doctor name
- [ ] show doctor cards / listing
- [ ] explain department and specialization visibility

### Appointment Booking
- [ ] select a doctor
- [ ] choose appointment date
- [ ] show generated available slots
- [ ] book appointment
- [ ] explain:
  - backend generates slots from doctor schedule
  - double booking is prevented
  - fee is auto-attached

### My Appointments Section
- [ ] open `My Appointments`
- [ ] show patient sees only own appointments
- [ ] show:
  - appointment status
  - billing amount
  - payment status
- [ ] show reschedule option for pending appointment
- [ ] show cancel option for pending appointment
- [ ] show payment option for unpaid appointment

### My Reports Section
- [ ] open `My Reports`
- [ ] upload a patient report
- [ ] fill:
  - appointment
  - report title
  - report type
  - report date
  - description
  - file
- [ ] confirm report appears in report history
- [ ] test preview
- [ ] test download

### My Profile Section
- [ ] open `My Profile`
- [ ] show patient details can be updated
- [ ] explain medical context is stored here

## Phase 3: Doctor Demo

### Login
- [ ] log in as `neha@hospital.com`
- [ ] confirm redirect to `/doctor-panel`

### Appointments Section
- [ ] open `Appointments`
- [ ] show doctor sees only assigned appointments
- [ ] explain role-based filtering
- [ ] complete one pending appointment
- [ ] explain completed appointments are locked
- [ ] click `View History` on a patient

### Patient History Section
- [ ] confirm patient history opens correctly
- [ ] show:
  - previous appointments
  - previous prescriptions
  - linked reports in prescription history

### Reports Section
- [ ] open `Reports`
- [ ] show search field for pending report patients
- [ ] explain only completed appointments without a doctor report appear
- [ ] upload doctor report for completed visit
- [ ] fill:
  - appointment
  - report title
  - report type
  - report date
  - description
  - file
- [ ] confirm new report appears in appointment reports list
- [ ] preview uploaded report
- [ ] download uploaded report

### Prescriptions Section
- [ ] open `Prescriptions`
- [ ] select completed appointment
- [ ] confirm report selection list loads only same-appointment reports
- [ ] select one or more reports to attach
- [ ] add:
  - diagnosis
  - medicines
  - dosage
  - frequency
  - days
  - notes
  - advice
- [ ] save prescription
- [ ] confirm only one prescription per appointment is allowed

### Profile Section
- [ ] open `Profile`
- [ ] show doctor profile and schedule can be updated
- [ ] explain patient booking depends on this schedule

## Phase 4: Return To Patient For Final Output

### My Prescriptions Section
- [ ] log back in as `asha@example.com`
- [ ] open `My Prescriptions`
- [ ] confirm patient can see:
  - doctor name
  - specialization
  - diagnosis
  - medicines
  - advice
  - linked reports
- [ ] preview linked report from prescription
- [ ] download linked report from prescription

### My Appointments Section
- [ ] confirm billing / payment state is visible
- [ ] confirm completed consultation is reflected properly

## Critical Validation Checks

### Authentication / Access
- [ ] patient cannot access doctor/admin data
- [ ] doctor cannot access unassigned appointments
- [ ] admin has global access
- [ ] unapproved doctor cannot log in
- [ ] inactive admin cannot log in

### Appointment Rules
- [ ] double booking is blocked
- [ ] completed appointment cannot be modified by doctor status update
- [ ] completed appointment cannot receive second prescription
- [ ] reschedule works only on pending appointments

### Report Rules
- [ ] patient can upload report only for own appointment
- [ ] doctor can upload report only for assigned completed appointment
- [ ] report type is required
- [ ] report date is required
- [ ] only PDF/image accepted
- [ ] file size above 5MB is rejected
- [ ] deleted reports are hidden from normal UI
- [ ] report preview works
- [ ] report download works

### Prescription Rules
- [ ] prescription can be created only after appointment completion
- [ ] linked reports must belong to same appointment
- [ ] linked reports show in patient prescription details
- [ ] linked reports show in doctor patient-history prescription details

### Billing Rules
- [ ] consultation fee auto-attaches during booking
- [ ] patient can mark payment
- [ ] admin can manage payment
- [ ] payment status updates correctly in UI

## Best Client Storyline

- [ ] admin shows control center and hospital operations
- [ ] patient books doctor using live schedule-based slots
- [ ] doctor handles only assigned appointment
- [ ] doctor uploads consultation report
- [ ] doctor creates prescription with linked reports
- [ ] patient sees final treatment record with attached reports
- [ ] admin still has system-wide monitoring and archive control

## Suggested Demo Order

1. [ ] Super admin login
2. [ ] Admin overview
3. [ ] Doctor / department management
4. [ ] Patient login
5. [ ] Patient booking flow
6. [ ] Patient report upload
7. [ ] Doctor login
8. [ ] Doctor completes appointment
9. [ ] Doctor uploads report
10. [ ] Doctor creates prescription with linked reports
11. [ ] Patient views prescription and linked reports
12. [ ] Admin reviews reports and appointments

## Final Client Message

If the client asks what makes this system realistic, highlight:
- [ ] role-based security
- [ ] doctor approval workflow
- [ ] dynamic slot generation
- [ ] reschedule history
- [ ] structured prescriptions
- [ ] billing and payment tracking
- [ ] report categorization
- [ ] prescription-report linking
- [ ] report soft delete
- [ ] responsive professional dashboards

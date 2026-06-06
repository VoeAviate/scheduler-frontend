# FlightCircle API Core Domain Entities

This document describes the core domain entities extracted from the [FlightCircle API](file:///home/henrique/workspace/scheduler-frontend/docs/API.md). These models form the foundation of the scheduler's data structure and state boundaries.

---

## 1. User / Customer
Represents a pilot, member, student, or employee registered with an FBO (Fixed-Base Operator). It holds personal information, pilot credentials, account balances, and reference states.

### Main Attributes
- `ID` (`integer`, required): Unique user identifier.
- `CustomerID` (`integer`, required): Internal customer identifier for the FBO.
- `first_name` (`string`, required): User's first name.
- `last_name` (`string`, required): User's last name.
- `email` (`string <email>`, optional): Registered email address.
- `Date of Birth` (`string <date>`, optional): Birthdate formatted as `YYYY-MM-DD`.
- `balance` (`number <float>`, optional): Account balance rounded to 2 decimal places.
- `Status` (`string`, required): User account status. Enum: `"Active"`, `"Pending"`, `"Deleted"` (Note: `"ERROR"` is excluded from the system's `UserStatus` representation).
- `CustomerStatus` (`string`, optional): Customer status mapped to text representation. Enum: `"Inactive"` (mapped from `"0"`), `"Active"` (mapped from `"1"`), `"Pending"` (mapped from `"2"`).
- `UserType` (`string`, required): User workspace role. Enum: `"STUDENT"`, `"ADMINISTRATOR"`.
- **Pilot & Medical Credentials**:
  - `Last Medical` (`string or null`, optional)
  - `Medical Expiration` (`string or null`, optional)
  - `Last FAA Flight Review` (`string or null`, optional)
  - `Renter's Insurance Expires` (`string or null`, optional)
  - `Certificate` (`string`, optional): Enum: `"Pilot"`, `"Instructor"`, `"Remote Pilot"`.
  - `Certificate Type` (`string`, optional): Enum (FAA base set): `Student`, `Sport`, `Recreational`, `Private`, `Commercial`, `ATP` (extends for EASA/CASA).
  - `Craft Categories` (`Array of strings`, optional): Category endorsements (e.g. `Airplane`, `Rotocraft`).
  - `Class Ratings` (`Array of strings`, optional): Class ratings (e.g. `Single Engine Land`, `Multi Engine Land`).
- **Metadata**:
  - `file_categories` (`Array of strings`, optional): Configured category labels for files.
  - `files` (`Array of UserFileListItem`, optional): Collection of uploaded files.
  - `custom_fields` (`object`, optional): Scoped metadata attributes specific to the FBO.

---

## 2. User File
Represents a document or image uploaded to a user profile, typically used to verify flight reviews, renter's insurance policy documents, or medical certificates.

### Main Attributes
- `ID` (`string`, required): Random UUID-like file record identifier.
- `name` (`string`, required): Friendly display name.
- `categories` (`Array of strings`, optional): File category tags.
- `size` (`integer`, optional): File size in bytes.
- `created` (`string <date-time>`, optional): Upload date-time.
- `expires` (`string or null`, optional): Document expiration timestamp.
- `status` (`integer`, optional): Integer status indicator (e.g. `1` = active).
- `url` (`string`, optional): Relative path pointing to the secure download redirect endpoint.

---

## 3. Aircraft
Represents an airplane, helicopter, glider, or other airframe available for scheduling, training, and rental through the FBO.

### Main Attributes
- `ID` (`string`, required): Aircraft record identifier.
- `FboID` (`string`, required): Reference to FBO owner organization.
- `tail_number` (`string`, required): Registration number.
- `make` (`string`, required): Manufacturer.
- `model` (`string`, required): Model code.
- `category` (`string`, required): Airframe category (e.g. `Airplane`, `Rotocraft`).
- `preferred_name` (`string`, required): Friendly name/display label.
- `hourly_rate` (`string`, required): Hourly rental cost (or `"NaN"` if unconfigured).
- `hobbs_total` (`string`, optional): Cumulative engine hours tracker (Hobbs).
- `tach_total` (`string`, optional): Cumulative airframe hours tracker (Tachometer).
- `status` (`string`, required): Visual schedule status. Enum: `"0"` (offline), `"1"` (online), `"2"` (staff only).
- `enabled` (`string`, required): Flag indicating if aircraft is active or deleted. Enum: `"0"` (deleted), `"1"` (enabled).

---

## 4. Squawk
Represents a pilot-reported discrepancy, maintenance issue, or mechanical concern associated with an aircraft.

### Main Attributes
- `ID` (`string`, required): Squawk identifier (hash string).
- `AircraftID` (`string`, required): Target aircraft identifier.
- `FboID` (`string`, required): FBO organization identifier.
- `UserID` (`string`, required): Identifier of reporting user.
- `tail_number` (`string`, required): Aircraft tail number.
- `description` (`string`, required): Description of the mechanical issue.
- `actions_taken` (`string or null`, optional): Resolution text populated by maintenance staff.
- `created` (`string <date-time>`, required): Timestamp when reported.
- `status` (`string`, required): Operational code indicating open, resolved, or deferred status.

---

## 5. Maintenance Reminder
A threshold reminder triggers warnings when an aircraft approaches inspection deadlines (such as 100-hour or annual checks), measured either in calendar dates or engine hours.

### Main Attributes
- `ID` (`string`, required): Reminder identifier.
- `AircraftID` (`string`, required): Target aircraft identifier.
- `FboID` (`string`, required): FBO organization identifier.
- `label` (`string`, required): Reminder name (e.g., `"Annual Inspection"`, `"100 hour / Oil Change"`).
- `measurement` (`string`, optional): Numeric tracking parameter type (e.g. tach hours, date).
- `notes` (`string`, optional): Additional instructions.
- `remaining` (`string`, optional): Hours or days remaining until threshold.
- `goal_date` (`string`, optional): Calculated date target for inspection.
- `next` (`number`, optional): Target meter value.

---

## 6. Instructor
An instructor authorized to conduct flight and ground training under the FBO organization.

### Main Attributes
- `ID` (`string`, required): Instructor record identifier.
- `InstructorID` (`string`, required): Reference ID.
- `UserID` (`string`, required): Reference to User profile credentials.
- `email` (`string <email>`, required): Primary contact email.
- `first_name` (`string`, required): First name.
- `last_name` (`string`, required): Last name.
- `flight_rate` (`string`, required): Per-hour rate for flight instruction.
- `classroom_rate` (`string`, required): Per-hour rate for ground/classroom instruction.
- `aircraft_checkouts` (`Array of strings or null`, optional): List of aircraft IDs this instructor is certified to teach in.
- `enabled` (`string`, required): Verification status flag. Enum: `"0"` (disabled), `"1"` (enabled).

---

## 7. Reservation / Schedule
An active slot reservation on the scheduler calendar. It may book an aircraft, an instructor, or both for a specified duration.

### Main Attributes
- `ID` (`string`, required): Schedule identifier (hash string).
- `FboID` (`string`, required): FBO organization identifier.
- `AircraftID` (`string or null`, optional): Booked aircraft identifier.
- `InstructorID` (`string or null`, optional): Booked instructor identifier.
- `UserID` (`string`, required): Pilot/Student identifier.
- `arrival_date` (`string <date-time>`, required): Reservation end time (UTC ISO 8601).
- `depart_date` (`string <date-time>`, required): Reservation start time (UTC ISO 8601).
- `reservation_type` (`string`, required): Type label (e.g., `Primary`, `Standby`, `Maintenance`).
- `pilot_name` (`string`, required): Main pilot name.
- `dispatched` (`string or null`, optional): Timestamp of dispatch.
- `checkedin` (`string or null`, optional): Timestamp of checkin/completion.

---

## 8. Flight Record
The log entry generated when a Reservation completes check-in. It records actual times, engine hours (Tach and Hobbs), and charges.

### Main Attributes
- `CheckinID` (`string`, required): Unique check-in identifier.
- `ScheduleID` (`string`, required): Parent Reservation schedule identifier.
- `checkin_date` (`string <date-time>`, required): Completion timestamp.
- `arrival_date` (`string <date-time>`, required): Reservation arrival timestamp.
- `depart_date` (`string <date-time>`, required): Reservation departure timestamp.
- `hobbs_out` (`string or null`, optional): Engine start hobbs value.
- `hobbs_in` (`string or null`, optional): Engine end hobbs value.
- `tach_out` (`string or null`, optional): Engine start tachometer value.
- `tach_in` (`string or null`, optional): Engine end tachometer value.
- `aircraft_charge` (`string or null`, optional): Total cost billed for aircraft use.
- `instructor_flight_time` (`string or null`, optional): Hours billed for flight instruction.
- `instructor_flight_time_charge` (`string or null`, optional): Flight instruction fee.
- `instructor_ground_time_charge` (`string or null`, optional): Ground instruction fee.

---

## 9. Cancellation
A log documenting a cancelled reservation slot, including cancellation timestamps and reasons.

### Main Attributes
- `ScheduleID` (`string`, required): Original Reservation schedule identifier.
- `UserID` (`integer`, required): Student/Pilot identifier.
- `CancelledByID` (`integer`, required): User identifier of the person performing the cancellation.
- `cancelled_by` (`string`, required): Full name of the user who performed the cancellation.
- `cancelled_date` (`string <date-time>`, required): Cancellation timestamp.
- `depart_date` (`string <date-time>`, required): Original start time.
- `return_date` (`string <date-time>`, required): Original end time.
- `cancellation_reason` (`string or null`, optional): Reason code/reason category.
- `cancellation_notes` (`string or null`, optional): Optional explanation.

---

## 10. Ledger Entry
A single financial transaction item representing a charge, payment, or adjustment logged to a user's ledger account.

### Main Attributes
- `InvoiceID` (`string`, required): Parent invoice transaction code.
- `entry_type` (`string`, required): Entry category. Enum: `"Charge"`, `"Payment"`, `"Adjustment"`.
- `entry_date` (`string <date-time>`, required): Transaction timestamp.
- `amount` (`string`, required): Net transaction value (inclusive of taxes and quantities).
- `user` (`string`, required): Full name of the account holder.
- `adjustment_type` (`string or null`, optional): Enum: `"Credit"`, `"Debit"`.
- `AdjustmentID` (`string or null`, optional): Scoped reference code.
- `taxes_object` (`Array of TaxObject`, optional): Item-level tax calculations.
- `global_taxes_object` (`Array of TaxObject`, optional): Global tax calculations.

---

## 11. Store Item
A configured retail product, course material, accessory, or service item sold through the FBO store.

### Main Attributes
- `ID` (`string`, required): Product code identifier.
- `name` (`string`, required): Display name.
- `price` (`string`, required): Standard unit price.
- `unit` (`string`, required): Sale quantity unit (e.g. `"Each"`, `"Gallon"`).
- `enabled` (`string`, required): Status flag. Enum: `"0"` (disabled), `"1"` (enabled).
- `taxes` (`Array of ItemStoreTax`, optional): Configured sales tax rules.

---

## 12. Adjustment Type
A financial category definition used by administrators to credit or debit user balances.

### Main Attributes
- `ID` (`string`, required): Reference ID.
- `name` (`string`, required): Name of adjustment category (e.g. `"CFI Rebate"`, `"Fuel Credit"`).
- `sign` (`string`, required): Financial direction. Enum: `"Credit"`, `"Debit"`.
- `percentage` (`string`, required): Value type. `"1"` if percentage-based, `"0"` if fixed dollar amount.
- `enabled` (`string`, required): Operational status flag. Enum: `"0"` (disabled), `"1"` (enabled).

---

## 13. Service Type
A configured inspection type or maintenance protocol definition that is tracked against FBO aircraft.

### Main Attributes
- `ID` (`string`, required): Reference identifier (hash string).
- `label` (`string`, required): Inspection title (e.g., `"50 Hour Oil Change"`).
- `required` (`string`, required): Urgency category. Enum: `"Optional"`, `"Suggested"`, `"Required"`.
- `entry_type` (`string`, required): Data format logged. Enum: `"Number"`, `"Text"`, `"Number (cumulative)"`, `"Checkbox"`.
- `aircraft` (`Array of strings`, required): List of AircraftIDs subject to this service.

---

## 14. Service Log Entry
A completed maintenance log record documenting inspections or actions completed on an aircraft.

### Main Attributes
- `ID` (`string`, required): Log record identifier.
- `ServiceID` (`string`, required): Reference Service Type identifier.
- `AircraftID` (`string`, required): Target aircraft identifier.
- `User` (`string`, required): Full name of the user logging the maintenance action.
- `tracker_value` (`string or null`, optional): Reading inputted.
- `total_tracker_value` (`string or null`, optional): Updated cumulative tracker meter.
- `created` (`string`, required): Record timestamp in format `YYYY-MM-DD HH:MM:SS`.
- `hobbs` (`number or null`, optional): Hobbs meter value at service.
- `tach` (`number or null`, optional): Tachometer value at service.

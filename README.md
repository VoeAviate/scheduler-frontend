# Aviate Scheduler Frontend

Aviate Scheduler is a specialized web application designed for pilot students to manage their availability for upcoming flight instruction sessions. It facilitates a streamlined scheduling process between students and administrators, ensuring efficient allocation of instructors and aircraft for training missions.

## Project Overview

The system allows administrators to configure training parameters and release monthly schedules, while pilot students can log in to define their availability. The backend uses this input to propose optimized schedules.

### Key Features

* **Role-Based Views:** Tailored experiences for `Students` and `Administrators`.
* **Interactive Calendar:** A weekly-based calendar view for students to select availability blocks (drag-and-drop or point-and-click).
* **Availability Management:** Support for both specific monthly selections and "Default Availability" settings that can be applied to entire months.
* **Responsive Design:** Fluid UI optimized for desktop and mobile devices.
* **Localization:** Full support for English and Portuguese.
* **Resilient API:** Implements exponential back-off strategies for robust communication.

## Technical Stack

* **Framework:** Angular (TypeScript)
* **API Integration:** OAuth2 (via FlightCircle)
* **Date/Time Handling:** Standardized ISO 8601 formatting, UTC storage, and localized rendering using `date-fns` and `Intl.DateTimeFormat`.
* **Logging:** Integrated Google Analytics and application-level logging with a production mode toggle.

## Architecture

The application follows a modular architecture:
* **Components:** Distinct HTML and TypeScript files for UI elements.
* **Data Layer:** An abstracted service layer handles all API CRUD operations and state management.
* **Caching:** Client-side state persistence using `localStorage`.

## Getting Started

*(Note: Add specific setup instructions here, e.g., how to install dependencies and run the development server.)*

### Prerequisites
* Angular CLI
* Node.js

### Installation
1. Clone the repository: `git clone <repository-url>`
2. Install dependencies: `npm install`
3. Run development server: `ng serve`

## System Constraints

* **Performance:** Optimized for up to 50 concurrent students and 3 administrators.
* **Persistence:** Availability selections are cached locally to handle connectivity drops.
* **UX:** Asynchronous operations are supported by visual loading states and confirmation notifications.

## License

This project is proprietary software developed for the Aviate Scheduler training program.

# Aviate Scheduler Frontend

[![codecov](https://codecov.io/gh/VoeAviate/scheduler-frontend/graph/badge.svg)](https://codecov.io/gh/VoeAviate/scheduler-frontend)

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

Follow these instructions to set up, run, and test the Aviate Scheduler frontend on your local development machine.

### Prerequisites

You need the following software installed:
* **Node.js**: Version `22.x` or later (tested with `24.x`).
* **npm**: Version `10.x` or later (tested with `11.x`).

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd scheduler-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Configuration

The application requires several environment variables to communicate with Flight Circle and the Backend API. These are defined in a `.env` file at the root of the project:

```env
# Flight Circle API Client Credentials (registered with Flight Circle)
FLIGHT_CIRCLE_CLIENT_ID="your_flight_circle_client_id"
FLIGHT_CIRCLE_CLIENT_SECRET="your_flight_circle_client_secret"

# Backend endpoint
BACKEND_API_URL="http://localhost:3000/api"

# Redirect URI for Flight Circle OAuth2 flow
FLIGHT_CIRCLE_REDIRECT_URI="http://localhost:4200/auth/callback"
```

During development, these variables are injected into the build via Angular's builder configuration. Make sure to verify your `.env` file at the root of your project matches the requirements.

### Running Locally

To start the local development server, run:
```bash
npm start
```
or:
```bash
ng serve
```

Once the server is running, navigate to `http://localhost:4200/` in your browser. The application will automatically reload if you modify any of the source files.

### Testing

Unit testing is powered by **Vitest** and **jsdom**.

* **Run tests in interactive watch mode** (re-runs on file changes):
  ```bash
  npm test
  ```
* **Run tests once and exit** (useful for CI pipelines):
  ```bash
  npm run test -- --watch=false
  ```
* **Run with test coverage report**:
  Coverage collection is enabled by default via the `v8` provider. Reports are generated in the `coverage/` directory.

### Debugging

* **Source Maps**: Enabled by default in development mode. You can inspect and debug the original TypeScript files directly within browser developer tools (e.g., Chrome DevTools).
* **Bypass Credentials**: For local development and testing without an active Flight Circle OAuth connection, the login screen includes a "Bypass credentials" section that logs you in with mock `STUDENT` or `ADMINISTRATOR` sessions.

### Building for Production

To compile the production bundles, run:
```bash
npm run build
```
The compiled files will be saved in the `dist/` directory. By default, the production build applies minification, bundle optimization, and caches hashing for optimal speed and size.

## System Constraints

* **Performance:** Optimized for up to 50 concurrent students and 3 administrators.
* **Persistence:** Availability selections are cached locally to handle connectivity drops.
* **UX:** Asynchronous operations are supported by visual loading states and confirmation notifications.

## License

This project is proprietary software developed for the Aviate Scheduler training program.

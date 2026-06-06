# Aviate Scheduler Frontend

## Overview

The application is called Aviate Scheduler. It makes easier for pilot students to select their availability for next flight instruction sessions to be scheduled. Through this application, students are able to select their availability before the next month starts, the administrator is able to configure a minimal set of parameters to restrict user selections. The goal that is that the backend application will be able to propose a schedule that allocates `instructors` to `students` in `aircrafts` for the next missions of the training program the `student` is participating in.

### Main Entities of the System
- `Student`: is a person that is enrolled in a training program and is able to log into the application to select their availability of the next month.
- `Administrator`: is a person capable of logging into the application and configure the application parameters.
- `Instructor`: is a person that is not able to log into the application, but have parameters to be set by the `Administrator` in the Administration panel.
- `Aircraft`: is the aircraft with which the `Student` have its missions with an `Instructor` in a given schedule.
- `Schedule`: is a time range in a day that has the `presentation time` and `end time`. Between those times, the `Student` is expected to present themselves for the mission, have the `Briefing` time with the instructor, have their flight class (called `Mission`) in a `Aircraft`, and have a `Debriefing` time with the instructor.
- `Mission`: it is the subset of the `Schedule` in which the practical class take place.

## Technical Stack

The Aviate Scheduler app is Angular-based, using TypeScript as the programming language.

### Technical guidelines

- The application must be implemented in a modular way, making it easier for debuggability and maintainability. Each Angular component have its own `.html` and the `.ts` files.
- There must be different layers of abstraction: the view components, the service components (responsible for communicating with the backend application).
- The application is also connected to Google Analytics, logging each action and event a user performs within the application.

## Roles

There are different roles that will have access to the application. Each role will have its own view on the app.

### The `Administrator` role

The administrator role, when logged in, is responsible for managing the release of a month so students are able to login and set their availability preferences.

### The `Student` role

Students are able to log into the application using a thirdparty OAuth2 flow, provided by FlightCircle. When any administrator releases a monthly schedule, students are able to login and see the release month, which happens usually 10-15 days before the month starts. In the main view, students have access to a weekly-based calendar of the released month. They are able

## Functional requirements

### Login

The login of users is made via OAuth2 flow provided by a third-party service (FlightCircle).

### Administrator View

Administrators can:
- Release the next month, which will trigger notifications to users via email and WhatsApp.
- Configure start time and end time for each day. That usually comes from the working hours, it must be default to 6am to 9pm.
- Configure minimum intervals in between the usage of aircrafts.
- See students who are missing to set up their availability for the next month.
- Double check policy of instructors in terms of regulatory days off.

### Students View

Users will see the `Calendar` component and the `Availability Summary` of their selections of the current month. The availability selection summary is displayed on the right pane while the calendar is the central component of the screen. 

The calendar component shows a weekly-based calendar with 1-hour blocks ranging from the `start time` and `end time` set by the administrator. The calendar shows the weeks of the released month. The calendar component header has the month displayed in the top with arrows to allow users to navigate through the weeks. It is imperative that only days of the released months are available for users to select.

Once the `Student` finishes selecting their avaliability for the next month, they can click on `Confirm Availability` button that is displayed at the bottom of the availability summary panel. A modal will show up with the disclaimer that the schedule can't be changed after submitting and shows the summary of the selected availability.

`Student`s also have the possibility of selecting a `Default Availability Setting` that is a week-based schedule, that will be applied to the entire month. There is a button on the menu `Default Availability` that will take the `Student` to a new view that has a similar calendar panel, but it only contains a week, from Sunday to Saturday. `Student` is then able to select the 1-hour blocks they are available for classes, and they can save their preferences.

At the bottom of the `Availability Summary`, `Student`s who have set their `Default Availability` have a button to `Apply Default Availability` that will apply their availability settings week by week, respecting the week days previously set by the `Student`.

## Localization

The application can be used in English or Portuguese. All labels are translated to reflect user's preference.

## UI Requirements and Guidelines

### Color Palette

The website must be implemented using the core theme based on a darker navy blue (#000080) and follow a ligher theme.

### Smoothness and transitions

Actions like must be smooth and animated using transitions. For example, clicking on the menu button will animate the menu opening.

### User navigation

The application have a fixed top bar that does *NOT* overlap with any other UI items. It contains the following items:
- The Aviate logo at the left side of the bar.
- A language toggle to allow users to switch the language they are using the app in.
- A hamburger-style button that displays a menu:
  - For students, the menu shows their profile picture, their name, and their current training program.
  - For administrators, the menu shows their profile picture, their name, and the `ADMINISTRATOR` role label.

### Main Student View

The main student's view is composed of a weekly-based calendar with one hour blocks ranging between the start time and end time set by the administrator. Students are able to click and select their availability hours for each week by clicking and holding their mouse left button to select range of hours in which they are available to take lessons.

The calendar has the name and the year at the top. There are left and right arrows to allow students to move to the next week and the previous week. **It is imperative that previous and next week buttons are only available if they are within the released month.** In other to keep the calendar component size, each week page **MUST** have 7 days, if days of the month are over, days are grayed out and can't be selected by the user.

There is a panel on the right that summarizes students selections, grouping ranges of hours within the same day. The calendar component must occupy most part of the page while the selection summary must take less space.


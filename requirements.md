# Requirements Document

## Introduction

TransitOps is a Smart Transport Operations Platform that digitizes vehicle, driver, dispatch, maintenance, and expense management for logistics companies. It replaces spreadsheets and manual logbooks with a single web application that enforces operational business rules, automates status transitions across the fleet, and surfaces operational insights through dashboards and analytics.

The platform serves four operational roles (Fleet Manager, Driver, Safety Officer, Financial Analyst) through role-based access control and provides nine functional areas: authentication, an operational dashboard, a vehicle registry, driver management, trip dispatch, maintenance, fuel and expense tracking, and reports and analytics. The system's core value is the enforcement of mandatory business rules (uniqueness, eligibility, capacity, and automatic status transitions) with visible, explainable validation, delivered through a premium, responsive web interface.

This document defines the functional and quality requirements for TransitOps. Implementation details (framework structure, component libraries, styling) are deferred to the design phase.

## Glossary

- **System**: The TransitOps platform as a whole, including its web interface, business-rule engine, and data store.
- **Auth_Service**: The component responsible for user authentication and session management.
- **Access_Control**: The component that enforces role-based permissions on resources and actions.
- **Dashboard**: The operational overview screen that displays key performance indicators and filters.
- **Vehicle_Registry**: The component that manages the master list of vehicles and their attributes.
- **Driver_Registry**: The component that manages driver profiles and their attributes.
- **Dispatch_Service**: The component that manages trip creation, validation, and lifecycle transitions.
- **Maintenance_Service**: The component that manages maintenance records and associated vehicle status changes.
- **Expense_Service**: The component that manages fuel logs and other expense records and computes operational cost.
- **Analytics_Service**: The component that computes fuel efficiency, fleet utilization, operational cost, and ROI metrics.
- **Export_Service**: The component that generates downloadable report files.
- **Reminder_Service**: The component that generates notifications for expiring driver licenses.
- **User**: An authenticated person interacting with the System through an assigned Role.
- **Role**: A named set of permissions. Valid roles are Fleet_Manager, Driver, Safety_Officer, and Financial_Analyst.
- **Fleet_Manager**: A Role responsible for fleet assets, maintenance, vehicle lifecycle, and operational efficiency.
- **Driver_Role**: A Role responsible for creating trips, assigning vehicles and drivers, and monitoring active deliveries.
- **Safety_Officer**: A Role responsible for driver compliance, license validity, and safety scores.
- **Financial_Analyst**: A Role responsible for reviewing operational expenses, fuel consumption, maintenance costs, and profitability.
- **Vehicle**: A fleet asset with a unique Registration_Number and a Vehicle_Status. A Vehicle has a Region attribute identifying the Vehicle's home/current zone.
- **Registration_Number**: A unique identifier assigned to a Vehicle.
- **Maximum_Load_Capacity**: The maximum cargo weight in kilograms that a Vehicle is permitted to carry.
- **Odometer**: The recorded distance reading of a Vehicle in kilometers.
- **Acquisition_Cost**: The purchase cost of a Vehicle in the System's configured currency.
- **Vehicle_Status**: The lifecycle state of a Vehicle. Valid values are Available, On_Trip, In_Shop, and Retired.
- **Driver**: A person eligible to operate vehicles, with a Driver_Status and a license record.
- **License_Number**: The identifier of a Driver's operating license.
- **License_Category**: The classification of vehicles a Driver's license permits operating.
- **License_Expiry_Date**: The calendar date after which a Driver's license is no longer valid.
- **Safety_Score**: A numeric measure of a Driver's safety performance ranging from 0 to 100.
- **Driver_Status**: The lifecycle state of a Driver. Valid values are Available, On_Trip, Off_Duty, and Suspended.
- **Expired_License**: A license whose License_Expiry_Date is earlier than the current date.
- **Trip**: A dispatch record linking a Vehicle and a Driver to a route with a Trip_Status. A Trip has a Region attribute for its source and a Region attribute for its destination.
- **Trip_Status**: The lifecycle state of a Trip. Valid values are Draft, Dispatched, Completed, and Cancelled.
- **Cargo_Weight**: The weight in kilograms of the cargo assigned to a Trip.
- **Planned_Distance**: The estimated distance in kilometers for a Trip.
- **Eligible_Vehicle**: A Vehicle whose Vehicle_Status is Available.
- **Eligible_Driver**: A Driver whose Driver_Status is Available and whose license is not an Expired_License.
- **Maintenance_Log**: A record of a maintenance activity performed on a Vehicle, with an Open or Closed state.
- **Fuel_Log**: A record of fuel added to a Vehicle, containing liters, cost, and date.
- **Expense_Record**: A record of a non-fuel operational cost such as a toll or maintenance charge.
- **Operational_Cost**: The sum of fuel cost and maintenance cost attributed to a Vehicle.
- **Fuel_Efficiency**: A Vehicle's distance traveled divided by fuel consumed, expressed in kilometers per liter.
- **Fleet_Utilization**: The percentage of vehicles in the fleet whose Vehicle_Status is On_Trip.
- **Vehicle_ROI**: Return on investment, computed as (Revenue minus (Maintenance cost plus Fuel cost)) divided by Acquisition_Cost.
- **KPI**: A key performance indicator displayed on the Dashboard.
- **Command_Palette**: A keyboard-activated navigation and action search interface.
- **Demo_Mode**: A guided walkthrough of the example operational workflow using seeded data.
- **Region**: A named geographic zone assigned to a Vehicle and to a Trip's source and destination, used for grouping and proximity ranking. Every Vehicle has exactly one Region attribute; every Trip source and destination has a Region.
- **Disruption_Event**: A user-triggered event indicating that an On_Trip Vehicle or a Driver assigned to a Dispatched Trip has become unavailable. Types: Vehicle_Breakdown, Emergency_Maintenance, Driver_Unavailable.
- **Recovery_Service**: The component that detects Disruption_Events, identifies affected Dispatched Trips, ranks replacement candidates, and executes the recovery action.
- **Replacement_Candidate**: An Eligible_Vehicle and Eligible_Driver pair proposed as a substitute for a disrupted Trip's original Vehicle and Driver.
- **Recovery_Score**: A numeric score assigned to a Replacement_Candidate used to rank candidates. Higher is better.
- **At_Risk_Trip**: A Dispatched Trip for which the Recovery_Service found no valid Replacement_Candidate.

## Requirements

### Requirement 1: Authentication

**User Story:** As a fleet operations staff member, I want to log in securely with my email and password, so that only authorized personnel can access operational data.

#### Acceptance Criteria

1. WHEN an unauthenticated User requests any application page other than the login page, THE Auth_Service SHALL redirect the User to the login page within 2 seconds.
2. WHEN a User submits a login form with an email of 1 to 254 characters and a password of 8 to 128 characters that match a stored User credential, THE Auth_Service SHALL create an authenticated session and grant access to the application within 3 seconds.
3. IF a User submits a login form with an email or password that does not match a stored User credential, THEN THE Auth_Service SHALL, as a single atomic operation, reject the login, leave the session unauthenticated, and display the message "Invalid email or password", such that the login is not treated as rejected unless the error message is also displayed.
4. THE Auth_Service SHALL store User passwords using a one-way cryptographic hash with a unique per-password salt of at least 16 bytes.
5. WHEN a User submits a login form with an empty email field or an empty password field, THE Auth_Service SHALL reject the submission, leave the session unauthenticated, and display a message identifying the specific missing field.
6. WHEN an authenticated User selects the logout action, THE Auth_Service SHALL terminate the session and redirect the User to the login page within 2 seconds.
7. IF a User submits 5 consecutive login attempts with non-matching credentials for the same email within a 15-minute window, THEN THE Auth_Service SHALL lock that account for 15 minutes and display a message indicating the account is temporarily locked.
8. WHEN an authenticated session remains idle for 30 minutes, THE Auth_Service SHALL terminate the session and redirect the User to the login page on the next request.

### Requirement 2: Role-Based Access Control

**User Story:** As a fleet operations administrator, I want each user to see and act only within their role, so that responsibilities and data access are properly separated.

#### Acceptance Criteria

1. THE Access_Control SHALL assign exactly one Role to each User from the set {Fleet_Manager, Driver_Role, Safety_Officer, Financial_Analyst}.
2. WHEN an authenticated User requests a resource, THE Access_Control SHALL permit the request only if the User's Role includes permission for the requested resource and action.
3. IF an authenticated User requests an action not permitted for the User's Role, THEN THE Access_Control SHALL deny the action and display the message "You do not have permission to perform this action".
4. WHERE a User's Role is Financial_Analyst, THE Access_Control SHALL permit read access to reports, expenses, and analytics and SHALL deny write access to vehicles, drivers, and trips.
5. WHERE a User's Role is Safety_Officer, THE Access_Control SHALL permit write access to driver compliance attributes and SHALL permit read access to trips and vehicles.
6. WHERE a User's Role is Fleet_Manager, THE Access_Control SHALL permit write access to vehicles and maintenance records.
7. WHERE a User's Role is Driver_Role, THE Access_Control SHALL permit creation and dispatch of trips.

### Requirement 3: Operational Dashboard

**User Story:** As a fleet manager, I want a dashboard of key performance indicators, so that I can assess fleet health at a glance.

#### Acceptance Criteria

1. WHEN an authenticated User opens the Dashboard, THE Dashboard SHALL display the count of vehicles whose Vehicle_Status is On_Trip labeled "Active Vehicles".
2. WHEN an authenticated User opens the Dashboard, THE Dashboard SHALL display the count of vehicles whose Vehicle_Status is Available labeled "Available Vehicles".
3. WHEN an authenticated User opens the Dashboard, THE Dashboard SHALL display the count of vehicles whose Vehicle_Status is In_Shop labeled "Vehicles in Maintenance".
4. WHEN an authenticated User opens the Dashboard, THE Dashboard SHALL display the count of trips whose Trip_Status is Dispatched labeled "Active Trips".
5. WHEN an authenticated User opens the Dashboard, THE Dashboard SHALL display the count of trips whose Trip_Status is Draft labeled "Pending Trips".
6. WHEN an authenticated User opens the Dashboard, THE Dashboard SHALL display the count of drivers whose Driver_Status is On_Trip labeled "Drivers On Duty".
7. WHEN an authenticated User opens the Dashboard, THE Dashboard SHALL display Fleet_Utilization as a percentage computed as the count of vehicles with Vehicle_Status On_Trip divided by the total count of vehicles whose Vehicle_Status is not Retired, multiplied by 100 and rounded to one decimal place.
8. IF the total count of vehicles whose Vehicle_Status is not Retired is zero, THEN THE Dashboard SHALL display Fleet_Utilization as "0.0%".
9. WHEN a User selects any combination of a vehicle type filter, a status filter, or a region filter on the Dashboard, THE Dashboard SHALL recompute each displayed KPI using only the records that match all of the currently selected filters combined with logical AND.
10. WHEN a User clears all Dashboard filters, THE Dashboard SHALL recompute each displayed KPI using all non-Retired records.
11. WHEN an authenticated User opens the Dashboard and the number of records matching a count KPI's criteria is zero, THE Dashboard SHALL display that KPI as the integer "0".
12. WHEN an authenticated User opens the Dashboard, THE Dashboard SHALL display all count KPIs and the Fleet_Utilization KPI within 3 seconds of the open request.
13. IF the data required to compute any displayed KPI cannot be retrieved, THEN THE Dashboard SHALL display an error indication in place of the affected KPI value identifying that the KPI is unavailable, and SHALL continue to display all KPIs whose data was successfully retrieved.

### Requirement 4: Vehicle Registry

**User Story:** As a fleet manager, I want to maintain a master list of vehicles, so that fleet assets are tracked accurately.

#### Acceptance Criteria

1. WHEN a Fleet_Manager submits a new Vehicle with a Registration_Number, Vehicle Name, Vehicle Model, Type, Maximum_Load_Capacity, Odometer, and Acquisition_Cost, THE Vehicle_Registry SHALL create the Vehicle with Vehicle_Status set to Available.
2. IF a Fleet_Manager submits a new Vehicle with a Registration_Number that matches an existing Vehicle's Registration_Number, THEN THE Vehicle_Registry SHALL reject the submission and display the message "Registration number already exists".
3. WHEN a Fleet_Manager submits a Vehicle with a Maximum_Load_Capacity that is less than or equal to zero, THE Vehicle_Registry SHALL reject the submission and display the message "Maximum load capacity must be greater than zero".
4. WHEN a Fleet_Manager submits a Vehicle with an Odometer value that is less than zero, THE Vehicle_Registry SHALL reject the submission and display the message "Odometer cannot be negative".
5. WHEN a Fleet_Manager submits a Vehicle with an Acquisition_Cost that is less than or equal to zero, THE Vehicle_Registry SHALL reject the submission and display the message "Acquisition cost must be greater than zero".
6. WHEN a Fleet_Manager updates an existing Vehicle's editable attributes, THE Vehicle_Registry SHALL persist the updated attributes.
7. WHEN a Fleet_Manager sets a Vehicle's Vehicle_Status to Retired, THE Vehicle_Registry SHALL persist the Retired status and retain the Vehicle record.
8. THE Vehicle_Registry SHALL restrict a Vehicle's Vehicle_Status to one of {Available, On_Trip, In_Shop, Retired}.
9. WHEN an authenticated User opens the Vehicle_Registry, THE Vehicle_Registry SHALL display each Vehicle's Registration_Number, Vehicle Name, Model, Type, Maximum_Load_Capacity, Odometer, Acquisition_Cost, and Vehicle_Status.

### Requirement 5: Driver Management

**User Story:** As a safety officer, I want to maintain driver profiles with license details, so that driver compliance can be monitored.

#### Acceptance Criteria

1. WHEN a User with write access to drivers submits a new Driver with a Name, License_Number, License_Category, License_Expiry_Date, Contact Number, and Safety_Score, THE Driver_Registry SHALL create the Driver with Driver_Status set to Available.
2. WHEN a User submits a Driver with a Safety_Score that is less than 0 or greater than 100, THE Driver_Registry SHALL reject the submission and display the message "Safety score must be between 0 and 100".
3. WHEN a User updates an existing Driver's editable attributes, THE Driver_Registry SHALL persist the updated attributes.
4. WHEN a Safety_Officer sets a Driver's Driver_Status to Suspended, THE Driver_Registry SHALL persist the Suspended status.
5. THE Driver_Registry SHALL restrict a Driver's Driver_Status to one of {Available, On_Trip, Off_Duty, Suspended}.
6. WHEN an authenticated User opens the Driver_Registry, THE Driver_Registry SHALL display each Driver's Name, License_Number, License_Category, License_Expiry_Date, Contact Number, Safety_Score, and Driver_Status.
7. WHILE a Driver's License_Expiry_Date is earlier than or equal to the current date, THE Driver_Registry SHALL display a compliance indicator identifying the Driver's license as expired.
8. IF the compliance indicator for an Expired_License fails to display, THEN THE Driver_Registry SHALL prevent driver operations for that Driver until the compliance indicator is displayed.

### Requirement 6: Trip Creation and Dispatch Eligibility

**User Story:** As a driver, I want to create trips by selecting an eligible vehicle and driver, so that only valid dispatches are scheduled.

#### Acceptance Criteria

1. WHEN a User creates a Trip with a source, destination, Cargo_Weight, and Planned_Distance, THE Dispatch_Service SHALL create the Trip with Trip_Status set to Draft.
2. WHEN a User opens the vehicle selection control for a Trip, THE Dispatch_Service SHALL include a Vehicle in the selectable list only if the Vehicle's Vehicle_Status is Available.
3. WHEN a User opens the vehicle selection control for a Trip, THE Dispatch_Service SHALL exclude every Vehicle whose Vehicle_Status is Retired, In_Shop, or On_Trip from the selectable list.
4. WHEN a User opens the driver selection control for a Trip, THE Dispatch_Service SHALL include a Driver in the selectable list only if the Driver's Driver_Status is Available and the Driver's License_Expiry_Date is not earlier than the current date.
5. WHEN a User opens the driver selection control for a Trip, THE Dispatch_Service SHALL exclude every Driver whose Driver_Status is Suspended, Off_Duty, or On_Trip from the selectable list.
6. WHEN a User opens the driver selection control for a Trip, THE Dispatch_Service SHALL exclude every Driver whose License_Expiry_Date is earlier than the current date from the selectable list.
7. IF a User attempts to dispatch a Trip whose Cargo_Weight exceeds the selected Vehicle's Maximum_Load_Capacity, THEN THE Dispatch_Service SHALL reject the dispatch and display the message "Cargo weight exceeds vehicle maximum load capacity".
8. IF a User attempts to dispatch a Trip whose selected Vehicle's Vehicle_Status is not Available, THEN THE Dispatch_Service SHALL reject the dispatch and display the message "Selected vehicle is not available".
9. IF a User attempts to dispatch a Trip whose selected Driver's Driver_Status is not Available, THEN THE Dispatch_Service SHALL reject the dispatch and display the message "Selected driver is not available".
10. IF a User attempts to dispatch a Trip whose selected Driver's License_Expiry_Date is earlier than the current date, THEN THE Dispatch_Service SHALL reject the dispatch and display the message "Selected driver's license has expired".

### Requirement 7: Trip Lifecycle and Automatic Status Transitions

**User Story:** As a driver, I want vehicle and driver statuses to update automatically as trips progress, so that the fleet state stays accurate without manual updates.

#### Acceptance Criteria

1. THE Dispatch_Service SHALL restrict a Trip's Trip_Status to one of {Draft, Dispatched, Completed, Cancelled}.
2. WHEN a User dispatches a Trip whose Trip_Status is Draft and whose eligibility checks pass, THE Dispatch_Service SHALL set the Trip's Trip_Status to Dispatched.
3. WHEN a Trip transitions to Dispatched, THE Dispatch_Service SHALL set the assigned Vehicle's Vehicle_Status to On_Trip.
4. WHEN a Trip transitions to Dispatched, THE Dispatch_Service SHALL set the assigned Driver's Driver_Status to On_Trip.
5. WHEN a User completes a Trip whose Trip_Status is Dispatched and provides a final Odometer reading and fuel consumed, THE Dispatch_Service SHALL set the Trip's Trip_Status to Completed.
6. WHEN a Trip transitions to Completed, THE Dispatch_Service SHALL set the assigned Vehicle's Vehicle_Status to Available.
7. WHEN a Trip transitions to Completed, THE Dispatch_Service SHALL set the assigned Driver's Driver_Status to Available.
8. WHEN a Trip transitions to Completed, THE Dispatch_Service SHALL update the assigned Vehicle's Odometer to the provided final Odometer reading.
9. WHEN a User cancels a Trip whose Trip_Status is Dispatched, THE Dispatch_Service SHALL set the Trip's Trip_Status to Cancelled, set the assigned Vehicle's Vehicle_Status to Available, and set the assigned Driver's Driver_Status to Available.
10. WHEN a User cancels a Trip whose Trip_Status is Draft, THE Dispatch_Service SHALL set the Trip's Trip_Status to Cancelled without changing the assigned Vehicle's or Driver's status.
11. IF a User attempts a Trip_Status transition other than Draft-to-Dispatched, Draft-to-Cancelled, Dispatched-to-Completed, Dispatched-to-Cancelled, or Completed-to-Dispatched, THEN THE Dispatch_Service SHALL reject the transition and display the message "Invalid trip status transition".
12. WHEN a User transitions a Trip whose Trip_Status is Completed back to Dispatched to correct a trip marked completed by mistake, THE Dispatch_Service SHALL set the Trip's Trip_Status to Dispatched, set the assigned Vehicle's Vehicle_Status to On_Trip, and set the assigned Driver's Driver_Status to On_Trip.

### Requirement 8: Maintenance Workflow

**User Story:** As a fleet manager, I want creating a maintenance record to take a vehicle out of the dispatch pool automatically, so that vehicles under service are never scheduled.

#### Acceptance Criteria

1. WHEN a Fleet_Manager creates a Maintenance_Log for a Vehicle with a description, cost, and date, THE Maintenance_Service SHALL create the Maintenance_Log in the Open state.
2. WHEN a Maintenance_Log for a Vehicle enters the Open state, THE Maintenance_Service SHALL set that Vehicle's Vehicle_Status to In_Shop.
3. WHILE a Vehicle has a Maintenance_Log in the Open state, THE Dispatch_Service SHALL exclude that Vehicle from the vehicle selection control.
4. IF a Fleet_Manager attempts to create a Maintenance_Log for a Vehicle whose Vehicle_Status is On_Trip, THEN THE Maintenance_Service SHALL reject the creation and display the message "Cannot start maintenance on a vehicle that is on a trip".
5. WHEN a Fleet_Manager closes a Maintenance_Log for a Vehicle whose Vehicle_Status is not Retired, THE Maintenance_Service SHALL set the Maintenance_Log to the Closed state and set that Vehicle's Vehicle_Status to Available.
6. WHEN a Fleet_Manager closes a Maintenance_Log for a Vehicle whose Vehicle_Status is Retired, THE Maintenance_Service SHALL set the Maintenance_Log to the Closed state and retain the Vehicle's Retired status.
7. WHEN an authenticated User opens the maintenance view, THE Maintenance_Service SHALL display each Maintenance_Log's Vehicle Registration_Number, description, cost, date, and state.

### Requirement 9: Fuel and Expense Management

**User Story:** As a financial analyst, I want to record fuel and expenses per vehicle, so that operational cost is tracked accurately.

#### Acceptance Criteria

1. WHEN a User records a Fuel_Log for a Vehicle with liters, cost, and date, THE Expense_Service SHALL create the Fuel_Log associated with that Vehicle.
2. WHEN a User records a Fuel_Log with liters less than or equal to zero, THE Expense_Service SHALL reject the submission and display the message "Fuel quantity must be greater than zero".
3. WHEN a User records a Fuel_Log with a fuel quantity greater than zero, THE Expense_Service SHALL explicitly record that the fuel quantity validation passed for that Fuel_Log.
4. WHEN a User records an Expense_Record for a Vehicle with a category, cost, and date, THE Expense_Service SHALL create the Expense_Record associated with that Vehicle.
5. WHEN a User records a Fuel_Log or an Expense_Record with a cost less than zero, THE Expense_Service SHALL reject the submission and display the message "Cost cannot be negative", validating only the cost of the record being submitted.
6. THE Expense_Service SHALL compute a Vehicle's Operational_Cost as the sum of the costs of all Fuel_Logs associated with that Vehicle plus the sum of the costs of all Maintenance_Logs associated with that Vehicle.
7. WHEN a User records, updates, or deletes a Fuel_Log or an Expense_Record for a Vehicle, THE Expense_Service SHALL recompute that Vehicle's Operational_Cost.
8. WHEN an authenticated User opens the fuel and expense view, THE Expense_Service SHALL display each Vehicle's total fuel cost, total maintenance cost, and Operational_Cost.

### Requirement 10: Reports and Analytics

**User Story:** As a financial analyst, I want efficiency, utilization, cost, and ROI reports, so that I can evaluate fleet profitability.

#### Acceptance Criteria

1. THE Analytics_Service SHALL compute a Vehicle's Fuel_Efficiency as the total distance traveled by the Vehicle divided by the total liters recorded in the Vehicle's Fuel_Logs, expressed in kilometers per liter.
2. IF the total liters recorded in a Vehicle's Fuel_Logs is zero, THEN THE Analytics_Service SHALL report that Vehicle's Fuel_Efficiency as "N/A".
3. THE Analytics_Service SHALL compute Fleet_Utilization as the count of vehicles with Vehicle_Status On_Trip divided by the total count of vehicles whose Vehicle_Status is not Retired, multiplied by 100.
4. THE Analytics_Service SHALL compute a Vehicle's Operational_Cost as the sum of the Vehicle's total fuel cost and total maintenance cost.
5. THE Analytics_Service SHALL compute a Vehicle's Vehicle_ROI as the Vehicle's Revenue minus the sum of the Vehicle's maintenance cost and fuel cost, divided by the Vehicle's Acquisition_Cost.
6. IF a Vehicle's Acquisition_Cost is zero, THEN THE Analytics_Service SHALL report that Vehicle's Vehicle_ROI as "N/A".
7. WHEN a User selects the CSV export action for a report, THE Export_Service SHALL generate a comma-separated file containing the report's displayed rows and column headers.
8. WHERE the PDF export option is enabled, WHEN a User selects the PDF export action for a report, THE Export_Service SHALL generate a PDF document containing the report's displayed rows and column headers.
9. WHEN the Export_Service generates an export file, THE Export_Service SHALL verify that the file was successfully created and that its content contains the report's displayed rows and column headers, and IF the verification fails, THEN THE Export_Service SHALL display the message "Export failed" and SHALL NOT present the file as successfully exported.

### Requirement 11: Data Persistence

**User Story:** As a fleet operations administrator, I want all operational records to persist reliably, so that data survives sessions and reflects the true fleet state.

#### Acceptance Criteria

1. THE System SHALL persist Users, Roles, Vehicles, Drivers, Trips, Maintenance_Logs, Fuel_Logs, and Expense_Records in a durable data store.
2. WHEN the System creates, updates, or deletes a record, THE System SHALL persist the change so that it is present after a subsequent page reload.
3. IF persistence of a record create, update, or delete operation fails, THEN THE System SHALL prevent the operation from appearing to succeed to the User and SHALL display an error indicating the operation was not saved.
4. WHEN the System performs an automatic status transition on a Vehicle or Driver as part of a Trip or Maintenance operation, THE System SHALL persist the record change and the status change within the same operation so that both changes are present after a subsequent page reload.

### Requirement 12: Responsive Premium Interface

**User Story:** As a user on any device, I want a polished responsive interface, so that I can operate the platform on desktop and mobile.

#### Acceptance Criteria

1. WHEN an authenticated User views any application page at a viewport width of 1280 pixels or greater, THE System SHALL render the page layout without horizontal overflow of primary content.
2. WHEN an authenticated User views any application page at a viewport width of 375 pixels, THE System SHALL render the page layout without horizontal overflow of primary content.
3. WHEN an authenticated User views any application page at any viewport width between 375 pixels and 1280 pixels inclusive, including 768 pixels and 1024 pixels, THE System SHALL render the page layout without horizontal overflow of primary content.
4. THE System SHALL provide a navigation control that lists the nine functional areas: authentication, dashboard, vehicle registry, driver management, trip dispatch, maintenance, fuel and expenses, reports and analytics, and fleet management.

### Requirement 13: Dark Mode

**User Story:** As a user, I want to switch between light and dark themes, so that I can work comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE System SHALL provide a theme control that switches the interface between a light theme and a dark theme.
2. WHEN a User selects a theme, THE System SHALL apply the selected theme to all application pages within the current session, and WHERE a page is still loading or fails to receive the theme update, THE System SHALL allow that page to remain in the previously applied theme until it is refreshed or reloaded.
3. WHEN a User selects a theme and then reloads the application, THE System SHALL apply the most recently selected theme.

### Requirement 14: Search, Filter, and Sort

**User Story:** As a user, I want to search, filter, and sort list views, so that I can locate records efficiently.

#### Acceptance Criteria

1. WHEN a User enters a search term in the Vehicle_Registry, THE Vehicle_Registry SHALL display only vehicles whose Registration_Number, Vehicle Name, or Model contains the search term, matched case-insensitively.
2. WHEN a User enters a search term in the Driver_Registry, THE Driver_Registry SHALL display only drivers whose Name or License_Number contains the search term, matched case-insensitively.
3. WHEN a User selects a status filter on a list view, THE System SHALL display only records whose status matches the selected filter.
4. WHEN a User selects a sortable column header on a list view, THE System SHALL order the displayed records by that column's values in ascending order, and WHEN the User selects the same column header again, THE System SHALL order the displayed records by that column's values in descending order.

### Requirement 15: Role-Specific Dashboards

**User Story:** As a user in a specific role, I want a dashboard tailored to my responsibilities, so that the most relevant information appears first.

#### Acceptance Criteria

1. WHERE a User's Role is Fleet_Manager, WHEN the User opens the Dashboard, THE Dashboard SHALL display vehicle availability, maintenance, and fleet utilization indicators as the primary content, and THE Dashboard MAY display multiple indicator types as primary content simultaneously for each Role.
2. WHERE a User's Role is Safety_Officer, WHEN the User opens the Dashboard, THE Dashboard SHALL display driver compliance and license validity indicators as the primary content.
3. WHERE a User's Role is Financial_Analyst, WHEN the User opens the Dashboard, THE Dashboard SHALL display operational cost, fuel, and ROI indicators as the primary content.
4. WHERE a User's Role is Driver_Role, WHEN the User opens the Dashboard, THE Dashboard SHALL display active trips and pending trips indicators as the primary content.

### Requirement 16: Live Dispatch Eligibility Panel

**User Story:** As a driver creating a trip, I want to see why a vehicle or driver is ineligible, so that I can resolve blockers before dispatching.

#### Acceptance Criteria

1. WHILE a User is composing a Trip, THE Dispatch_Service SHALL display an eligibility panel listing each ineligible Vehicle together with the reason the Vehicle is ineligible.
2. WHILE a User is composing a Trip, THE Dispatch_Service SHALL display an eligibility panel listing each ineligible Driver together with the reason the Driver is ineligible.
3. WHEN a User sets a Cargo_Weight that exceeds the selected Vehicle's Maximum_Load_Capacity, THE Dispatch_Service SHALL display an eligibility message identifying the capacity as exceeded before the User attempts to dispatch.
4. WHEN a User selects an Eligible_Vehicle and an Eligible_Driver and sets a Cargo_Weight that does not exceed the Vehicle's Maximum_Load_Capacity, THE Dispatch_Service SHALL indicate that the Trip is eligible for dispatch.

### Requirement 17: Trip Cost and ROI Estimator

**User Story:** As a driver, I want an estimated trip cost and ROI before dispatch, so that I can make informed dispatch decisions.

#### Acceptance Criteria

1. WHEN a User selects a Vehicle and enters a Planned_Distance for a Trip, THE Dispatch_Service SHALL display an estimated fuel cost computed from the Planned_Distance, the Vehicle's Fuel_Efficiency, and the System's configured fuel price.
2. IF the selected Vehicle's Fuel_Efficiency is "N/A", THEN THE Dispatch_Service SHALL display the estimated fuel cost as "N/A".
3. WHEN a User enters an expected revenue for a Trip, THE Dispatch_Service SHALL display an estimated Trip margin computed as the expected revenue minus the estimated fuel cost.

### Requirement 18: License Expiry Reminders and Compliance Radar

**User Story:** As a safety officer, I want to see and be reminded of upcoming license expirations, so that no driver operates with an expired license.

#### Acceptance Criteria

1. WHEN a Safety_Officer opens the compliance view, THE System SHALL display each Driver whose License_Expiry_Date is within 30 days of the current date, ordered by License_Expiry_Date ascending, and IF no Driver has a License_Expiry_Date within 30 days of the current date, THEN THE System SHALL treat the operation as successful and display an empty compliance list.
2. WHILE a Driver's License_Expiry_Date is within 30 days of the current date, THE System SHALL display a countdown of the number of days remaining until that Driver's License_Expiry_Date.
3. WHERE email reminders are enabled, WHEN a Driver's License_Expiry_Date is within the System's configured reminder window, THE Reminder_Service SHALL send an email reminder identifying the Driver and the License_Expiry_Date.

### Requirement 19: Command Palette Navigation

**User Story:** As a power user, I want keyboard-driven navigation, so that I can move through the platform quickly.

#### Acceptance Criteria

1. WHEN an authenticated User presses the command palette shortcut, THE Command_Palette SHALL open an input that accepts a search term.
2. WHEN a User enters a search term in the Command_Palette, THE Command_Palette SHALL display navigation targets whose names contain the search term, matched case-insensitively.
3. WHEN a User selects a navigation target in the Command_Palette, THE System SHALL navigate to the selected target and close the Command_Palette.

### Requirement 20: Vehicle Document Management

**User Story:** As a fleet manager, I want to attach documents to vehicles, so that registration and insurance records are stored with the asset.

#### Acceptance Criteria

1. WHEN a Fleet_Manager uploads a document file for a Vehicle with a document type label, THE Vehicle_Registry SHALL store the document associated with that Vehicle.
2. WHEN an authenticated User opens a Vehicle's detail view, THE Vehicle_Registry SHALL display the list of documents associated with that Vehicle with each document's type label.
3. WHEN a Fleet_Manager deletes a document associated with a Vehicle, THE Vehicle_Registry SHALL remove the document from that Vehicle.

### Requirement 21: Seed Data and Guided Demo Mode

**User Story:** As a hackathon evaluator, I want seeded demo data and a guided walkthrough, so that I can experience the end-to-end workflow immediately.

#### Acceptance Criteria

1. WHEN the System is initialized with seed data, THE System SHALL create at least one User for each Role, at least three Vehicles, at least three Drivers, and at least one Trip.
2. WHEN a User activates Demo_Mode, THE System SHALL guide the User through the sequence: register a Vehicle, register a Driver, create a Trip with a Cargo_Weight within capacity, dispatch the Trip, complete the Trip, create a Maintenance_Log, and view updated reports.
3. THE System SHALL consider Demo_Mode successfully completed only when the User has completed every step in the exact sequence specified, and IF any step is skipped or performed out of sequence, THEN THE System SHALL NOT consider Demo_Mode successfully completed.
4. WHEN a User completes the Demo_Mode dispatch step, THE System SHALL demonstrate that the assigned Vehicle's Vehicle_Status and the assigned Driver's Driver_Status have changed to On_Trip.

### Requirement 22: Autonomous Disruption Recovery Engine

**User Story:** As a fleet manager, I want the system to detect operational disruptions, identify affected trips, and recommend one-click replacement vehicle-and-driver pairs, so that shipments continue with minimal delay when a vehicle breaks down or a driver becomes unavailable.

#### Acceptance Criteria

1. WHEN a Fleet_Manager reports a Disruption_Event of type Vehicle_Breakdown or Emergency_Maintenance for a Vehicle whose Vehicle_Status is On_Trip, THE Recovery_Service SHALL identify every Trip whose Trip_Status is Dispatched and whose assigned Vehicle is that Vehicle, and SHALL flag each such Trip as disrupted.
2. WHEN a Fleet_Manager or Safety_Officer reports a Disruption_Event of type Driver_Unavailable for a Driver whose Driver_Status is On_Trip, THE Recovery_Service SHALL identify every Trip whose Trip_Status is Dispatched and whose assigned Driver is that Driver, and SHALL flag each such Trip as disrupted.
3. WHEN a Disruption_Event flags a Trip as disrupted, THE Recovery_Service SHALL set the disrupted Vehicle's Vehicle_Status to In_Shop for Vehicle_Breakdown or Emergency_Maintenance events, and SHALL set the disrupted Driver's Driver_Status to Off_Duty for Driver_Unavailable events, within the same operation.
4. WHEN a Trip is flagged as disrupted, THE Recovery_Service SHALL produce a list of Replacement_Candidate pairs where each candidate consists of an Eligible_Vehicle whose Maximum_Load_Capacity is greater than or equal to the disrupted Trip's Cargo_Weight and an Eligible_Driver whose Driver_Status is Available and whose License_Expiry_Date is not earlier than the current date.
5. WHEN the Recovery_Service produces Replacement_Candidate pairs for a disrupted Trip, THE Recovery_Service SHALL compute each candidate's Recovery_Score as the sum of: (a) 100 points if the candidate Vehicle's Region equals the disrupted Trip's source Region, otherwise 0; (b) the candidate Driver's Safety_Score; (c) 50 points if the candidate Vehicle's Maximum_Load_Capacity is within 150 percent of the disrupted Trip's Cargo_Weight, otherwise 0, and THE Recovery_Service SHALL order candidates by Recovery_Score descending and SHALL break ties by ascending candidate Vehicle Odometer.
6. WHEN the Recovery_Service displays Replacement_Candidate pairs for a disrupted Trip, THE Recovery_Service SHALL display, for each candidate, at least the following reasons in human-readable text: capacity margin computed as candidate Maximum_Load_Capacity minus Cargo_Weight, region match indicated as "same region" or "different region", and candidate Driver Safety_Score.
7. WHEN a Fleet_Manager selects a Replacement_Candidate for a disrupted Trip, THE Recovery_Service SHALL reassign the Trip's Vehicle to the candidate Vehicle, reassign the Trip's Driver to the candidate Driver, keep the Trip's Trip_Status as Dispatched, set the candidate Vehicle's Vehicle_Status to On_Trip, set the candidate Driver's Driver_Status to On_Trip, and persist all changes within a single operation.
8. WHEN the Recovery_Service performs a recovery reassignment, THE Recovery_Service SHALL re-run the same eligibility validation used by the Dispatch_Service, and IF any eligibility check fails at the moment of reassignment, THEN THE Recovery_Service SHALL reject the reassignment, retain the disrupted Trip's current assignments, and display an error message identifying the failed check.
9. IF the Recovery_Service finds no Replacement_Candidate for a disrupted Trip, THEN THE Recovery_Service SHALL mark the Trip as an At_Risk_Trip and display the message "No eligible replacement available — trip is at risk".
10. WHEN the Recovery_Service completes a recovery reassignment, THE Recovery_Service SHALL record an audit entry containing the disrupted Trip identifier, the original Vehicle and Driver, the replacement Vehicle and Driver, the Disruption_Event type, and the timestamp of the reassignment.
11. WHERE a User's Role is Fleet_Manager, WHEN the User opens the Dashboard, THE Dashboard SHALL display the count of At_Risk_Trips and the count of Trips recovered within the current day.
12. WHEN a Fleet_Manager triggers disruption recovery for a single disrupted Trip, THE Recovery_Service SHALL produce the ranked Replacement_Candidate list within 3 seconds.

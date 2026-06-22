# Software Requirements Specification (SRS)
## for Enterprise Budget Management System

### 1. Introduction
#### 1.1 Purpose
The purpose of this document is to present a detailed description of the Enterprise Budget Management System. It will explain the purpose and features of the system, the interfaces of the system, what the system will do, the constraints under which it must operate, and how the system will react to external stimuli.

#### 1.2 Document Conventions
This document uses the following conventions:
- IEEE Standard 830-1998 format is followed.
- **Admin**: System administrator with full access.
- **Division Head**: User responsible for a specific division and its groups.
- **Employee**: Regular user belonging to a group.

#### 1.3 Intended Audience and Reading Suggestions
This document is intended for developers, project managers, and stakeholders from the respective organization (e.g., DRDO). It is recommended to read the overall description before diving into specific functional requirements.

#### 1.4 Product Scope
The Enterprise Budget Management System is a web-based application designed to streamline and automate the process of managing budgets, expenditures, and projects across different divisions and groups within an enterprise. It includes hierarchical approval workflows, real-time notifications, and AI-powered insights using Google Gemini.

### 2. Overall Description
#### 2.1 Product Perspective
The system is a new, standalone web application. It consists of a React.js frontend, a Node.js/Express.js backend, and a MySQL database.

#### 2.2 Product Functions
- **User Authentication & Authorization**: Secure login (including Google OAuth) and role-based access control (Admin, Division Head, Employee).
- **Organization Management**: Creation and management of Divisions and Groups.
- **Project & Budget Management**: Allocation of budgets to projects and tracking.
- **Expenditure Tracking**: Logging and monitoring of expenditures against allocated budgets.
- **Approval Workflow**: Requesting approvals for budgets or expenditures with a hierarchical approval chain.
- **Notifications**: In-app and email notifications for pending approvals, budget alerts, etc.
- **AI Integration**: Gemini-powered AI features for budget insights and querying.

#### 2.3 User Classes and Characteristics
- **Admin**: Has full access to all system features, including creating other users, managing divisions, and overriding approvals.
- **Division Head**: Manages groups within their division, approves/rejects requests from employees within their groups, and oversees division-level budgets.
- **Employee**: Can view their assigned projects/budgets, submit expenditure requests, and view their approval request statuses.

#### 2.4 Operating Environment
- **Frontend**: Modern web browsers (Chrome, Firefox, Edge, Safari).
- **Backend**: Node.js environment.
- **Database**: MySQL Server.

#### 2.5 Design and Implementation Constraints
- The frontend is built using React and Vite.
- The backend must expose RESTful APIs.
- The system must handle large file uploads or data structures (limit set to 10mb in Express).

### 3. External Interface Requirements
#### 3.1 User Interfaces
The user interface will be built with React and modern styling frameworks. It will feature a responsive design, a sidebar navigation, and dedicated pages for projects, budgets, notifications, and AI insights.

#### 3.2 Hardware Interfaces
The system requires no specific hardware interfaces beyond standard web server hosting and client devices (PCs, laptops, smartphones).

#### 3.3 Software Interfaces
- **Database**: MySQL.
- **AI Service**: Google Gemini API for intelligent data analysis.

#### 3.4 Communications Interfaces
The system communicates over HTTP/HTTPS. RESTful endpoints are used for client-server communication.

### 4. System Features
#### 4.1 Authentication Module
- **Description**: Users can log in using email/password or Google OAuth.
- **Functional Requirements**:
  - The system shall verify user credentials against the database.
  - The system shall issue a secure token for authenticated sessions.

#### 4.2 Hierarchy and Group Management
- **Description**: Admins can create divisions and groups.
- **Functional Requirements**:
  - The system shall allow an Admin to assign a Division Head to a Division.
  - The system shall allow a Division Head or Admin to manage groups and assign employees to them.

#### 4.3 Budget and Expenditure Tracking
- **Description**: Core module for managing financial data.
- **Functional Requirements**:
  - The system shall allow authorized users to allocate budgets to projects.
  - The system shall allow employees to log expenditures.
  - The system shall automatically calculate the remaining budget for a project.

#### 4.4 Approval Workflow
- **Description**: Mechanism for approving expenditures or budget changes.
- **Functional Requirements**:
  - The system shall allow employees to submit an Approval Request.
  - The system shall notify the respective Division Head or Admin of pending requests.
  - The system shall allow authorized roles to approve or reject requests, updating the status accordingly.

#### 4.5 AI Insights (Gemini)
- **Description**: AI-assisted analytics.
- **Functional Requirements**:
  - The system shall integrate with the Gemini API to analyze budget data and provide summaries or answer queries.

### 5. Other Nonfunctional Requirements
#### 5.1 Performance Requirements
- API responses should be reasonably fast.
- The system should support concurrent users across the enterprise.

#### 5.2 Security Requirements
- Passwords must be hashed using bcrypt.
- API endpoints must be secured using authentication middleware.
- Environment variables must be used for sensitive data (DB credentials, API keys).

#### 5.3 Software Quality Attributes
- **Reliability**: The system should ensure data integrity using relational database constraints.
- **Maintainability**: The codebase should be modular (separated into controllers, models, routes).

### 6. Appendices
- **Appendix A**: Glossary
  - **JWT**: JSON Web Token
  - **API**: Application Programming Interface
  - **OAuth**: Open Authorization standard for access delegation

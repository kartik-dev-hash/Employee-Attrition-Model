# 🧠 RetainPulse — Employee Attrition Prediction & AI Retention System

> An enterprise-grade, full-stack AI-driven web application that predicts employee attrition risk using Machine Learning (scikit-learn) and empowers HR managers with an external **n8n AI Retention Agent** for human-in-the-loop meeting scheduling, automated invitations, and retention analytics.

---

## 📸 Overview

**RetainPulse** bridges predictive machine learning and intelligent HR workflow automation:
- **Platform Admins** manage organizations, monitor platform-wide telemetry, and approve HR company registrations.
- **HR Managers** analyze sentiment dynamics, inspect ML-driven attrition risks, trigger training pipelines, request AI-generated retention meeting proposals from an **external n8n agent**, and approve/dispatch meeting invites.
- **Employees** submit confidential 4-dimension monthly sentiment feedback and manage 1-on-1 retention session invites.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **ML Attrition Prediction** | Scikit-learn Random Forest model trained on the IBM HR Analytics dataset. Predicts attrition probability (`HIGH_RISK`, `MEDIUM_RISK`, `LOW_RISK`) using 4 key sentiment metrics. |
| ⚡ **External n8n AI Agent Integration** | Connects to an external cloud-hosted n8n workflow (`https://retainpulse.app.n8n.cloud/webhook/retention-meeting`) to autonomously formulate meeting proposals, agendas, and personalized invitation drafts. |
| 🛡️ **Human-in-the-Loop Review** | Proposals from the AI agent are staged as `Proposed` in MongoDB. HR retains full control to edit dates, times, agenda, and draft before clicking **Approve & Send** or **Reject**. |
| 🔄 **Deterministic Fail-Safe Fallback** | Built-in fallback engine (`generateInternalRetentionProposal`) automatically takes over if n8n is offline, times out (12s), or requires authentication, ensuring zero HR workflow interruption. |
| 📊 **Interactive HR Analytics** | Visual sentiment distributions, department health, risk categorization, and trend analysis using Recharts. |
| 🗓️ **Conflict-Aware Scheduling** | Validates employee and HR availability, prevents duplicate bookings, and automatically embeds secure Jitsi video links. |
| 📧 **Automated Email Communications** | EmailJS & Nodemailer support for welcome emails, monthly feedback reminders, and approved retention invitations. |
| 💬 **Instant Outreach (WhatsApp & Email)** | One-click communication channels for HR to reach at-risk employees directly. |
| 📋 **Monthly Feedback Cycle** | Automated cron-driven reminders on the 1st and mid-month to capture monthly sentiment surveys. |
| 🔐 **Strict Role-Based Security** | Multi-tenant company isolation, bcrypt password hashing, and JWT authorization protecting all sensitive routes. |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** — High-performance SPA architecture
- **Tailwind CSS** — Modern responsive UI styling
- **Lucide React** — Icon suite
- **Recharts** — Dynamic analytical charts and visualizations
- **Axios** — Secure HTTP client with JWT interceptors
- **EmailJS** — Client-side email notification dispatch

### Backend
- **Node.js** + **Express.js** — REST API framework (ES Modules)
- **MongoDB** + **Mongoose** — Multi-tenant database and document modeling
- **JWT (jsonwebtoken)** — Stateless authentication & role verification
- **bcryptjs** — Password hashing (10 salt rounds)
- **node-cron** — Automated monthly survey reminder schedules

### AI & Workflow Automation
- **n8n AI Workflow Agent** — Cloud-hosted workflow webhook (`https://retainpulse.app.n8n.cloud/webhook/retention-meeting`)
- **Native HTTPS with Fallback** — Resilience engine with timeout handling, SSL leaf verification management, and deterministic fallback generation

### Machine Learning
- **Python 3** — Model runtime
- **scikit-learn** — Random Forest Classifier
- **pandas** & **numpy** — Data preprocessing and feature transformation
- **joblib** — Model serialization & persistence
- **Node.js `child_process`** — Seamless async bridge between Express and Python ML engine

---

## 📁 Project Structure

```
empAttrition/
├── src/                                  # React 18 Frontend
│   ├── api/                              # Axios client & JWT headers
│   ├── components/
│   │   ├── common/                       # Modal, Toast, Button components
│   │   ├── hr-analytics/
│   │   │   ├── RetentionActionCenter.jsx # AI Meeting Scheduling & Approval UI
│   │   │   └── AnalyticsDashboard.jsx    # Visual trend charts & risk cards
│   │   └── layout/                       # Sidebar, header, navigation
│   ├── context/                          # AuthContext (JWT state & roles)
│   ├── pages/
│   │   ├── admin/                        # Platform admin management
│   │   ├── hr/                           # HR dashboard, RetentionCases, Directory
│   │   └── employee/                     # Feedback submission, meeting schedule
│   ├── services/                         # Frontend API service layer
│   └── utils/
│       └── emailService.js               # EmailJS client configuration
│
├── Backend/                              # Express.js REST API
│   ├── models/                           # Mongoose Schemas
│   │   ├── User.js                       # HR, Admin, and Employee profiles
│   │   ├── feedback.js                   # Monthly 4-dimension feedback records
│   │   ├── company.js                    # Multi-company metadata
│   │   ├── RetentionAction.js            # Retention meetings & AI proposal state
│   │   ├── ModelMetadata.js              # ML training metadata & accuracy
│   │   ├── CompanyAnalytics.js           # Pre-aggregated analytics
│   │   ├── EmployeeAnalytics.js          # Individual attrition risk history
│   │   └── EmailNotificationLog.js       # Audit log for scheduled emails
│   ├── routes/
│   │   └── analyticsRoutes.js            # All HR, ML, and n8n retention endpoints
│   ├── services/
│   │   ├── n8nService.js                 # External n8n AI webhook & fallback client
│   │   ├── meetingScheduler.js           # Availability validation & internal scheduler
│   │   ├── mlService.js                  # Python ML bridge (child_process)
│   │   ├── emailService.js               # EmailJS REST & Nodemailer sender
│   │   ├── analyticsService.js           # Metric aggregation engine
│   │   ├── reminderScheduler.js          # node-cron monthly reminder scheduler
│   │   └── retentionRuleEngine.js        # High-risk eligibility evaluator
│   ├── ml/                               # Machine Learning Pipeline
│   │   ├── train_model.py                # Random Forest training script
│   │   ├── predict.py                    # Inference script
│   │   ├── data/                         # IBM HR analytics dataset (CSV)
│   │   └── artifacts/                    # Serialized .joblib models (gitignored)
│   ├── scripts/                          # DB migrations & seed scripts
│   ├── app.js                            # Express server bootstrap
│   ├── .env.example                      # Documented environment template
│   └── .env                              # Active secrets (gitignored)
│
├── package.json
└── README.md
```

---

## 🤖 n8n AI Retention Agent & Human-in-the-Loop Workflow

RetainPulse integrates an external **n8n AI Workflow Agent** to assist HR with the retention meeting scheduling cycle:

```
[ High-Risk Employee Identified (ML Model) ]
                    │
                    ▼
[ HR Clicks "Request AI Meeting Proposal" ]
                    │
                    ▼
[ Express Backend: POST /retention-meetings/propose ]
                    │
                    ├──► Calls n8n Cloud Webhook (Dual Payload)
                    │    https://retainpulse.app.n8n.cloud/webhook/retention-meeting
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
 [ n8n AI Agent Response ]   [ Fallback Engine (Timeout/403) ]
       │                         │
       └────────────┬────────────┘
                    ▼
[ Staged in MongoDB as PROPOSED (Not booked, no email sent) ]
                    │
                    ▼
[ HR Reviews Proposal in Retention Action Center ]
  ├── Review or adjust Date & Time
  ├── Modify Meeting Purpose & Agenda
  └── Review personalized Invitation Draft
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
 [ HR Clicks "Approve & Send" ] [ HR Clicks "Reject" ]
       │                         │
       ▼                         ▼
Status: APPROVED / SENT      Status: REJECTED / CANCELLED
• Saved to DB as active      • Stored with rejection reason
• Jitsi video link created   • No invitation sent
• Invitation email dispatched
```

### 1. Webhook Payload Contract

When HR initiates a proposal, the backend sends a rich payload supporting both natural language AI agents and structured automation nodes:

```json
{
  "message": "Kal 5 baje meeting schedule karo for employee Jane Doe (High Risk, 84% attrition probability)",
  "action": "propose_retention_meeting",
  "requestId": "req_1729955123456_a8bc",
  "employee": {
    "employeeId": "64f123abc456...",
    "name": "Jane Doe",
    "email": "jane.doe@company.com",
    "department": "Engineering",
    "designation": "Senior Developer",
    "riskLevel": "HIGH_RISK",
    "attritionProbability": 0.84,
    "riskFactors": [
      "Low Environment Satisfaction (1/4)",
      "Low Work-Life Balance (1/4)"
    ]
  },
  "meeting": {
    "purpose": "Employee Retention & Workplace Well-being Discussion",
    "preferredDate": "2026-10-27",
    "preferredTime": "15:00",
    "notes": "Discuss workload adjustments and team alignment."
  }
}
```

### 2. Expected AI Agent Response

The AI agent responds with proposed scheduling details:

```json
{
  "proposedDate": "2026-10-27",
  "proposedTime": "15:00",
  "agenda": "1. Welcome & Well-being Check\n2. Open discussion on workload & balance\n3. Actionable workplace support plan",
  "invitationDraft": "Dear Jane,\n\nWe value your journey at our company and would love to connect for a casual, confidential 1-on-1 discussion...",
  "summary": "Retention meeting proposed for Jane Doe to address work-life balance."
}
```

### 3. Fail-Safe Resilience

If the external n8n cloud service experiences network downtime, rate limits, certificate mismatches, or authentication restrictions:
1. The request aborts cleanly after a configurable timeout (`N8N_TIMEOUT_MS=12000`).
2. The internal fallback engine (`generateInternalRetentionProposal`) automatically synthesizes an intelligent slot, risk-specific agenda, and invitation draft based on the employee's specific risk factors.
3. The UI clearly identifies the proposal source (`n8n` vs `internal_fallback`), ensuring HR operations never stall.

---

## 📡 Backend API Routes

All retention and scheduling routes are secured with JWT authentication and strictly enforce HR or Admin role permissions:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/hr/high-risk-employees` | Returns all high-risk employees eligible for retention outreach |
| `POST` | `/api/hr/retention-meetings/propose` | Requests an AI meeting proposal via external n8n agent (or fallback) |
| `POST` | `/api/hr/retention-meetings/:id/approve` | HR approves the proposal; marks meeting as `Approved`/`Sent` & dispatches email |
| `POST` | `/api/hr/retention-meetings/:id/reject` | HR rejects the proposal with an optional explanation |
| `GET` | `/api/hr/retention-meetings` | Lists all retention meeting records (proposed, approved, sent, rejected) |
| `GET` | `/api/hr/retention-meetings/:employeeId` | Fetches meeting history for a specific employee |
| `POST` | `/api/hr/retention-actions` | Legacy direct scheduling / notes recording |
| `POST` | `/api/analytics/train-model` | Triggers Python scikit-learn training pipeline check |

---

## 🤖 ML Model Architecture

### Dataset
- **IBM HR Analytics Employee Attrition & Performance Dataset** (1,470 records).

### 4-Dimension Feature Contract
| Feature | Type | Range | Description |
|---|---|---|---|
| `JobSatisfaction` | Numerical | 1 – 4 | Overall employee satisfaction with job role |
| `EnvironmentSatisfaction` | Numerical | 1 – 4 | Satisfaction with physical and cultural work environment |
| `WorkLifeBalance` | Numerical | 1 – 4 | Balance between professional duties and personal life |
| `RelationshipSatisfaction` | Numerical | 1 – 4 | Quality of workplace relationships with peers and management |

### Target Classification
- Binary Attrition: `0` (Stay) / `1` (Leave).
- Model Output: **Probability Score (0.00 – 1.00)** mapped into risk tiers:
  - **High Risk:** Probability $\ge 0.60$ or severe factor flags ($\le 1/4$)
  - **Medium Risk:** Probability between $0.35$ and $0.59$
  - **Low Risk:** Probability $< 0.35$

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or v20 LTS recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local instance running at `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)
- [Python 3.8+](https://www.python.org/) with dependencies:
  ```bash
  pip install scikit-learn pandas numpy joblib
  ```

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/kartik-dev-hash/Employee-Attrition-Model.git
cd Employee-Attrition-Model/empAttrition
```

---

### Step 2: Configure Environment Variables

Inside the `Backend/` directory, create a `.env` file (copy from `.env.example`):

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/employeeAttrition
JWT_SECRET=your_super_secret_jwt_key_here

# External n8n AI Agent Configuration
N8N_RETENTION_WEBHOOK_URL=https://retainpulse.app.n8n.cloud/webhook/retention-meeting
N8N_AGENT_SECRET=your_n8n_secret_token_if_auth_enabled
N8N_HEADER_NAME=x-n8n-agent-secret
N8N_TIMEOUT_MS=12000
```

> **Note on n8n Webhook Authentication:**  
> - If your n8n Webhook node uses **Authentication: None**, leave `N8N_AGENT_SECRET=` empty.  
> - If your n8n Webhook node uses **Header Auth**, provide the exact credential token in `N8N_AGENT_SECRET`.

---

### Step 3: Install Dependencies

#### Install Frontend Dependencies
```bash
# In empAttrition root
npm install
```

#### Install Backend Dependencies
```bash
cd Backend
npm install
```

---

### Step 4: Seed Platform Administrator

Create the default administrative credentials:
```bash
cd Backend
node seedAdmin.js
```

Default credentials:
- **Email:** `admin@retainpulse.com`
- **Password:** `Admin@123`

---

### Step 5: Start the Development Servers

#### Terminal 1 — Express Backend
```bash
cd Backend
node app.js
# Server running at http://localhost:5000
```

#### Terminal 2 — Vite React Frontend
```bash
# From empAttrition root
npm run dev
# Application accessible at http://localhost:5173
```

---

## 👥 Multi-Role User Flow

```
Platform Admin
    ├── Registers Companies & sets up initial HR accounts
    ├── Approves / Rejects pending company registrations
    └── Monitors system-wide health and user counts

HR Manager
    ├── Enrolls employees and oversees department lists
    ├── Tracks monthly feedback submissions and attrition probabilities
    ├── Triggers ML Model training & pipeline validation
    ├── Requests AI-generated meeting proposals from external n8n agent
    ├── Reviews, edits, and approves retention meeting proposals
    ├── Conducts 1-on-1 retention video sessions via Jitsi Meet
    └── Dispatches direct WhatsApp and Email outreach

Employee
    ├── Receives automated monthly survey reminders
    ├── Submits confidential 4-factor sentiment feedback
    └── Views scheduled 1-on-1 retention meetings with join links
```

---

## 🔐 Security & Compliance

- **Zero Direct AI Modification:** The n8n AI agent operates strictly as an advisory proposal generator; it cannot directly alter database records or send emails without HR sign-off.
- **Human-in-the-Loop:** All automated meeting proposals require explicit HR authorization before calendar slots are finalized and invitation emails are sent.
- **Isolated Multi-Tenancy:** Records are strictly partitioned by `companyCode`. HR managers cannot access employee data outside their organization.
- **Protected Secrets:** Environment variables and API secrets are maintained exclusively in `Backend/.env` and excluded from git tracking.
- **Password Protection:** User passwords hashed using `bcryptjs` with salt round factor 10.

---

## 📜 Academic Project

This project was developed for final year engineering and academic demonstration.  
© 2026 RetainPulse Team — All Rights Reserved.

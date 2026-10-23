# 🧠 RetainPulse — Employee Attrition Prediction & Retention Management System

> A full-stack AI-powered web application that predicts employee attrition risk using Machine Learning and helps HR teams take proactive retention actions through automated meeting scheduling, email notifications, and data-driven insights.

---

## 📸 Overview

RetainPulse is a multi-role SaaS-style platform where:
- **Platform Admins** manage companies and users across the platform
- **HR Managers** monitor employee sentiment, view ML-powered attrition risk predictions, and schedule retention meetings
- **Employees** submit monthly workplace feedback surveys and respond to meeting invitations

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **ML Attrition Prediction** | Python scikit-learn model trained on real IBM HR dataset — predicts each employee's dropout probability |
| 📊 **HR Analytics Dashboard** | Visual charts for satisfaction trends, risk distribution, and team health across time |
| 🗓️ **AI Meeting Scheduler** | Auto-schedules confidential 1-on-1 retention sessions during working hours with Jitsi video links |
| 📧 **Automated Emails** | EmailJS-powered welcome emails, monthly feedback reminders, and meeting invitations |
| 💬 **WhatsApp Outreach** | One-click WhatsApp message composer for direct HR-to-employee contact |
| 📋 **Monthly Feedback Cycle** | Employees submit 4-dimension workplace sentiment surveys every month |
| 🛡️ **Role-Based Access Control** | Strict JWT auth with 3 roles: Platform Admin, HR, Employee |
| 🏢 **Multi-Company Support** | Platform supports multiple registered organizations with isolated data |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** — Fast SPA framework
- **Tailwind CSS** — Utility-first styling
- **Lucide React** — Icon library
- **Recharts** — Data visualization charts
- **EmailJS** — Client-side email dispatch

### Backend
- **Node.js** + **Express.js** — REST API server (ES Modules)
- **MongoDB** + **Mongoose** — Database and ODM
- **JWT (jsonwebtoken)** — Authentication
- **bcryptjs** — Password hashing
- **node-cron** — Automated monthly reminder scheduler

### Machine Learning
- **Python 3** — ML runtime
- **scikit-learn** — Random Forest classifier
- **pandas + numpy** — Data processing
- **joblib** — Model serialization
- Spawned from Node.js via `child_process`

---

## 📁 Project Structure

```
empAttrition/
├── src/                          # React Frontend
│   ├── api/                      # Axios client config
│   ├── components/
│   │   ├── common/               # Modal, Toast, shared UI
│   │   ├── hr-analytics/         # Analytics dashboard, retention center
│   │   └── layout/               # Sidebar, navigation
│   ├── context/                  # Auth context (JWT)
│   ├── pages/
│   │   ├── admin/                # Platform admin pages
│   │   ├── hr/                   # HR dashboard, analytics, directory
│   │   └── employee/             # Employee feedback form, meetings
│   ├── services/                 # Frontend service layer
│   └── utils/
│       └── emailService.js       # EmailJS integration
│
├── Backend/
│   ├── models/                   # Mongoose schemas
│   │   ├── User.js
│   │   ├── feedback.js
│   │   ├── company.js
│   │   ├── RetentionAction.js
│   │   ├── ModelMetadata.js
│   │   ├── CompanyAnalytics.js
│   │   ├── EmployeeAnalytics.js
│   │   └── EmailNotificationLog.js
│   ├── routes/
│   │   └── analyticsRoutes.js    # All HR, ML, retention API routes
│   ├── services/
│   │   ├── emailService.js       # EmailJS REST + Nodemailer
│   │   ├── mlService.js          # Python ML bridge
│   │   ├── analyticsService.js   # Company analytics computation
│   │   ├── reminderScheduler.js  # Cron-based email scheduler
│   │   ├── meetingScheduler.js   # Auto slot finder & booker
│   │   └── retentionRuleEngine.js# Eligibility evaluator
│   ├── ml/
│   │   ├── train_model.py        # scikit-learn training script
│   │   ├── predict.py            # Inference script
│   │   ├── data/                 # IBM HR dataset (CSV)
│   │   └── artifacts/            # Saved .joblib model (gitignored)
│   ├── scripts/                  # One-time migration scripts
│   ├── app.js                    # Express server entry point
│   └── .env                      # Environment secrets (gitignored)
│
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure the following are installed on your system:

- [Node.js](https://nodejs.org/) v18+
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) (running locally)
- [Python 3.8+](https://python.org)
- Python packages:

```bash
pip install scikit-learn pandas numpy joblib
```

---

### 1. Clone the Repository

```bash
git clone https://github.com/kartik-dev-hash/Employee-Attrition-Model.git
cd Employee-Attrition-Model/empAttrition
```

---

### 2. Install Frontend Dependencies

```bash
npm install
```

---

### 3. Install Backend Dependencies

```bash
cd Backend
npm install
```

---

### 4. Create the `.env` File

Inside the `Backend/` folder, create a file named `.env`:

```env
JWT_SECRET=your_jwt_secret_key_here
```

> ⚠️ **Never share or commit this file.** It is listed in `.gitignore`.

---

### 5. Seed the Platform Admin Account

```bash
cd Backend
node seedAdmin.js
```

This creates the default Platform Admin login:
- **Email:** `admin@retainpulse.com`
- **Password:** `Admin@123`

---

### 6. Start the Backend Server

```bash
cd Backend
node app.js
```

Backend runs at: `http://localhost:5000`

---

### 7. Start the Frontend

Open a new terminal:

```bash
cd empAttrition
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 👥 User Roles & Flow

```
Platform Admin
    └── Creates Companies + primary HR accounts
    └── Approves / Rejects company registrations
    └── Views platform-wide statistics

HR Manager
    └── Adds employees to their company
    └── Views employee feedback & ML risk scores
    └── Triggers ML model training
    └── Auto-schedules retention meetings
    └── Sends WhatsApp / Email outreach
    └── Manages monthly feedback reminders

Employee
    └── Submits monthly 4-dimension feedback survey
    └── Views their scheduled meeting invitations
    └── Accepts or declines meeting requests
```

---

## 🤖 ML Model Details

### Training Dataset
- **IBM HR Analytics Employee Attrition Dataset** (1,470 records)
- Source: Kaggle / IBM Watson Analytics

### Features Used (4-Dimension Contract)
| Feature | Description | Scale |
|---|---|---|
| `JobSatisfaction` | Overall job satisfaction rating | 1–4 |
| `EnvironmentSatisfaction` | Work environment satisfaction | 1–4 |
| `WorkLifeBalance` | Work-life balance rating | 1–4 |
| `RelationshipSatisfaction` | Relationship with colleagues | 1–4 |

### Target
- `Attrition`: **Yes** (will leave) / **No** (will stay)

### Algorithm
- **Random Forest Classifier** (scikit-learn)
- Outputs: binary prediction + probability score

### Training
HR can trigger training from the Analytics Dashboard → "Run ML Pipeline Check" button. The Python script runs via Node's `child_process.spawn()` and saves the model artifact as a `.joblib` file.

---

## 📧 Email System

Powered by **EmailJS** (no SMTP server required):

| Email Type | Trigger |
|---|---|
| Welcome Email | When HR adds a new employee |
| Monthly Feedback Invitation | Automated on 1st of every month |
| Feedback Reminder | Automated mid-month for pending employees |
| Meeting Invitation | When HR auto-schedules a retention meeting |

---

## 🔐 Security Notes

- Passwords are hashed with **bcryptjs** (10 salt rounds)
- All protected routes require a valid **JWT token**
- `.env` file with secrets is **gitignored** — never committed
- ML model `.joblib` files are **gitignored** (must be generated locally)
- Company data is strictly isolated by `companyCode`

---

## 📊 Analytics Features

- **Company-wide sentiment trends** over time (line charts)
- **Risk distribution** (High / Medium / Low / No Feedback)
- **Individual employee analytics** with ML probability score
- **Retention action tracking** with contact history log
- **ML model status** (Trained / Needs Data / Failed)

---

## 🗓️ Automated Scheduler

The backend runs a **cron job** (via `node-cron`) that:
- Sends monthly feedback invitations to all employees on the **1st of each month**
- Sends reminder emails to employees who haven't submitted by **mid-month**
- Logs all email dispatches to `EmailNotificationLog` collection in MongoDB

---

## 📜 License

This project is developed as an academic final year project.  
© 2026 — All rights reserved.

---

## 🙌 Acknowledgements

- [IBM HR Analytics Dataset](https://www.kaggle.com/datasets/pavansubhasht/ibm-hr-analytics-attrition-dataset) — Kaggle
- [EmailJS](https://www.emailjs.com/) — Email service
- [Jitsi Meet](https://meet.jit.si/) — Free video conferencing
- [Recharts](https://recharts.org/) — React charting library
- [Tailwind CSS](https://tailwindcss.com/) — CSS framework

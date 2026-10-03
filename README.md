# FAST Education — WhatsApp Delivery Automation

A complete production-ready web application built for **FAST Education** staff to upload customer/student book-dispatch Excel files and automatically send personalized WhatsApp messages through the **Official Meta WhatsApp Business Cloud API**.

---

## 🌟 Key Features & Workflow

```
Excel Upload ──> Read & Validate Rows ──> Preview Customers & Messages ──> Confirm Dispatch ──> Meta Cloud API Queue ──> Live Progress ──> Final Report Export
```

1. **Excel Upload & Validation**:
   - Accepts `.xlsx`, `.xls`, and `.csv` files.
   - Automatically detects and normalizes headers for: `name`, `phone`, `product_name`, `tracking_number`, `dispatch_date`, `courier`.
   - Normalizes Indian phone numbers (adds country code `91` when appropriate, removes spaces/dashes/leading zeros).
   - Flag missing fields, invalid phone formats, and duplicate phone/tracking entries before sending.
   - Summary statistics generated: `VALID`, `INVALID`, `DUPLICATE`.

2. **Personalized WhatsApp Message Preview**:
   - Generates live previews matching Meta approved template (`fast_book_dispatch`).
   - Interactive modal shows exact message text that each student will receive.

3. **Official Meta WhatsApp Business Cloud API Integration**:
   - Direct integration with Meta Graph API (`https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`).
   - Pure server-side requests (Access token is never exposed to the frontend).
   - Standardized template payload builder mapping parameters `{{1}}` to `{{5}}`.

4. **Duplicate Protection & Queue Safety**:
   - Checks message state atomically before sending. Rows already marked `SENT` are automatically skipped to prevent double messaging.
   - Controlled sending queue with configurable `MESSAGE_CONCURRENCY` and `MESSAGE_DELAY_MS`.
   - Real-time campaign cancellation support (stops queue and marks remaining messages as `SKIPPED`).

5. **Live Sending Progress & Webhooks**:
   - WebSocket (Socket.io) real-time progress bar updating sent, failed, pending, and skipped counts without page refresh.
   - Official Meta Webhook verification & handler updating message delivery status (`SENT` ➔ `DELIVERED` ➔ `READ` / `FAILED`).

6. **Reporting & Excel Export**:
   - Detailed campaign history & summary statistics.
   - Downloadable Excel (`.xlsx`) report containing recipient details, status, Meta Message ID, timestamps, and error logs.
   - Downloadable sample Excel template for FAST Education staff.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Axios, React Router v6, Lucide React (Icons), Socket.io Client.
- **Backend**: Node.js, Express.js, Mongoose, Socket.io, XLSX, Multer, Axios, Cors, Helmet, Express Rate Limit.
- **Database**: MongoDB (Supports local daemon + automatic fallback to In-Memory MongoDB for effortless setup).
- **Messaging**: Meta WhatsApp Business Cloud API (v21.0).

---

## 📁 Project Structure

```
fast-whatsapp-automation/
├── client/                      # React Frontend (Vite)
│   ├── src/
│   │   ├── components/          # Navbar, Sidebar, StatCard, StatusBadge, Modals, Stepper
│   │   ├── pages/               # Dashboard, UploadCampaign, CampaignsHistory, CampaignDetails, TestMessage, Settings
│   │   ├── services/            # Axios API client & Socket.io instance
│   │   ├── App.jsx              # Router & main layout
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Tailwind CSS
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Express Backend
│   ├── src/
│   │   ├── controllers/         # Excel, Campaign, WhatsApp, Webhook, Settings controllers
│   │   ├── excel/               # Excel parsing, validation, and report generation
│   │   ├── middleware/          # Error handling
│   │   ├── models/              # Mongoose Campaign & Message schemas
│   │   ├── routes/              # Express API endpoints
│   │   ├── services/            # Controlled sending queue
│   │   ├── whatsapp/            # Meta Cloud API client
│   │   ├── __tests__/           # Jest core unit tests
│   │   └── server.js            # Express & Socket.io server startup
│   ├── uploads/                 # Stored uploaded Excel files
│   ├── .env.example
│   ├── .env
│   └── package.json
│
├── .gitignore
├── package.json                 # Root script runner
└── README.md                    # Project documentation
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/fast_whatsapp_automation

# Meta WhatsApp Business Cloud API Credentials
WHATSAPP_ACCESS_TOKEN=YOUR_META_WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID=YOUR_PHONE_NUMBER_ID
WHATSAPP_BUSINESS_ACCOUNT_ID=YOUR_BUSINESS_ACCOUNT_ID
WHATSAPP_API_VERSION=v21.0
WHATSAPP_TEMPLATE_NAME=fast_book_dispatch
WHATSAPP_TEMPLATE_LANGUAGE=en_US

# Message Sending Queue Pacing
MESSAGE_CONCURRENCY=1
MESSAGE_DELAY_MS=1000

# Meta Webhook Verification Token
META_WEBHOOK_VERIFY_TOKEN=fast_education_verify_token_12345
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- MongoDB (Optional: If local MongoDB server is not running, the application automatically boots an in-memory MongoDB instance).

### 1. Install Dependencies
```bash
# Install root, server, and client packages
npm run install:all
```

### 2. Run Backend Tests
```bash
cd server
npm test
```

### 3. Run Development Application
```bash
# Terminal 1: Run Backend Server (Port 5000)
cd server
npm run dev

# Terminal 2: Run Frontend Client (Port 3000)
cd client
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 📋 Approved Meta WhatsApp Template Format

The application expects the following approved Meta WhatsApp Business template:

- **Template Name**: `fast_book_dispatch`
- **Language**: `en_US`
- **Category**: `UTILITY`
- **Body Text**:
  ```text
  Hello {{1}},

  Your FAST Education book consignment has been dispatched.

  📦 Tracking Details
  Product: {{2}}
  Tracking Number: {{3}}
  Dispatch Date: {{4}}
  Courier: {{5}}

  You can track your package using the Dak Seva App.

  Please note: The books are picked up by the courier partner today. Tracking status may take 1–2 days to update.

  For assistance:
  9584510000
  9522564050

  Regards,
  FAST Education
  Delivery Team
  ```

### Variable Mapping
- `{{1}}` = Customer Name
- `{{2}}` = Product Name
- `{{3}}` = Tracking Number
- `{{4}}` = Dispatch Date
- `{{5}}` = Courier Partner

---

## 📊 Expected Excel Columns

The uploaded Excel or CSV file should contain the following column headers:

| Column Header | Example | Description |
| :--- | :--- | :--- |
| `name` | `Rahul Sharma` | Student / Customer Name |
| `phone` | `919876543210` | Phone number with country code |
| `product_name` | `CA Inter IDT Full Book Set 8.0` | Book / Course Name |
| `tracking_number` | `C1144011340IN` | Courier AWB / Tracking ID |
| `dispatch_date` | `30-09-2026` | Date of dispatch |
| `courier` | `India Post` | Courier company name |

---

## 🔗 Meta Webhook Setup

1. In Meta WhatsApp Manager -> Webhooks:
   - Callback URL: `https://your-domain.com/api/webhooks/whatsapp`
   - Verify Token: Matches `META_WEBHOOK_VERIFY_TOKEN` in `.env` (`fast_education_verify_token_12345`).
2. Subscribe to `messages` webhook field.

---

## 🔒 Security & Best Practices

- **Token Protection**: Access tokens are kept strictly in `server/.env` and never exposed via any API endpoint or React state.
- **API Security**: Protected using `helmet`, `cors`, and `express-rate-limit`.
- **Validation**: Server-side Excel parsing, sanitization, and mobile number format verification.

# QR Dine — SaaS Restaurant Platform

A premium, multi-tenant SaaS platform for restaurants with QR-based table ordering. Owners onboard in minutes, customers order via QR — no apps, no downloads, no friction.

![License](https://img.shields.io/badge/license-Proprietary-black)
![React](https://img.shields.io/badge/React-19-black)
![Vite](https://img.shields.io/badge/Vite-8-black)

---

## 🌐 Live Demo

**👉 [https://Souryodipto.github.io/qr-dine/](https://Souryodipto.github.io/qr-dine/)**

---

## 🔑 How to Access — 3 System Views

### 1. 👤 Customer View (Public — No Login Needed)
| | |
|---|---|
| **URL** | `/` (Landing Page) |
| **What it does** | Public SaaS homepage showcasing the platform |
| **Login?** | ❌ No login required |

To see the full ordering experience, scan a restaurant's QR code or visit a table URL like:
```
/r/{restaurant_id}/table/{table_number}
```

---

### 2. 🍽️ Restaurant Owner Panel
| | |
|---|---|
| **URL** | `/owner-login` |
| **How to access** | Click **"Owner Login"** on the landing page |
| **Sign up** | Go to `/owner-signup` to create a new account |

**To create an owner account:**
1. Go to `/owner-signup`
2. Fill in: Name, Email, Password
3. Enter any 6-digit OTP (e.g. `123456`)
4. Complete the 5-step Setup Wizard
5. Access your dashboard at `/owner/dashboard`

---

### 3. 🛡️ Admin Panel (Hidden — Company Only)
| | |
|---|---|
| **URL** | `/admin-login` |
| **Email** | `admin@qrdine.com` |
| **Password** | `admin123` |

> ⚠️ This route is **hidden** — there is no public link to it. You must type the URL manually.

After login, access the admin dashboard at `/admin/dashboard` to view all restaurants, orders, and revenue.

---

## Features

| Feature | Description |
|---|---|
| **Multi-Tenant Architecture** | Each restaurant is fully isolated (data, payments, QR codes) |
| **QR Table Ordering** | Customers scan, order, and pay — zero login required |
| **5-Step Onboarding** | Owners go live in under 5 minutes |
| **Payment Routing** | UPI deep links routed directly to each restaurant's account |
| **Admin Panel** | Platform-wide oversight (hidden, company-only access) |
| **Secure Auth** | SHA-256 hashed passwords, session tokens with expiry |
| **Premium B&W Design** | Minimal, luxury aesthetic — mobile-first |

## Tech Stack

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **QR Codes**: qrcode.react
- **Auth**: SHA-256 hashed passwords + session tokens
- **Storage**: localStorage (backend-ready architecture)

## Local Setup

```bash
# Clone the repo
git clone https://github.com/Souryodipto/qr-dine.git
cd qr-dine

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Project Structure

```
src/
├── components/         # Shared UI components
│   ├── Navbar.jsx
│   └── SplashLoader.jsx
├── context/
│   └── AuthContext.jsx # Auth state (SHA-256 + sessions)
├── pages/
│   ├── Landing.jsx         # Public SaaS homepage
│   ├── OwnerLogin.jsx      # Owner authentication
│   ├── OwnerSignup.jsx     # Owner registration + OTP
│   ├── AdminLogin.jsx      # Admin authentication (hidden)
│   ├── SetupWizard.jsx     # 5-step restaurant onboarding
│   ├── OwnerDashboard.jsx  # Restaurant management
│   ├── AdminDashboard.jsx  # Platform admin panel
│   ├── CustomerMenu.jsx    # QR-accessed menu + cart
│   └── OrderConfirmation.jsx
├── utils/
│   ├── auth.js         # Crypto utilities (SHA-256, sessions)
│   └── store.js        # Multi-tenant data CRUD
├── App.jsx             # Route definitions
├── main.jsx            # App entry point
└── index.css           # Design system
```

## License

[Proprietary — All Rights Reserved](./LICENSE)

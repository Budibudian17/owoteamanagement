# OWO TEA Management

A modern, mobile-first financial management dashboard for OWO TEA, a tea business operating at CFD Margonda Depok. Built with React, TypeScript, and TanStack Router.

![OWO TEA](https://img.shields.io/badge/OWO-TEA-success)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

## Features

- **Date-Based Data Management**: Track financial data by operational dates with full history support
- **Material Cost Tracking**: Record and manage ingredient purchases with automatic total calculations
- **Sales Revenue Calculator**: Track cup sales with automatic revenue calculation
- **Flexible Payroll System**: 
  - Performance-based salary distribution (multiplier system)
  - Manual salary input mode
  - Cumulative balance tracking across weeks
- **Capital Fund Management**: Track accumulated capital from previous weeks
- **Holiday Mode**: Mark non-operational weeks
- **Role-Based Access**: Admin (full edit) and User (view-only) modes
- **Mobile-First Design**: Professional dashboard that works seamlessly on mobile and desktop
- **Local Storage**: All data stored locally in browser with structured date-based keys

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Context API
- **Storage**: Browser LocalStorage
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/owoteamanagement.git
cd owoteamanagement

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and set your admin password
```

### Development

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_ADMIN_PASSWORD=your_secure_password
```

## Usage

### Admin Access

1. Open the application
2. Enter the admin password (set in `.env`)
3. Access full dashboard with edit capabilities

### User Access (View-Only)

1. Click "Login as User (View Only)" on the login screen
2. View financial data without edit permissions

### Key Features

**Date Navigation**
- Select operational dates using the date picker
- View historical data from previous weeks
- Data automatically updates based on selected date

**Material Management**
- Add ingredients with name, quantity, unit, and price
- Automatic total calculation per item
- Copy materials from previous week

**Revenue Tracking**
- Input number of cups sold
- Set price per cup
-Automatic revenue calculation

**Payroll Management**
- Add team members dynamically
- Set performance multipliers (0.3x to 1.2x)
- Track withdrawn amounts
- View cumulative balances across weeks
- Three payroll modes: Share-based, Total manual, Per-person manual

**Capital Fund**
- Track accumulated capital from previous weeks
- View opening capital, inflow, and spent amounts
- Automatic balance calculation

## Project Structure

```
owoteamanagement/
├── src/
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   ├── owo/           # Dashboard components
│   │   └── ui/            # shadcn/ui components
│   ├── lib/
│   │   ├── auth.tsx       # Authentication context
│   │   └── owo/           # Business logic & storage
│   └── routes/            # TanStack Router routes
├── public/                # Static assets
└── .env                   # Environment variables
```

## License

This project is private and proprietary.

## Support

For support, please contact the project maintainer.
# owoteamanagement

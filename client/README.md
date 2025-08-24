# ProfitPilot: From Bills to Balance Sheet

A modern, responsive financial SaaS application built with React, Vite, and Tailwind CSS, featuring comprehensive authentication and a clean dashboard interface.

## 🚀 Features

### ✨ Authentication System
- **Login & Signup Forms**: Modern, responsive design with toggle functionality
- **Supabase Integration**: Ready for production with Supabase auth
- **Google OAuth**: "Continue with Google" button support
- **Demo Mode**: Built-in demo authentication for testing
- **Form Validation**: Client-side validation with error handling
- **Loading States**: Professional loading indicators
- **Dark Mode Ready**: Light/dark theme support

### 📊 Dashboard
- **Analytics Cards**: Total Sales, Expenses, Net Profit, GST Reclaimable
- **File Upload**: Drag & drop interface for bills (PDF, images, CSV, Excel)
- **Bills Table**: Recent transactions with status indicators
- **User Menu**: Profile dropdown with logout functionality
- **Responsive Design**: Mobile-first, professional fintech UI

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Supabase (with demo fallback)
- **State Management**: React Hooks
- **Build Tool**: Vite
- **Package Manager**: npm

## 📁 Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx      # Main dashboard component
│   ├── AuthForm.jsx       # Production auth with Supabase
│   └── DemoAuthForm.jsx   # Demo auth for testing
├── lib/
│   └── supabase.js        # Supabase configuration
├── App.jsx                # Main app with auth routing
├── main.jsx               # React root
└── index.css              # Tailwind directives
```

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup (For Production)
Create a `.env` file and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Supabase Setup (For Production)
1. Go to [supabase.com](https://supabase.com) and create a project
2. In your project dashboard, go to Settings > API
3. Copy the Project URL and Anon Key to your `.env` file
4. Enable email authentication and Google OAuth in Authentication > Providers

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

## 🎮 Demo Mode

The app includes a built-in demo mode that works without Supabase setup:

- **Quick Demo Access**: Click the blue demo button for instant access
- **Test Scenarios**: 
  - Try password "wrongpass" to see error handling
  - Use email "test@error.com" for signup error demo
  - Any other credentials will work for demo
- **Google Auth Demo**: Opens a mock Google auth window

## 🎨 Design Features

### Authentication UI
- **Centered Card Layout**: Professional, modern design
- **Gradient Background**: Blue to indigo gradient
- **Form States**: Loading, error, and success states
- **Responsive**: Mobile-first design
- **Accessibility**: Proper labels and focus states

### Dashboard UI
- **Clean Header**: Logo, tagline, and user menu
- **Analytics Grid**: 4-card responsive layout
- **Interactive Upload**: Drag & drop with visual feedback
- **Data Table**: Striped rows, status badges, responsive
- **Professional Footer**: Clean, minimal

## 🔄 Production Setup

To use with real Supabase authentication:

1. Replace `DemoAuthForm` with `AuthForm` in `App.jsx`
2. Add your Supabase credentials to `.env`
3. Enable authentication providers in Supabase dashboard
4. Configure OAuth redirect URLs

## 🎯 Key Components

### AuthForm.jsx (Production)
- Full Supabase integration
- Email/password authentication
- Google OAuth support
- Real-time auth state management

### DemoAuthForm.jsx (Demo)
- Mock authentication functions
- Simulated API delays
- Local storage persistence
- Test scenarios for UX

### Dashboard.jsx
- User context integration
- File upload functionality
- Responsive data visualization
- User menu with logout

## 📱 Responsive Breakpoints

- **Mobile**: 1 column layout
- **Tablet**: 2 column grid
- **Desktop**: 4 column analytics grid
- **Large**: Max-width container

## 🎨 Color Palette

- **Primary**: #2563eb (Blue)
- **Success**: #059669 (Green)
- **Warning**: #ea580c (Orange)
- **Dark**: #1e293b (Slate)

## 🚀 Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 📝 License

© 2025 ProfitPilot. All rights reserved.

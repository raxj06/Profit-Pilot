# ProfitPilot: From Bills to Balance Sheet

ProfitPilot is an AI-powered financial management application that helps small businesses track expenses, manage sales, and calculate profit & loss automatically by processing bills using AI.

## 🌟 Features

### 🧾 Bill Processing
- Upload bills (images, PDFs) with drag & drop interface
- AI-powered extraction of key bill information
- Automatic categorization of bills as Sales or Purchase
- GST calculation and tracking

### 📊 Financial Dashboard
- Real-time analytics and financial overview
- Total bills tracking
- Sales and purchase monitoring with separate cards
- GST calculation with separate tracking for sales GST and purchase GST
- Total GST amount calculation
- Reclaimable GST tracking (based on purchase GST)
- Sales GST tracking
- Recent transactions table

### 🔐 Authentication
- Secure user authentication with Supabase
- Demo mode for quick testing
- Google OAuth integration

### ☁️ Cloud Infrastructure
- Supabase for authentication and data storage
- n8n workflow automation for AI processing
- Scalable cloud architecture

## 🏗️ Architecture

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend  │    │   Backend    │    │      AI      │
│   (React)   │◄──►│  (Node.js)   │◄──►│   (n8n +     │
└─────────────┘    └──────────────┘    │  Gemini AI)  │
                                       └──────────────┘
                                              │
                                       ┌──────────────┐
                                       │  Supabase    │
                                       │ (Database &  │
                                       │   Storage)   │
                                       └──────────────┘
```

## 🛠️ Tech Stack

### Frontend
- React.js with Vite
- Tailwind CSS for styling
- Supabase Auth for authentication
- React Router for navigation

### Backend
- Node.js with Express
- PostgreSQL database via Supabase
- RESTful API architecture
- n8n webhook integration

### AI Processing
- n8n workflow automation platform
- Google Gemini AI for document processing
- Automated data extraction from bills

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Supabase account
- n8n account with Gemini AI integration

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/ProfitPilot.git
   cd ProfitPilot
   ```

2. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd ../backend
   npm install
   ```

4. Set up environment variables:
   Create a `.env` file in the `backend` directory with:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   N8N_WEBHOOK_URL=your_n8n_webhook_url
   ```

   Create a `.env` file in the `client` directory with:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_BACKEND_URL=http://localhost:4000
   ```

5. Initialize the database:
   ```bash
   node scripts/init-db.js
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Start the frontend development server:
   ```bash
   cd client
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`

## 📈 Dashboard Features

The dashboard provides a comprehensive overview of your financial data:

- **Total Bills**: Count of all processed bills
- **Total Amount**: Sum of all bill amounts
- **Purchase Amount**: Sum of all purchase bill amounts
- **Sales Amount**: Sum of all sales bill amounts
- **This Month**: Current month reference
- **Total GST**: Sum of GST from all bills
- **Sales GST**: GST amount from sales bills
- **GST Reclaimable**: GST amount from purchase bills that can be reclaimed

## 📤 Bill Upload Process

1. Navigate to the upload section
2. Drag and drop your bill image/PDF or click to select
3. The bill is sent to n8n workflow for AI processing
4. AI extracts key information from the bill
5. Processed data is stored in Supabase database
6. Results are displayed in the application

## 🔄 Data Flow

1. User uploads a bill through the frontend
2. Frontend sends the bill to the backend
3. Backend stores the bill in Supabase storage
4. Backend triggers n8n webhook with bill data
5. n8n workflow processes the bill with Gemini AI
6. AI extracted data is sent back to backend
7. Backend updates the database with processed information
8. Frontend fetches and displays updated data

## 📁 Project Structure

```
ProfitPilot/
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── utils/
│   ├── scripts/
│   ├── server.js
│   └── app.js
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── index.html
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for document processing capabilities
- Supabase for backend infrastructure
- n8n for workflow automation
- React and Node.js communities
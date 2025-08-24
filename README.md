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
- Sales and purchase monitoring
- GST reclaimable calculation
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
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Supabase JS** - Authentication and data

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database (via Supabase)
- **Supabase** - Authentication and storage

### AI Processing
- **n8n** - Workflow automation
- **Google Gemini AI** - Bill data extraction

## 📁 Project Structure

```
profit-pilot/
├── backend/                 # Backend API service
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Auth, upload middleware
│   ├── routes/             # API route definitions
│   ├── utils/              # Helper functions
│   ├── config/             # Database configuration
│   └── scripts/            # Database initialization
└── client/                 # Frontend React application
    ├── src/
    │   ├── components/     # React components
    │   ├── lib/            # Supabase configuration
    │   └── assets/         # Images and static assets
    └── public/             # Public assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 14+
- npm or yarn
- Supabase account
- n8n account (for AI processing)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd profit-pilot
```

2. **Setup Backend:**
```bash
cd backend
npm install
```

3. **Setup Frontend:**
```bash
cd ../client
npm install
```

### Environment Configuration

#### Backend (.env)
Create a `.env` file in the `backend` directory:
```env
PORT=4000
JWT_SECRET=your_jwt_secret_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/process-bill
N8N_JWT_SECRET=your-n8n-jwt-secret
```

#### Frontend (.env)
Create a `.env` file in the `client` directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=http://localhost:4000
```

### Database Setup

1. Create a Supabase project
2. Set up the required tables:
```sql
-- bills table
CREATE TABLE bills (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  invoice_number TEXT,
  invoice_date DATE,
  seller_name TEXT,
  seller_address TEXT,
  seller_gstin TEXT,
  buyer_name TEXT,
  buyer_address TEXT,
  buyer_gstin TEXT,
  total_amount DECIMAL(10, 2),
  gst_amount DECIMAL(10, 2),
  transaction_type TEXT CHECK (transaction_type IN ('sales', 'purchase')),
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- bill_items table
CREATE TABLE bill_items (
  id SERIAL PRIMARY KEY,
  bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
  description TEXT,
  quantity INTEGER,
  unit_price DECIMAL(10, 2),
  amount DECIMAL(10, 2),
  gst_rate DECIMAL(5, 2),
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

3. Create a storage bucket named `uploaded-bills`
4. Set appropriate permissions for the bucket

### Running the Application

#### Backend
```bash
cd backend
npm run dev    # Development mode
# or
npm start      # Production mode
```

#### Frontend
```bash
cd client
npm run dev    # Development mode
npm run build  # Production build
```

## 🎮 Usage

1. Start both frontend and backend servers
2. Open your browser and navigate to the frontend URL (typically http://localhost:3000)
3. Sign up or use demo mode to access the dashboard
4. Upload bills using the drag & drop interface
5. Select bill type (Sales/Purchase) before processing
6. View financial analytics on the dashboard

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

### Bills
- `POST /api/bills/upload` - Upload and process a bill
- `GET /api/bills` - Get user bills
- `GET /api/bills/stats/:userId` - Get user statistics

### Health
- `GET /health` - Backend health check

## 🧪 Testing

### Frontend Testing
1. Ensure frontend is running on `http://localhost:3000`
2. Test authentication flows
3. Test bill upload functionality
4. Verify dashboard displays data correctly

### Backend Testing
1. Ensure backend is running on `http://localhost:4000`
2. Test API endpoints with tools like Postman
3. Verify database operations
4. Check authentication middleware

### Bill Processing Testing
1. Upload various bill formats (PDF, JPG, PNG)
2. Verify AI extraction accuracy
3. Check data storage in database
4. Confirm dashboard updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please open an issue on the GitHub repository or contact the development team.
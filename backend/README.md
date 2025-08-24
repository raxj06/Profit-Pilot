# ProfitPilot Backend

This is the backend service for ProfitPilot - an AI-powered Profit & Loss calculator for small businesses.

## Features

- File upload and storage using Supabase
- AI-powered bill processing with n8n and Google Gemini
- Secure authentication with Supabase Auth
- Data storage in Supabase PostgreSQL
- RESTful API for frontend integration

## Prerequisites

- Node.js 14+
- Supabase account with configured project
- n8n workflow set up for bill processing

## Setup

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
5. Update the `.env` file with your configuration:
   - Supabase URL and anon key
   - n8n webhook URL and credentials
   - JWT secret

## Environment Variables

Create a `.env` file with the following variables:

```env
PORT=3000
JWT_SECRET=your_jwt_secret_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
N8N_WEBHOOK_URL=https://your-n8n.azurewebsites.net/webhook/process-bill
N8N_USER=your-basic-auth-user
N8N_PASSWORD=your-basic-auth-pass
```

## Supabase Setup

1. Create a Supabase project
2. Set up the following tables in your database:

```sql
-- bills table
CREATE TABLE bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  vendor_name TEXT,
  vendor_gstin TEXT,
  buyer_name TEXT,
  buyer_gstin TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  total_amount NUMERIC,
  gst_amount NUMERIC,
  type TEXT CHECK (type IN ('sales', 'expense')),
  file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- bill_items table
CREATE TABLE bill_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  description TEXT,
  quantity INT,
  unit_price NUMERIC,
  amount NUMERIC,
  gst_rate INT,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

3. Create a storage bucket named `uploaded-bills`
4. Set appropriate permissions for the bucket

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on the port specified in your `.env` file (default is 3000).

## API Endpoints

### Authentication

- `GET /api/auth/me` - Get current user information (requires authentication)

### Bill Processing

- `POST /api/bills/upload` - Upload and process a bill (requires authentication)
  - Form data with `bill` field containing the file

### Dashboard

- `GET /api/dashboard/analytics` - Get dashboard analytics (requires authentication)

### Testing

- `GET /api/test/supabase-test` - Test Supabase connection (requires authentication)
- `GET /api/health` - Health check endpoint (no authentication required)

## How It Works

1. User uploads a bill through the frontend
2. Backend receives the file and uploads it to Supabase Storage
3. Backend calls the n8n webhook with the file URL
4. n8n processes the bill using Google Gemini AI
5. n8n returns structured data to the backend
6. Backend saves the data to Supabase PostgreSQL
7. Backend returns processing results to the frontend

## Security

- All API endpoints (except health check) require authentication
- File uploads are associated with the authenticated user
- Communication with n8n is secured with Basic Auth
- Environment variables are used for sensitive configuration

## Error Handling

The backend includes comprehensive error handling for:
- File upload failures
- Supabase storage errors
- n8n processing errors
- Database insertion errors
- Authentication failures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.
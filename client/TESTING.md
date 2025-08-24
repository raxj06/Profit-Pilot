# ProfitPilot Upload Flow Testing Guide

## 🧪 Testing the Complete Bill Upload & Processing Flow

### Prerequisites
1. ✅ Frontend running on `http://localhost:3002`
2. ✅ Backend running on `http://localhost:3001`  
3. ✅ Supabase configured with authentication
4. ✅ Storage bucket 'bills' created
5. ⚠️ N8N webhook configured (optional for basic testing)

### 🔍 Step-by-Step Testing

#### 1. Test Backend Health
```bash
curl http://localhost:3001/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "message": "ProfitPilot Backend is running",
  "timestamp": "2025-08-21T...",
  "version": "1.0.0"
}
```

#### 2. Test Frontend Upload Component
1. Open `http://localhost:3002` in browser
2. Login with your Supabase account
3. Navigate to dashboard
4. Look for the new "Upload Bill" section

#### 3. Test File Upload Flow
1. **Drag & Drop Test:**
   - Drag an image or PDF file to the upload area
   - Should show file preview and "Process Bill" button

2. **Click Upload Test:**
   - Click the upload area
   - Select a file from dialog
   - Should show file preview

3. **Process Bill Test:**
   - Click "Process Bill" button
   - Should show upload progress
   - Should trigger backend API call
   - Should show success message

#### 4. Verify Backend Processing
Check backend console for logs:
```
📤 Bill upload request received: { userId, fileName, fileUrl }
🔗 Triggering n8n workflow...
✅ N8N workflow triggered successfully
```

#### 5. Test Error Scenarios
1. **Large File (>10MB):** Should show size error
2. **Invalid File Type:** Should show type error  
3. **Network Error:** Should show connection error
4. **Not Logged In:** Should show authentication error

### 🗄️ Database Verification

#### Check Supabase Storage
1. Go to Supabase Dashboard → Storage
2. Look for 'bills' bucket
3. Check if files are uploaded under `bills/{userId}/`

#### Check Database Records (After N8N Processing)
```sql
SELECT * FROM bills ORDER BY created_at DESC LIMIT 5;
```

### 🔧 Troubleshooting

#### Common Issues:

**"Failed to get user information"**
- User not logged in
- Check authentication state

**"File upload failed"**
- Storage bucket not created
- Run `storage-setup.sql` in Supabase

**"Backend error: 502"**
- N8N webhook not configured
- Update `N8N_WEBHOOK_URL` in server/.env

**"CORS error"**
- Backend not running on port 3001
- Check FRONTEND_URL in server/.env

#### Debug Commands:
```bash
# Check if backend is running
curl http://localhost:3001/health

# Test upload endpoint (replace with real data)
curl -X POST http://localhost:3001/api/upload \
  -H "Content-Type: application/json" \
  -d '{
    "fileUrl": "https://example.com/test.pdf",
    "userId": "test-user-123", 
    "fileName": "test.pdf"
  }'

# Check webhook endpoint  
curl http://localhost:3001/webhook/health
```

### 📊 Expected Flow:

1. **User selects file** → File validation → Preview shown
2. **User clicks "Process Bill"** → File uploads to Supabase Storage
3. **Frontend gets file URL** → Calls backend `/api/upload`
4. **Backend receives request** → Triggers N8N webhook
5. **N8N processes file** → Extracts data → Calls `/webhook/bill-processed`
6. **Backend saves data** → Inserts into `bills` table
7. **User sees success** → Processing complete notification

### 🎯 Success Indicators:

- ✅ File appears in Supabase Storage bucket
- ✅ Backend logs show successful API calls
- ✅ N8N workflow triggered (if configured)
- ✅ User sees processing confirmation
- ✅ No JavaScript console errors
- ✅ Smooth UI transitions and feedback

### 📝 Test Cases:

| Test | File Type | Size | Expected Result |
|------|-----------|------|----------------|
| Valid Image | JPG | 2MB | ✅ Success |
| Valid PDF | PDF | 5MB | ✅ Success |  
| Large File | JPG | 15MB | ❌ Size error |
| Invalid Type | TXT | 1MB | ❌ Type error |
| No Internet | JPG | 2MB | ❌ Network error |

Ready to test! 🚀

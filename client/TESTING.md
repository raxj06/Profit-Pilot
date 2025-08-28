# Testing Guide

## Prerequisites

Make sure you have the following running:

1. ✅ Frontend running on `https://your-frontend-domain.com`
2. ✅ Backend running on `https://your-backend-domain.com`  

## Health Checks

Check backend health:
```bash
curl https://your-backend-domain.com/health
```

## API Testing

### Upload a file:
```bash
curl -X POST https://your-backend-domain.com/api/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/file.jpg" \
  -F "userId=your-test-user-id"
```

### Test webhook:
```bash
curl https://your-backend-domain.com/webhook/health
```

## UI Testing

1. Open `https://your-frontend-domain.com` in browser
2. Login with test credentials
3. Navigate to upload page
4. Upload a test bill
5. Verify the bill appears in the list
6. Click on the bill to view details

## Test Accounts

- Test User: `test@example.com` / `password123`

## Common Issues

### CORS Errors
If you see CORS errors, make sure your backend is configured with the correct frontend URL:
- Check `FRONTEND_URL` environment variable in backend
- Should match your frontend domain

### Network Errors
If you see network errors:

1. Check that both frontend and backend are running:
   ```bash
   curl https://your-backend-domain.com/health
   ```

2. Check environment variables:
   - Frontend should have `VITE_BACKEND_URL` set to your backend domain
   - Backend should have `FRONTEND_URL` set to your frontend domain (or '*')
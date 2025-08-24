const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for full access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed'));
    }
  }
});

// Function to upload file to Supabase Storage
const uploadToSupabase = async (file, userId) => {
  try {
    const fileName = `${userId}/${Date.now()}_${file.originalname}`;
    
    console.log(`☁️ Uploading file to Supabase Storage: ${fileName}`);
    console.log(`📁 File type: ${file.mimetype}`);
    console.log(`📊 File size: ${file.buffer.length} bytes`);
    
    const { data, error } = await supabase.storage
      .from('bills')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });
    
    if (error) {
      console.error('❌ Error uploading file to Supabase Storage:', error.message);
      throw new Error(`Error uploading file to Supabase: ${error.message}`);
    }
    
    console.log('✅ File uploaded to Supabase Storage successfully');
    
    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('bills')
      .getPublicUrl(fileName);
    
    console.log(`🔗 Public URL for uploaded file: ${publicUrl}`);
    
    return {
      fileName: fileName,
      url: publicUrl
    };
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    // Re-throw error with message only, without the full stack trace
    throw new Error(error.message);
  }
};

module.exports = {
  upload,
  uploadToSupabase
};
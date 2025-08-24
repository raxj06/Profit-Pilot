const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for full access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test Supabase connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.log('Supabase connection failed:', error.message);
  } else {
    console.log('Supabase connection successful');
  }
}).catch(err => {
  console.log('Supabase connection error:', err.message);
});

const auth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid Authorization header');
      return res.status(401).json({ 
        error: 'Missing or invalid Authorization header' 
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    console.log('🔐 Verifying user token with Supabase...');
    
    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.log('❌ Invalid or expired token');
      return res.status(401).json({ 
        error: 'Invalid or expired token' 
      });
    }
    
    console.log(`✅ User authenticated: ${data.user.id} (${data.user.email})`);
    
    // Attach user to request
    req.user = data.user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during authentication' 
    });
  }
};

module.exports = auth;
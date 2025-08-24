const jwt = require('jsonwebtoken');

const generateN8nToken = (payload) => {
  console.log('🔐 Generating JWT token for n8n with payload:', JSON.stringify(payload, null, 2));
  
  const token = jwt.sign(payload, process.env.N8N_JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '5m', // 5 minutes
    issuer: 'profitpilot-backend',
    audience: 'n8n'
  });
  
  console.log('✅ JWT token generated successfully');
  return token;
};

module.exports = {
  generateN8nToken
};
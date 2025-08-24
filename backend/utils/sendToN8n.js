const axios = require('axios');

const processBillViaN8n = async (fileUrl, fileName, fileType, userId, userEmail, jwtToken) => {
  try {
    console.log(`🚀 Sending request to n8n webhook: ${process.env.N8N_WEBHOOK_URL}`);
    console.log(`📎 File: ${fileName} (${fileType})`);
    console.log(`👤 User: ${userId} (${userEmail})`);
    
    const response = await axios.post(process.env.N8N_WEBHOOK_URL, {
      fileUrl,
      fileName,
      fileType,
      userId,
      userEmail
    }, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2 minutes timeout
    });
    
    console.log(`✅ Received response from n8n (status: ${response.status})`);
    console.log(`📋 n8n response data:`, JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error calling n8n webhook:', error.message);
    if (error.response) {
      console.error('📄 Response data:', error.response.data);
      console.error('🔢 Response status:', error.response.status);
      console.error('📋 Response headers:', error.response.headers);
    }
    throw new Error('Failed to process bill via n8n');
  }
};

module.exports = {
  processBillViaN8n
};
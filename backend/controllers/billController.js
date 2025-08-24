const { uploadToSupabase } = require('../middleware/upload');
const { generateN8nToken } = require('../utils/generateN8nToken');
const { processBillViaN8n } = require('../utils/sendToN8n');
const pool = require('../config/db');

const uploadBill = async (req, res) => {
  try {
    console.log('📥 Starting bill upload process...');
    
    // Check if file was uploaded
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ 
        error: 'No file uploaded' 
      });
    }
    
    const userId = req.user.id;
    const userEmail = req.user.email;
    const billType = req.body.billType || 'purchase'; // Get bill type from request body
    
    console.log(`📄 File received: ${req.file.originalname} (${req.file.size} bytes)`);
    console.log(`👤 User: ${userId} (${userEmail})`);
    console.log(`🏷️ Bill Type: ${billType}`);
    
    // Upload file to Supabase Storage
    console.log('☁️ Uploading file to Supabase Storage...');
    const { fileName, url } = await uploadToSupabase(req.file, userId);
    console.log(`✅ File uploaded successfully: ${fileName}`);
    console.log(`🔗 File URL: ${url}`);
    
    // Generate JWT token for n8n
    console.log('🔐 Generating JWT token for n8n...');
    const n8nToken = generateN8nToken({
      userId: userId,
      userEmail: userEmail,
      fileName: fileName,
      fileUrl: url
    });
    console.log('✅ JWT token generated for n8n');
    
    // Process bill via n8n webhook
    console.log('🤖 Sending file to n8n for processing...');
    const n8nResponse = await processBillViaN8n(
      url,
      fileName,
      req.file.mimetype,
      userId,
      userEmail,
      n8nToken
    );
    
    console.log('✅ Received response from n8n:', JSON.stringify(n8nResponse, null, 2));
    
    // Extract data from n8n response
    const billData = n8nResponse.output || n8nResponse;
    if (!billData) {
      throw new Error('Invalid response format from n8n');
    }
    
    console.log('💾 Saving bill data to database...');
    
    // Save bill data to database
    const billQuery = `
      INSERT INTO bills (
        user_id, 
        file_url, 
        invoice_number, 
        invoice_date, 
        seller_name, 
        seller_address, 
        seller_gstin, 
        buyer_name, 
        buyer_address, 
        buyer_gstin, 
        total_amount, 
        gst_amount, 
        transaction_type,
        raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `;
    
    const billValues = [
      userId,
      url,
      billData.invoice?.invoiceNo || '',
      billData.invoice?.invoiceDate || new Date(),
      billData.seller?.name || '',
      billData.seller?.address || '',
      billData.seller?.gstin || '',
      billData.buyer?.name || '',
      billData.buyer?.address || '',
      billData.buyer?.gstin || '',
      billData.totalAmount || 0,
      billData.gstAmount || 0,
      billType, // Use the billType from request
      JSON.stringify(n8nResponse)
    ];
    
    const billResult = await pool.query(billQuery, billValues);
    const billId = billResult.rows[0].id;
    
    console.log(`✅ Bill saved to database with ID: ${billId}`);
    
    // Save bill items to database
    if (billData.items && Array.isArray(billData.items)) {
      console.log(`💾 Saving ${billData.items.length} bill items to database...`);
      
      for (const item of billData.items) {
        const itemQuery = `
          INSERT INTO bill_items (
            bill_id,
            description,
            quantity,
            unit_price,
            amount,
            gst_rate,
            category
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        // Calculate amount to ensure it matches the constraint
        // quantity * unit_price should equal amount
        const quantity = item.quantity || 0;
        const unitPrice = item.unitPrice || 0;
        const calculatedAmount = quantity * unitPrice;
        // Use the calculated amount rather than the provided amount to satisfy the constraint
        const amount = calculatedAmount;
        
        const itemValues = [
          billId,
          item.description || '',
          quantity,
          unitPrice,
          amount, // Use calculated amount to satisfy constraint
          item.gstRate || 0,
          item.category || 'uncategorized'
        ];
        
        await pool.query(itemQuery, itemValues);
      }
      
      console.log('✅ Bill items saved to database');
    }
    
    // Return success response with the saved data
    res.status(200).json({
      message: 'Bill uploaded and processed successfully',
      billId: billId,
      data: billData
    });
  } catch (error) {
    console.error('❌ Error processing bill:', error);
    res.status(500).json({ 
      error: 'Internal server error while processing bill' 
    });
  }
};

const getBills = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log(`📊 Fetching bills for user ${userId} (limit: ${limit})`);
    
    // Updated query to match the actual schema
    const query = `
      SELECT id, user_id, file_url, invoice_number, invoice_date, 
             seller_name, seller_address, seller_gstin,
             buyer_name, buyer_address, buyer_gstin,
             total_amount, gst_amount, transaction_type, category,
             status, created_at, updated_at
      FROM bills 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, limit]);
    
    console.log(`✅ Found ${result.rows.length} bills for user ${userId}`);
    
    res.status(200).json({
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching bills' 
    });
  }
};

const getStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    const period = parseInt(req.query.period) || 30; // Default to 30 days
    
    console.log(`📈 Fetching stats for user ${userId} (period: ${period} days)`);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    
    // Updated query to calculate detailed stats including GST reclaim
    const query = `
      SELECT 
        COUNT(*) as total_bills,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(gst_amount), 0) as total_gst,
        COALESCE(SUM(CASE WHEN transaction_type = 'sales' THEN total_amount ELSE 0 END), 0) as sales_amount,
        COALESCE(SUM(CASE WHEN transaction_type = 'purchase' THEN total_amount ELSE 0 END), 0) as purchase_amount,
        COALESCE(SUM(CASE WHEN transaction_type = 'sales' THEN gst_amount ELSE 0 END), 0) as sales_gst,
        COALESCE(SUM(CASE WHEN transaction_type = 'purchase' THEN gst_amount ELSE 0 END), 0) as purchase_gst
      FROM bills 
      WHERE user_id = $1 
      AND created_at BETWEEN $2 AND $3
    `;
    
    const result = await pool.query(query, [userId, startDate, endDate]);
    
    // Calculate GST reclaimable amount (for purchase bills)
    const stats = result.rows[0];
    stats.reclaimable_gst = stats.purchase_gst || 0;
    
    console.log(`✅ Stats fetched for user ${userId}:`, stats);
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching stats' 
    });
  }
};

module.exports = {
  uploadBill,
  getBills,
  getStats
};
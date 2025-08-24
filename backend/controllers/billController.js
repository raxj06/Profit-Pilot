const { uploadToSupabase } = require('../middleware/upload');
const { generateN8nToken } = require('../utils/generateN8nToken');
const { processBillViaN8n } = require('../utils/sendToN8n');
const pool = require('../config/db');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for full access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    
    // Fetch bill items for each bill
    const billsWithItems = await Promise.all(result.rows.map(async (bill) => {
      const itemsQuery = `
        SELECT id, bill_id, description, quantity, unit_price, amount, gst_rate, category, created_at
        FROM bill_items 
        WHERE bill_id = $1
        ORDER BY created_at ASC
      `;
      
      const itemsResult = await pool.query(itemsQuery, [bill.id]);
      return {
        ...bill,
        bill_items: itemsResult.rows
      };
    }));
    
    console.log(`✅ Found ${result.rows.length} bills for user ${userId}`);
    
    res.status(200).json({
      data: billsWithItems
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching bills' 
    });
  }
};

const getBillById = async (req, res) => {
  try {
    const userId = req.user.id;
    const billId = req.params.billId;
    
    console.log(`📄 Fetching bill ${billId} for user ${userId}`);
    
    // Fetch the bill
    const billQuery = `
      SELECT id, user_id, file_url, invoice_number, invoice_date, 
             seller_name, seller_address, seller_gstin,
             buyer_name, buyer_address, buyer_gstin,
             total_amount, gst_amount, transaction_type, category,
             status, created_at, updated_at, subtotal, other_charges, payment_method, notes
      FROM bills 
      WHERE id = $1 AND user_id = $2
    `;
    
    const billResult = await pool.query(billQuery, [billId, userId]);
    
    if (billResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Bill not found' 
      });
    }
    
    const bill = billResult.rows[0];
    
    // Fetch bill items
    const itemsQuery = `
      SELECT id, bill_id, description, quantity, unit_price, amount, gst_rate, category, created_at
      FROM bill_items 
      WHERE bill_id = $1
      ORDER BY created_at ASC
    `;
    
    const itemsResult = await pool.query(itemsQuery, [billId]);
    
    // Add items to the bill
    const billWithItems = {
      ...bill,
      bill_items: itemsResult.rows
    };
    
    console.log(`✅ Found bill ${billId} for user ${userId}`);
    
    res.status(200).json({
      data: billWithItems
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching bill' 
    });
  }
};

const downloadBill = async (req, res) => {
  try {
    const userId = req.user.id;
    const billId = req.params.billId;
    
    console.log(`📥 Downloading bill ${billId} for user ${userId}`);
    
    // Fetch the bill to get the file path
    const billQuery = `
      SELECT id, user_id, file_url
      FROM bills 
      WHERE id = $1 AND user_id = $2
    `;
    
    const billResult = await pool.query(billQuery, [billId, userId]);
    
    if (billResult.rows.length === 0) {
      console.log(`❌ Bill ${billId} not found for user ${userId}`);
      return res.status(404).json({ 
        error: 'Bill not found' 
      });
    }
    
    const bill = billResult.rows[0];
    const fileUrl = bill.file_url;
    
    console.log(`📄 File URL from database: ${fileUrl}`);
    
    // Extract the file path from the public URL
    // The URL format is usually: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    let filePath = '';
    
    if (fileUrl.includes('/storage/v1/object/public/')) {
      const urlParts = fileUrl.split('/');
      const bucketIndex = urlParts.indexOf('public') + 1; // Index of 'bills' bucket
      filePath = urlParts.slice(bucketIndex + 1).join('/'); // Everything after 'bills'
    } else {
      // Fallback: try to extract path after the last occurrence of the bucket name
      const bucketName = 'bills';
      const bucketIndex = fileUrl.indexOf(bucketName);
      if (bucketIndex !== -1) {
        filePath = fileUrl.substring(bucketIndex + bucketName.length + 1);
      } else {
        // If we can't parse the URL, return an error
        console.error('❌ Could not extract file path from URL:', fileUrl);
        return res.status(500).json({ 
          error: 'Could not extract file path from URL' 
        });
      }
    }
    
    console.log(`📄 Extracted file path: ${filePath}`);
    
    // Create a more direct download approach using the public URL
    // This ensures compatibility with how the files were originally uploaded
    try {
      // Fetch the file content from the public URL
      const fileResponse = await fetch(fileUrl);
      
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.status} ${fileResponse.statusText}`);
      }
      
      // Get the content type and other headers
      const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
      const contentLength = fileResponse.headers.get('content-length');
      
      // Convert response to buffer
      const arrayBuffer = await fileResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Get filename from the path
      const fileName = filePath.split('/').pop() || `bill-${billId}`;
      
      // Set appropriate headers for the file
      const headers = {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': contentType
      };
      
      if (contentLength) {
        headers['Content-Length'] = contentLength;
      }
      
      res.set(headers);
      res.send(buffer);
      
      console.log(`✅ Successfully sent file: ${fileName}`);
    } catch (fetchError) {
      console.error('❌ Error fetching file from public URL:', fetchError.message);
      // Fallback to Supabase download method
      const { data, error } = await supabase.storage
        .from('bills')
        .download(filePath);
      
      if (error) {
        console.error('❌ Error downloading file from Supabase:', error.message);
        return res.status(500).json({ 
          error: 'Error downloading file: ' + error.message
        });
      }
      
      if (!data) {
        console.error('❌ No data returned from Supabase download');
        return res.status(500).json({ 
          error: 'No data returned from file download' 
        });
      }
      
      // Convert the Blob to Buffer for proper transmission
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Get filename from the path
      const fileName = filePath.split('/').pop() || `bill-${billId}`;
      
      // Determine file extension for proper Content-Type
      let contentType = 'application/octet-stream'; // default
      
      if (fileName.toLowerCase().endsWith('.pdf')) {
        contentType = 'application/pdf';
      } else if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (fileName.toLowerCase().endsWith('.png')) {
        contentType = 'image/png';
      }
      
      // Set appropriate headers for the file
      res.set({
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': contentType,
        'Content-Length': buffer.length
      });
      
      // Send the file data
      res.send(buffer);
      console.log(`✅ Successfully sent file via Supabase download: ${fileName}`);
    }
  } catch (error) {
    console.error('Error downloading bill:', error);
    res.status(500).json({ 
      error: 'Internal server error while downloading bill: ' + error.message
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
  getBillById,
  downloadBill,
  getStats
};
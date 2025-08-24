const pool = require('../config/db');

async function initDatabase() {
  try {
    // Create bills table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bills (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        amount DECIMAL(10, 2) DEFAULT 0,
        gst DECIMAL(10, 2) DEFAULT 0,
        net_profit DECIMAL(10, 2) DEFAULT 0,
        gst_reclaimable DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('Database initialized successfully');
    console.log('Bills table created or already exists');
    
    // Create an index on user_id for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills (user_id)
    `);
    
    console.log('Index on user_id created or already exists');
    
    pool.end();
  } catch (error) {
    console.error('Error initializing database:', error);
    pool.end();
  }
}

initDatabase();
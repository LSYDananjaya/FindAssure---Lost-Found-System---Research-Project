const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dbConfig = require('../config/database');

/**
 * Setup script to create database schema
 * Run this script with: npm run db:setup
 */
async function setupDatabase() {
  const pool = new Pool(dbConfig);

  try {
    console.log('Starting database setup...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await pool.query(schema);
    
    console.log('✓ Database schema created successfully!');
    console.log('✓ Tables created: items, item_questions');
    console.log('✓ Indexes and triggers created');
    
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('Database connection closed.');
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;

const { Sequelize } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_PATH || path.join(__dirname, '../../database.sqlite'),
  logging: false, // Set to console.log to see SQL queries
  dialectOptions: {
    timeout: 15000, // Tăng thời gian chờ cho các truy vấn SQLite (đơn vị: ms)
  },
});

// Initialize and configure the database
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite connection established successfully.');

    // Enable WAL mode for better concurrency
    await sequelize.query('PRAGMA journal_mode=WAL;');
    console.log('WAL mode enabled for SQLite.');

    // Set busy_timeout to wait for locks to release
    await sequelize.query('PRAGMA busy_timeout = 5000;'); // 5000 milliseconds = 5 seconds
    console.log('SQLite busy_timeout set to 5000ms.');
    
    return true;
  } catch (error) {
    console.error('Failed to initialize SQLite database:', error);
    // Re-throw the error to be caught by the application's main startup logic
    // This ensures the server doesn't start if DB initialization fails.
    throw error; 
  }
};

module.exports = {
  sequelize,
  initializeDatabase, // Export the new initialization function
};

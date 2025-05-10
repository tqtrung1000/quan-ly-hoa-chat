const { Sequelize } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_PATH || path.join(__dirname, '../../database.sqlite'),
  logging: false, // Set to console.log to see SQL queries
});

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite connection established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the SQLite database:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
};

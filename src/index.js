require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection, sequelize } = require('./config/database');
const { syncDatabase } = require('./models/index');
const authRoutes = require('./routes/auth.routes');
const departmentRoutes = require('./routes/department.routes');
const bottleRoutes = require('./routes/bottle.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/bottles', bottleRoutes);

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Connect to SQLite and start server
const startServer = async () => {
  try {
    // Test database connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('Failed to connect to SQLite database');
      return;
    }
    
    // Sync models with database
    await syncDatabase();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error.message);
  }
};

// Start the server
startServer();

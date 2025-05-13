require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase, sequelize } = require('./config/database'); // Changed testConnection to initializeDatabase
const { User, syncDatabase } = require('./models/index'); // Added User import
const authRoutes = require('./routes/auth.routes');
const departmentRoutes = require('./routes/department.routes');
const bottleRoutes = require('./routes/bottle.routes');
const chemicalTypeRoutes = require('./routes/chemicaltype.routes'); // Import new chemical type routes
const chemicalRoutes = require('./routes/chemical.routes'); // Import new chemical routes
const bloodBottleRoutes = require('./routes/bloodbottle.routes'); // Import blood bottle routes

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
app.use('/api/bottles', bottleRoutes); // Keep old bottle routes for now, might remove later
app.use('/api/chemicaltypes', chemicalTypeRoutes); // Add new chemical type routes
app.use('/api/chemicals', chemicalRoutes); // Add new chemical routes
app.use('/api/bloodbottles', bloodBottleRoutes); // Add blood bottle routes

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Connect to SQLite and start server
const startServer = async () => {
  try {
    // Initialize and configure database (includes authentication and PRAGMA settings)
    await initializeDatabase(); 
    
    // Sync models with database
    await syncDatabase();

    // Create default admin user if it doesn't exist
    await createDefaultAdmin();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error.message);
  }
};

// Function to create a default admin user
const createDefaultAdmin = async () => {
  try {
    const adminUser = await User.findOne({ where: { name: 'admin' } }); // Reverted to name
    if (!adminUser) {
      await User.create({
        name: 'admin', // Reverted to name
        // email: 'admin@example.com', // Email field removed
        password: '123456', // Reverted to password
        isAdmin: true, // Reverted to isAdmin
      });
      console.log('Default admin user "admin" created successfully with the new password.');
    } else {
      console.log('Default admin user "admin" already exists. No new admin user was created.');
    }
  } catch (error) {
    console.error('Error creating default admin user:', error.message);
  }
};

// Start the server
startServer();

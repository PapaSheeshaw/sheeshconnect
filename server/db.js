const { MongoClient } = require('mongodb');

// Database URI and name
const DB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'sheeshconnect';

// Connection instances
let dbInstance;
let clientInstance;

// Function to connect to MongoDB
async function connectToDatabase() {
  if (dbInstance) {
    console.log("Reusing existing database connection.");
    return dbInstance;
  }

  try {
    console.log("Attempting to connect to MongoDB...");
    const client = new MongoClient(DB_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true
    });

    await client.connect();
    console.log("Connected to MongoDB");

    clientInstance = client; // Save client for later closure
    dbInstance = client.db(DB_NAME);
    return dbInstance;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

// Function to close the MongoDB connection
async function closeConnection() {
  if (clientInstance) {
    console.log("Closing MongoDB connection...");
    await clientInstance.close();
    clientInstance = null;
    dbInstance = null;
    console.log("MongoDB connection closed.");
  } else {
    console.log("No active MongoDB connection to close.");
  }
}

// Export functions for external use
module.exports = { connectToDatabase, closeConnection };

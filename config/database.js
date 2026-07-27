const mongoose = require("mongoose");


const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL ;
    const conn = await mongoose.connect(mongoUrl);
    console.log(`Connected to MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

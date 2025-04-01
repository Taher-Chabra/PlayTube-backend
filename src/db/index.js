import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
   try {
      const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
      console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
   } catch (error) {
      console.error('Error connecting to MongoDB:', error.message);
      process.exit(1); // Exit the process with failure
   }
}

export default connectDB;
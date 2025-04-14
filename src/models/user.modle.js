import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
   username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
   },
   email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
   },
   fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
   },
   avatar: {
      type: String,  // cloudinary url
      required: true,
   },
   coverImage: {
      type: String,  // cloudinary url
   },
   watchHistory: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Video',
      }
   ],
   password: {
      type: String,
      required: [true, 'Password is required'],
   },
   refreshToken: {
      type: String,
   },

}, { timestamps: true });

userSchema.pre('save', async function(next) {
   const user = this;

   try {
      if (!user.isModified('password')) return next();

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      user.password = hashedPassword;
      next();
   } catch (error) {
      console.error("Error hashing password:", error);
      next(error);
   }
});

userSchema.methods.comparePassword = async function(enteredPassword) {
   return await bcrypt.compare(enteredPassword, this.password);
}

userSchema.methods.generateAccessToken = function() {
   const payload = {
      _id: this._id,
      email: this.email,
      userame: this.username,
      fullName: this.fullName,
   }

   return jwt.sign(
      payload, 
      process.env.ACCESS_TOKEN_SECRET, 
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
   );
}

userSchema.methods.generateRefreshToken = function() {
   const payload = {
      _id: this._id,
   }

   return jwt.sign(
      payload, 
      process.env.REFRESH_TOKEN_SECRET, 
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY },
   );
}

export const User = mongoose.model('User', userSchema);
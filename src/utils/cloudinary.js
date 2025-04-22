import dotenv from 'dotenv';
dotenv.config();
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload file to Cloudinary

const uploadOnCloudinary = async (filePath) => {
   try {
      if (!filePath) return null;

      // Upload the file to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(filePath, {
         resource_type: "auto"
      });

      // Delete the file from local storage after upload
      fs.unlinkSync(filePath);

      return uploadResult;

   } catch (error) {
      fs.unlinkSync(filePath); // Delete the file from local storage as upload operation failed
      return null;
   }
}

// Delete file from Cloudinary

const deleteFromCloudinary = async (publicId) => {
   try {
      if (!publicId) return null;

      // Delete the file from Cloudinary
      const deleteResult = await cloudinary.uploader.destroy(publicId, {
         resource_type: "image"
      });

      return deleteResult;
   } catch (error) {
      console.error("Error deleting Image from Cloudinary:", error);
      return null;
   }
}


export { uploadOnCloudinary, deleteFromCloudinary };
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnColoudinary = async (locakFilePath) => {
    try {
        if (!locakFilePath) return null;
        //upload the file to coloudinary
        const response = await cloudinary.uploader.upload(locakFilePath, {
            resource_type: "auto"
        })
        //file has been uploaded successfully
        // console.log("file is uploaded successfully", response.url);
        fs.unlinkSync(locakFilePath); // remove the locally saved temprory file
        return response;
    } catch (error) {
        fs.unlinkSync(locakFilePath); // remove the locally saved temprory file as
        //the upload operation got failed.
    }
}

export { uploadOnColoudinary };

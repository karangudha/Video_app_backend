import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnColoudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";




const registerUser = asyncHandler( async (req, res) => {
    const { fullName, email, username, password} = req.body
    console.log("email : ", email)

    if([fullName, email, username, password].some((fild) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    // if(fullName === ""){
    //     throw new ApiError(400, "FullName is required")
    // }

    //check if user is already existing or not
    const existedUser = User.findOne({
        $or: [{ email }, { username }]
    })
    // if user exists, throw an error
    if(existedUser){
        throw new ApiError(400, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath)
    {
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadOnColoudinary(avatarLocalPath);
    const coverImage = await uploadOnColoudinary(coverImageLocalPath);
    if(!avatar)
    {
        throw new ApiError(400, "Failed to upload avatar")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser)
    {
        throw new ApiError(500, "Failed to create user")
    }

    return res.status(200).json(
        new ApiResponse(201, createdUser, "User created successfully")
    )

})


export { registerUser }; 



//Algo or logic  to register user :
/*
    1. get user details from frontend
    2. validate user details (like name, email, password, etc.)
    3. check if user already exists in the database (by email)
    4. if user exists, send error response
    4. check for images and upload them on coludinary
    5. Check if avtar is successfully uploaded ir not
    5. if user doesn't exist, hash the password and save the user details in the database
    6. generate an access token for the user and remove oassword and refresh token and send it as a response to the frontend
    7. Check if user created or not,
    8. Return response or error
*/
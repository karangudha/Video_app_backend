import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../modles/user.model.js";
import { uploadOnColoudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();
        user.refreshToken = refreshToken;
        await user.save({ validationBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body
    // console.log("email : ", email, "fullName : ", fullName)
    // console.log("username : ", username)


    if ([fullName, email, username, password].some((field) =>
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })
    // if user exists, throw an error
    if (existedUser) {
        throw new ApiError(400, "User already exists")
    }
    //console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path
    //const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadOnColoudinary(avatarLocalPath);
    const coverImage = await uploadOnColoudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Failed to upload avatar")
    }

    const user = await User.create({
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
        fullName,
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Failed to create user")
    }

    return res.status(200).json(
        new ApiResponse(201, createdUser, "User created successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    /*
        1. get user details from frontend or req.body
        2. check if email and username is provides or not
        3. user found in database or not then send error 
        4. check if password matches with the hashed password in the database or not send error
        5. generate access token and refresh token for the user
        6. send token in the form of cookies.
    */
    const { email, userName, password } = req.body;

    if (!email || !userName) {
        throw new ApiError(400, "email or username is required");
    }

    const user = await User.findOne({
        $or: [{ email, userName }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordVaild = await user.isPasswordCorrect(password);

    if (!isPasswordVaild) {
        throw new ApiError(401, "Invalid password credentials")
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id);

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, refreshToken, accessToken
                },
                "User logged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {
            new: true,
        }
    )
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res
        .status(200)
        .clearCookies("accessToken", options)
        .clearCookies("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged in successfully")
        )
})

export { registerUser, loginUser, logoutUser };



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
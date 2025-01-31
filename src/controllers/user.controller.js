import { asyncHandler } from "../utils/asyncHandler.js";


const registerUser = asyncHandler( async (req, res) => {
    const { fullName, email, username, password} = req.body
    console.log("email : ", email)
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
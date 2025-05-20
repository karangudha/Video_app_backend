import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../modles/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(401, "No token found")
        }

        const decodedJWT = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) //verify is jwt method to decode token.

        const user = await User.findById(decodedJWT._id).select("-password -refreshToken");
        if (!user) {
            throw new ApiError(404, "User not found")
        }

        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid token");
    }
})

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
    try {
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        serverTime: new Date(),
                        status: "active",
                    },
                    "Server is healthy"
                )
            )
    } catch (error) {
        throw new ApiError(500, "Server Health check failed");
    }
});

export {
    healthcheck,
};
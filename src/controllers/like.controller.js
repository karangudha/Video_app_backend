import { Like } from "../models/like.model";
import asyncHandler from "../utils/asyncHandler";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params


})

export {
    toggleVideoLike,
}
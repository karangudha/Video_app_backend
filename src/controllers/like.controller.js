import { Like } from "../models/like.model";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    /*
    get video id
    get user id.
    if this video is already liked by this user 
        yes -> remove it from db
    else    -> add it to db

    return req

    */
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!videoId) {
        throw new ApiError(400, "videoid is required");
    }
    let alreadyLike = await Like.findOne({ userId, videoId });
    if (!alreadyLike) {
        const like = await Like.create({ userId, videoId });
        if (!like) {
            throw new ApiError(500, "Failed to create like");
        }
    } else {
        const unlike = await Like.deleteOne({ userId, videoId });
        if (!unlike) {
            throw new ApiError(500, "Failed to unlike");
        }
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { liked: !alreadyLike }, "Like toggeled successfully ")
        )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const likedBy = req.user._id;

    if (!commentId) {
        throw new ApiError(400, "Comment not found");
    }
    let alreadyLiked = await Like.findOne({ comment: commentId, likedBy });
    if (!alreadyLiked) {
        await Like.create({ comment: commentId, likedBy });
    } else {
        await Like.deleteOne({ comment: commentId, likedBy });
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { comment: !alreadyLiked }, "comment like toggled successfully")
        )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const likedBy = req.user._id;

    if (!tweetId) {
        throw new ApiError(400, "tweet not found");
    }
    let alreadyLiked = await Like.findOne({ tweet: tweetId, likedBy });
    if (!alreadyLiked) {
        await Like.create({ tweet: tweetId, likedBy });
    } else {
        await Like.deleteOne({ tweet: tweetId, likedBy });
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { tweet: !alreadyLiked }, "tweet like toggled successfully")
        )
}
)

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
}
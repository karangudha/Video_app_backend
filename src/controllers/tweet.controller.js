import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../modles/user.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const owner = req.user._id;
    const content = req.body.content;

    if (!content.trim()) {
        throw new ApiError(400, "tweet content is empty")
    }

    const tweet = await Tweet.create({
        owner,
        content,
    })

    const tweetCreated = await Tweet.findById(tweet._id);

    if (!tweetCreated) {
        throw new ApiError(400, "tweet not created")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweetCreated, "tweet created")
        )
    /*
    How to create a new tweet
    1. get user id
    2. get tweet text
    3. validate tweet and authenticat user then take it id.
    4. make new entry in database.
    5. if entry is successful then return success message.
    */
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    /* 
        from frontend we recive ..
        1 user from link 
        2. find all tweets from this user
        3. count all tweets and send count
        4. send object of all tweets 
    */

    try {
        const { userId } = req.params;

        const tweet = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "tweets",
                    localField: "_id",
                    foreignField: "owner",
                    as: "tweets"
                }
            },
            {
                $unwind: {
                    path: "$tweets",
                    preserveNullAndEmptyArrays: true // keep users those not have any tweet
                }
            },
            {
                $group: {
                    _id: "$_id",
                    username: {
                        $first: "$username"
                    },
                    fullName: {
                        $first: "$fullName"
                    },
                    avatar: {
                        $first: "$avatar"
                    },
                    coverImage: {
                        $first: "$coverImage"
                    },
                    countTweets: {
                        $sum: {
                            $cond: [
                                {
                                    $ifNull: ["$tweets", false]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    tweets: {
                        $push: {
                            $cond: [
                                {
                                    $ifNull: ["$tweets", false]
                                },
                                "$tweets",
                                "$$REMOVE"
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    coverImage: 1,
                    countTweets: 1,
                    tweets: 1
                }
            }
        ])
        if (!tweet?.length) {
            throw new ApiError(404, "User not found")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    tweet[0],
                    "User tweet fetched successfully"
                )
            )
    } catch (error) {
        throw new ApiError(404, "User not found")
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const content = req.body.content;
    if (!isValidObjectId(tweetId)) {
        return res.status(400).json({ error: "Invalid user ID format" });
    }
    if (!content.trim()) {
        throw new ApiError(400, "tweet content is empty")
    }
    const tweet = await Comment.findByIdAndUpdate(
        tweetId,
        { content },
        { new: true }
    );
    if (!tweet) {
        throw new ApiError(400, "tweet not updated")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweet,
                "tweet updated successfully"
            )
        )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) {
        return res.status(400).json({ error: "Invalid user ID format" });
    }
    await Tweet.findByIdAndDelete(tweetId);

    if (Tweet.findById(tweetId))
        throw new ApiError(400, "tweet not deleted")
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "tweet deleted successfully"
            )
        )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
}
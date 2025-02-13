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
})

const getLikedVideos = asyncHandler(async (req, res) => {
    /*
    get video id
    write pipline to select all videos with that id in database
    but what is someother thing also got selected ?
    make a array of all videos with there id thoes are liked.
    return array of video ids.
    */

    // const likedVideo = await User.aggregate([
    //     {
    //         $match: {
    //             _id: new mongoose.Types.ObjectId(req.user._id)
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "likes",
    //             localField: "_id",
    //             foreignField: "likedBy",
    //             as: "like",
    //             pipeline: [
    //                 {
    //                     $lookup: {
    //                         from: "videos",
    //                         localField: "video",
    //                         foreignField: "_id",
    //                         as: "videoLiked",
    //                         pipeline: [
    //                             {
    //                                 $lookup: {
    //                                     from: "users",
    //                                     localField: "owner",
    //                                     foreignField: "_id",
    //                                     as: "owner",
    //                                     pipeline: [
    //                                         {
    //                                             $project: {
    //                                                 username: 1,
    //                                                 fullName: 1,
    //                                                 avatar: 1,
    //                                             }
    //                                         }
    //                                     ]
    //                                 }
    //                             },
    //                             {
    //                                 $addFields: {
    //                                     owner: {
    //                                         $first: "$owner"
    //                                     }
    //                                 }
    //                             }
    //                         ]
    //                     }
    //                 },
    //                 {
    //                     $addFields: {
    //                         video: {
    //                             $first: "$videoLiked"
    //                         }
    //                     }
    //                 }
    //             ]
    //         }
    //     },
    //     {
    //         $addFields: {
    //             likeCount: {
    //                 $size : "$like"
    //             }
    //         }
    //     },
    //     {
    //         $project: {
    //             fullName: 1,
    //             username: 1,
    //             avatar: 1,
    //             coverImage: 1,
    //             likeCount: 1,
    //         }
    //     }
    // ])

    //optimized version
    const likedVideo = await User.aggregate([
        {
            //find the user
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            //lookup liked videos by user
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "likedBy",
                as: "likes"
            }
        },
        {
            //unwind likes to process each separately
            $unwind: "$likes"
        },
        {
            //lookup video details
            $lookup: {
                from: "videos",
                localField: "videos.likes",
                foreignField: "_id",
                as: "video",
            }
        },
        {
            //convering array to object
            $unwind: "$video"
        },
        {
            //lookup video owner details
            $lookup: {
                from: "users",
                localField: "video.owner",
                foreignField: "_id",
                as: "videoOwner",
            }
        },
        {
            $unwind: "$videoOwner"
        },
        {
            //step 6: group back all liked videos into an array.
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
                likeCount: {
                    $sum: 1
                },
                likedVideo: {
                    $push: {
                        _id: "$video._id",
                        title: "video.title",
                        owner: {
                            username: "$videoOwner.username",
                            fullName: "$videoOwner.fullName",
                            avatar: "$videoOwner.avatar"
                        }
                    }
                }
            }
        }
    ])
    res
        .status(200)
        .json(
            new ApiResponse(200, likedVideo[0] || {}, "user liked video fethced successfully")
        )
    //sample output: 
    /*
    {
    "_id": "user123",
    "username": "JohnDoe",
    "fullName": "John Doe",
    "avatar": "profile.jpg",
    "coverImage": "cover.jpg",
    "likeCount": 2,
    "likedVideos": [
        {
            "_id": "videoA",
            "title": "Cool Video 1",
            "owner": {
                "username": "JaneDoe",
                "fullName": "Jane Doe",
                "avatar": "avatar1.jpg"
            }
        },
        {
            "_id": "videoB",
            "title": "Cool Video 2",
            "owner": {
                "username": "AlexSmith",
                "fullName": "Alex Smith",
                "avatar": "avatar2.jpg"
            }
        }
    ]
}

    */
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos,
}
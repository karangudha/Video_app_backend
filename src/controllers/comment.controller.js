import mongoose from "mongoose";
import { Comment } from "../modles/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/*
we have to add comment to video whose owner is someone who post that comment
and it have some text.
add comment means : we are on some video and now we will add
text to that video and owner of that text is user who is loggined

what we will store in database : 
    1. text : description from body.
    2. owner : user_id from body.
    3. video : video_id from params

make new entry in database. how ? 

*/

const addComment = asyncHandler(async (req, res) => {
    //we can comment on comment of a video also.
    const { videoId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content.trim()) {
        throw new ApiError(400, "comment content can't be empty")
    }

    const comment = await Comment.create({
        content,
        owner: userId,
        video: videoId,
    })

    if (!comment) {
        throw new ApiError(500, "Failed to create comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, comment, "comment created siuccessfully")
        )
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content.trim()) {
        throw new ApiError(400, "comment content can't be empty");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content,
            }
        },
        { new: true }
    )

    if (!updatedComment) {
        throw new ApiError(500, "Failed to update comment");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "comment updated successfully")
        )
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
        throw new ApiError(500, "failed to delete comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "comment deleted successfully")
        )
});

const getVideoComments = asyncHandler(async (req, res) => {
    /*
        get video id from params
        we have to 
        select all comment 
        from comment collection 
        where video id = video_id 
        make object of them 
        return owner of that comment also,
            in this owner username is displayed
             -> for this find in owner collection
             local field : owner
             foreign field : _id
             as : owner
                take only username from here.
            return it in object of comment
            
        make a list of them.

    */
    const { videoId } = req.params;
    const owner = req.user._id;

    if (!videoId)
        throw new ApiError(400, "video id is required");

    try {
        const comments = await Comment.aggregate([
            {
                $match: {
                    video: videoId,
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1,
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$owner",
            },
            {
                $project: {
                    content: 1,
                    createdAt: 1,
                    owner: {
                        username: "$owner.username",
                        avatar: "$owner.avatar",
                    }
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        if (!comments.length) {
            return res
                .status(200)
                .json(
                    new ApiResponse(200, [], "No comments found for this video")
                )
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, comments, "comments of video fetched successfully")
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "failed to fetch comments of video")
    }
});


export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
};
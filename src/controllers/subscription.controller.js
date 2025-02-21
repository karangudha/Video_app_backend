import mongoose, { isValidObjectId } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../modles/user.model.js";
import { Subscription } from "../models/subscription.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    /*
    If the user is subscribed → Unsubscribe them
    If the user is NOT subscribed → Subscribe them

    current user is logined,
    he check that he is following a particular channel,
    ? yes - > subscribed 
    no -> subscribe (not subscribed)
    how to check ? 
        current user = channel ? 
        subscriber are channels who subscribed current user

        what i want  ? 
        is the channel which i got from req is subscribed by current(logined) user ? 
          channel = channel i got from req
          subscriber = current User  
        
        return true ? 
            remove it from collection
        return false ? 
            add it to collection.
    */

    const { channel } = req.params;
    const currentUser = req.user._id;
    if (!isValidObjectId(channel)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const isSubscribed = await Subscription.findById({
        channel: channel,
        subscriber: currentUser,
    })
    if (isSubscribed) {
        const unsubscribe = await Subscription.deleteOne(isSubscribed);
        if (!unsubscribe) {
            throw new ApiError(400, "Failed to unsubscribe");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "Unsubscribed successfully")
            )
    }
    const subscribe = await Subscription.create({
        channel: "channel",
        subscriber: "currentUser",
    })

    if (!subscribe) {
        throw new ApiError(400, "Failed to subscribe");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Subscribed successfully")
        )
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    /* 
        we have to return subscriber list of a channel.
        what we have channelId 
        and subscription collection
         which contain 
            subscriber of channel,
            channel
        filer out all collection where 
            channel = channelId
                till here we have all subscriber of this channel and we have subscriberId i.m userID of all user that subscriberd channel
            now go to user collection
            i.e from users
                localField : subscriber
                forgeinField : _id 
                as : subscribers
                pipeline : [
                    take only 
                        username,
                        avatar,
                        fullName,
            destructure it 
                $unwind : subscribers
            now : project them,

            how to create 
    */
    const { subscriberId } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalSubscribersCount = await Subscription.countDocuments({
        channel: subscriberId,
    });

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: subscriberId,
            }
        },
        {
            $skip: skip,
        },
        {
            $limit: limit,
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            fullName: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscriber",
        },
        {
            $project: {
                subscriberId: "$subscriber._id",
                username: "$subscriber.username",
                avatar: "$subscriber.avatar",
                fullName: "$subscriber.fullName",
            }
        }
    ])

    if (!subscribers.length && totalSubscribersCount > 0) {
        throw new ApiError(404, "This page has no subscribers");
    }
    if (!subscribers.length) {
        throw new ApiError(404, "No subscribers found for this channel")
    }

    const totalPages = Math.ceil(totalSubscribersCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res
        .status(200)
        .json(
            new ApiResponse
                (
                    200,
                    {
                        subscribers,
                        pagination: {
                            page,
                            limit,
                            totalItems: totalSubscribersCount,
                            hasNextPage,
                            hasPrevPage,
                        }
                    },
                    "Subscribed channel subscribers fetched successfully"
                )
        )
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    /* 
    return all channels that are subscribed by subscriberID.
    select all documents in which subscriber = subscriberId.
        In these documents channel field is varing(not same/constant)
        now for each document 
        go to user collection
        i.e from users
        localField : channel
        foreignField : _id
        as : subscribedChannels
            only project
                channelId, 
                avatar, 
                fullName,
                username
        destructure it
        then project all these things 
        and do piganation also

    */

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalChannelSubscribedCount = await Subscription.countDocuments({
        subscriber: subscriberId,
    })

    const channelSubscribed = await Subscription.aggregate([
        {
            $match: {
                subscriber: subscriberId,
            }
        },
        {
            $skip: skip
        },
        {
            $limit: limit,
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannels",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            fullName: 1,
                            username: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscribedChannels",
        },
        {
            $project: {
                channelId: "$subscribedChannels._id",
                avatar: "$subscribedChannels.avatar",
                fullName: "$subscribedChannels.fullName",
                username: "$subscribedChannels.username",
            }
        }
    ])

    if (!channelSubscribed.length && totalChannelSubscribedCount > 0)
        throw new ApiError(404, "This page has no subscribed channels");
    if (!channelSubscribed.length)
        throw new ApiError(404, "No subscribed channels found for this user")

    const totalPages = Math.ceil(totalChannelSubscribedCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res
        .status(200)
        .json(
            new ApiResponse
                (
                    200,
                    {
                        subscribedChannels: channelSubscribed,
                        pagination: {
                            page,
                            limit,
                            totalItems: totalChannelSubscribedCount,
                            hasNextPage,
                            hasPrevPage,
                        }
                    },
                    "Subscribed channels fetched successfully"
                )
        )
});

const getChannelDetails = asyncHandler(async (req, res) => {
    //get channnel details when clicked on channel/subscribered channel/ subscriber channel
    /* 
        ill get channelId from somewhere
        means i have to fetch channel details from user collection
        and remove some fields like password, createdAt, updatedAt, etc.
        and project
        and return it to frontend

    */

    const { channelId } = req.params;
    const user = await User.findById(channelId).select("-password -createdAt -updatedAt");
    if (!user)
        throw new ApiError(404, "Channel not found");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Channel details fetched successfully")
        )
});

export {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
    getChannelDetails
}
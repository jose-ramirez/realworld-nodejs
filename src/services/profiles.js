import { User, Following } from '../db';
import { HttpError } from './errors';

export const getProfile = async (username) => {
    if (username == null) {
        throw new HttpError(400, 'Bad request');
    }
    const user = await User.findOne({ username });
    if (user == null) {
        throw new HttpError(404, 'User not found');
    }
    const { bio, image } = user;
    return {
        profile: {
            username,
            bio,
            image,
            following: false,
        },
    };
};

export const followProfile = async (username, user) => {
    if (user == null) {
        throw new HttpError(400, 'Bad Request');
    }
    const { email } = user;
    const followed = await User.findOne({ username });
    const follower = await User.findOne({ email });
    if (follower == null || followed == null) {
        throw new HttpError(404, 'User not found');
    }
    const following = {
        followedUserId: followed._id,
        followerUserId: follower._id,
    };
    if ((await Following.findOne(following)) == null) {
        await (new Following(following)).save();
    }
    return {
        profile: {
            bio: followed.bio,
            image: followed.image,
            username,
            following: true,
        },
    };
};

export const unfollowProfile = async (username, user) => {
    if (user == null) {
        throw new HttpError(400, 'Bad Request');
    }
    const { email } = user;
    const followed = await User.findOne({ username });
    const follower = await User.findOne({ email });
    if (follower == null || followed == null) {
        throw new HttpError(404, 'User not found');
    }
    await Following.deleteOne({
        followedUserId: followed._id,
        followerUserId: follower._id
    });
    return {
        profile: {
            bio: followed.bio,
            image: followed.image,
            username,
            following: false,
        },
    };
};

export const getFollowedUsers = async (email) => {
    const user = await User.findOne({ email });
    if (user == null){
        throw new HttpError(404, 'User not found');
    }
    const followedUserIds = (await Following.find({ followerUserId: user._id }))
        .map(f => f.followedUserId);
    const users = await User.find({_id: { $in: followedUserIds }});
    return users.map(u => u.username);
};

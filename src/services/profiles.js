import { Following } from '../db';
import { HttpError } from '../errors';
import { getUserByEmail, getUserByUsername } from './users';

export const getProfile = async (username) => {
    if (username == null) {
        throw new HttpError(400, 'Bad request');
    }
    const { user } = await getUserByUsername(username);

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

export const followProfile = async (username, userData) => {
    if (userData == null) {
        throw new HttpError(400, 'Bad Request');
    }
    const followed = await getUserByUsername(username);
    const follower = await getUserByEmail(userData);
    const following = {
        followedUserId: followed.user._id,
        followerUserId: follower.user._id,
    };
    if ((await Following.findOne(following)) == null) {
        await (new Following(following)).save();
    }
    return {
        profile: {
            bio: followed.user.bio,
            image: followed.user.image,
            username,
            following: true,
        },
    };
};

export const unfollowProfile = async (username, userData) => {
    if (userData == null) {
        throw new HttpError(400, 'Bad Request');
    }

    const followed = await getUserByUsername(username);
    const follower = await getUserByEmail(userData);

    await Following.deleteOne({
        followedUserId: followed.user._id,
        followerUserId: follower.user._id
    });
    return {
        profile: {
            bio: followed.user.bio,
            image: followed.user.image,
            username,
            following: false,
        },
    };
};

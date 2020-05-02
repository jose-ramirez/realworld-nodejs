import { User, Following } from '../db';
import { generateToken } from './token';
import { HttpError } from '../errors';
import bcrypt from 'bcrypt';

export const getUserWithPassword = async (userCredentials) => {
    if (userCredentials == null) {
        throw new HttpError(400, 'Bad request');
    }
    let { email, password } = userCredentials;
    if (!email || !password) {
        throw new HttpError(400, 'Bad request: Data missing');
    }
    let user = await User.findOne({ email });
    if (user == null) {
        throw new HttpError(404, 'User not found');
    }
    const pwdMatches = await bcrypt.compare(password, user.password);
    if (pwdMatches) {
        if (user.token == null) {
            user.token = generateToken(userCredentials);
        }
        return { user };
    }
};

export const getUserByUsername = async (username) => {
    if (username == null) {
        throw new HttpError(400, 'Bad request');
    }
    let user = await User.findOne({ username });
    if (user == null) {
        throw new HttpError(404, 'User not found');
    }
    return { user };
};

export const getUserByEmail = async (userCredentials) => {
    if (userCredentials == null) {
        throw new HttpError(400, 'Bad request');
    }
    let { email } = userCredentials;
    let user = await User.findOne({ email });
    if (user == null) {
        throw new HttpError(404, 'User not found');
    }
    if (user.token == null) {
        user.token = generateToken(userCredentials);
    }
    return { user };
};

export const saveUser = async (userData) => {
    if (userData == null) {
        throw new HttpError(400, 'Bad request');
    }
    let { email, password, username, bio, image } = userData;
    if (typeof bio === 'undefined') {
        userData.bio = null;
    }
    if (typeof image === 'undefined') {
        userData.image = null;
    }
    if (!email || !password || !username) {
        throw new HttpError(400, 'Bad request: Data missing');
    }
    userData.token = generateToken({ email: userData.email });
    const hash = await bcrypt.hash(userData.password, 10);
    userData.password = hash;
    const user = new User(userData);
    const savedUser = await user.save();
    return { user: savedUser };
};

export const updateUser = async (userNewData, userCurrentData) => {
    if (userNewData == null) {
        throw new HttpError(400, 'Bad request');
    }
    if (userCurrentData == null) {
        throw new HttpError(401, 'Unauthorized');
    }
    let { email } = userCurrentData;
    let currentUser = await User.findOne({ email });
    if (currentUser == null) {
        throw new HttpError(404, 'User not found');
    }
    currentUser.bio = userNewData.bio == null
        ? currentUser.bio
        : userNewData.bio;
    currentUser.image = userNewData.image == null
        ? currentUser.image
        : userNewData.image;
    currentUser.email = userNewData.email == null
        ? currentUser.email
        : userNewData.email;
    currentUser.username = userNewData.username == null
        ? currentUser.username
        : userNewData.username;
    currentUser.token = generateToken({ email: currentUser.email });
    await User.updateOne({ email }, currentUser);
    return { user: currentUser };
};

export const getFollowedUsers = async (email) => {
    const { user } = await getUserByEmail({ email });
    const followedUserIds = (await Following.find({ followerUserId: user._id }))
        .map(f => f.followedUserId);
    const users = await User.find({_id: { $in: followedUserIds }});
    return users.map(u => u.username);
};

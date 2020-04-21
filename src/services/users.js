import { User } from '../db';
import { generateToken } from './token';
import bcrypt from 'bcrypt';
import { HttpError } from './errors';

const getUserWithPassword = async (userCredentials) => {
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

const getUserWithToken = async (userCredentials) => {
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

const saveUser = async (userData) => {
    if (userData == null) {
        throw new HttpError(400, 'Bad request');
    }
    let { email, password, username } = userData;
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

const updateUser = async (userNewData, userCurrentData) => {
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

export { getUserWithToken, getUserWithPassword, saveUser, updateUser };

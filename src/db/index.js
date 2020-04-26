import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoConnectionConfig = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};

mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.DB_URL, mongoConnectionConfig);

export const User = mongoose.model('user', {
    username: String,
    token: String,
    email: String,
    password: String,
    bio: String,
    image: String
});

export const Tag = mongoose.model('tag', new mongoose.Schema({
    name: String,
}, { timestamps: true }));

export const Profile = mongoose.model('profile', new mongoose.Schema({
    name: String,
    bio: String,
    image: String
}, { timestamps: true }));

export const Following = mongoose.model('following', new mongoose.Schema({
    followedUserId: ObjectId,
    followerUserId: ObjectId
}, { timestamps: true }));

export const Comment = mongoose.model('comment', new mongoose.Schema({
    articleId: ObjectId,
    body: String,
    author: Object
}, { timestamps: true }));

export const Favorite = mongoose.model('favorite', new mongoose.Schema({
    userId: ObjectId,
    articleId: ObjectId
}, { timestamps: true }));

export const Article = mongoose.model('article', new mongoose.Schema({
    slug: String,
    title: String,
    description: String,
    body: String,
    tagList: [String],
    favorited: Boolean,
    favoritesCount: Number,
    author: Object
}, { timestamps: true }));

import { Article, Favorite } from '../db';
import { getUserByEmail } from './users';
import { createSlug } from '../utils';
import { HttpError } from '../errors';
import { getFollowedUsers } from './profiles';

export const getFeed = async (user, query) => {
    if (user == null) {
        throw new HttpError(401, 'Unauthorized');
    }
    const { limit, skip } = query;
    const followedUserUsernames = await getFollowedUsers(user.email);
    const articles = await Article.find(
        {'author.username': {$in: followedUserUsernames}})
        .sort({ createdAt: -1 })
        .limit(limit || 20)
        .skip(skip || 0);
    return {
        articles,
        articlesCount: articles.length
    };
};

export const getArticles = async (filter) => {
    let { author, tag, skip, limit } = filter;
    let constraints = {};
    if (author) { constraints['author.username'] = author; }
    if (tag) { constraints.tagList = tag; }

    const articles = await Article.find()
        .sort({createdAt: -1})
        .limit(limit || 20)
        .skip(skip || 0);

    return { articles, articlesCount: articles.length };
};

export const getArticle = async (slug) => {
    const article = await Article.findOne({ slug });
    if (article == null) {
        throw new HttpError(404, 'Article not found');
    }
    return { article };
};

export const createArticle = async (articleData, userData) => {
    if (userData == null) {
        throw new HttpError(401, 'Unauthorized');
    }

    let user = await getUserByEmail(userData);
    let { username, bio, image } = user;

    let { article } = articleData;
    article.author = {
        username, bio, image, following: false,
    };
    article.slug = createSlug(article.title);
    article.favorited = false;
    article.favoritesCount = 0;

    return { article: await (new Article(article)).save() };
};

export const updateArticle = async (articleNewData, userData, articleSlug) => {
    if (userData == null) {
        throw new HttpError(401, 'Unauthorized');
    }

    const { title, description, body, tagList, favoritesCount, slug, favorited }
        = articleNewData.article;

    const { article } = await getArticle(articleSlug);

    const { user } = await getUserByEmail(userData);

    if (user.username !== article.author.username) {
        throw new HttpError(403, 'Operation forbidden for this user');
    }

    let updatedArticle = {
        author: article.author,
        slug: typeof slug !== 'undefined'
            ? slug : article.slug,
        title: typeof title !== 'undefined'
            ? title : article.title,
        description: typeof description !== 'undefined'
            ? description : article.description,
        body: typeof body !== 'undefined'
            ? body : article.body,
        tagList: typeof tagList !== 'undefined'
            ? tagList : article.tagList,
        favorited: typeof favorited !== 'undefined'
            ? favorited : article.favorited,
        favoritesCount: typeof favoritesCount !== 'undefined'
            ? favoritesCount : article.favoritesCount
    };

    if (updatedArticle.title !== article.title) {
        updatedArticle.slug = createSlug(title);
    }
    return {
        article: await Article.findOneAndUpdate(
            { _id: article._id }, updatedArticle, { new: true })
    };
};

export const deleteArticle = async (userData, slug) => {
    if (userData == null) {
        throw new HttpError(401, 'Unauthorized');
    }

    let { user } = await getUserByEmail(userData);

    const { article } = await getArticle(slug);

    if (user.username !== article.author.username) {
        throw new HttpError(403, 'Operation forbidden for this user');
    }

    await Article.deleteOne({ slug });
};

export const likeArticle = async (slug, userData) => {
    if (userData == null) {
        throw new HttpError(401, 'Unauthorized');
    }

    let { user } = await getUserByEmail(userData);

    const { article } = await getArticle(slug);

    const favorited = await Favorite.findOne({
        userId: user._id,
        articleId: article._id
    });

    if (favorited == null) {
        await (new Favorite({
            userId: user._id,
            articleId: article._id
        })).save();
        article.favoritesCount += 1;
        article.favorited = article.favoritesCount > 0;
        await Article.updateOne({_id: article._id}, article);
    }
    return { article };
};

export const unlikeArticle = async (slug, userData) => {
    if (userData == null) {
        throw new HttpError(401, 'Unauthorized');
    }

    let { user } = await getUserByEmail(userData);

    const { article } = await getArticle(slug);

    const result = await Favorite.deleteOne({
        userId: user._id,
        articleId: article._id
    });

    if (result.deletedCount === 1) {
        if (article.favoritesCount > 0) {
            article.favoritesCount -= 1;
            if (article.favoritesCount === 0) {
                article.favorited = false;
            }
        }
        await Article.updateOne({_id: article._id}, article);
    }
    return { article };
};

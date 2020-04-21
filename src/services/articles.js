import { Article, User, Comment, Favorite } from '../db';
import { createSlug } from '../utils';
import { HttpError } from './errors';
import { getFollowedUsers } from './profiles';

export const getFeed = async (user, query) => {
    if (user == null) {
        throw new HttpError(401, 'Unauthorized');
    }
    const followedUserUsernames = await getFollowedUsers(user.email);
    return {
        articles: await Article.find(
            {'author.username': {$in: followedUserUsernames}})
            .sort({ createdAt: -1 })
    };
};

export const getArticles = async (filter) => {
    let { author, tag } = filter;
    let constraints = {};
    if (author) { constraints['author.username'] = author; }
    if (tag) { constraints.tagList = tag; }
    const articles = await Article.find().sort({createdAt: -1});

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
    let { email } = userData;
    let { article } = articleData;
    let user = await User.findOne({ email });
    if (user == null) {
        throw new HttpError(404, 'User not found');
    }
    let { username, bio, image } = user;

    article.author = {
        username, bio, image, following: false,
    };

    article.slug = createSlug(article.title);

    article.favorited = false;
    article.favoritesCount = 0;

    let savedArticle = new Article(article);

    return { article: await savedArticle.save() };
};

export const updateArticle = async (articleNewData, userData, slug) => {
    if (userData == null) {
        throw new HttpError(401, 'Unauthorized');
    }

    let { article } = articleNewData;
    let { title, description, body, tagList, favoritesCount } = article;
    let currentArticle = await Article.findOne({ slug });
    if (currentArticle == null) {
        throw new HttpError(404, 'Article not found');
    }

    let currentUser = await User.findOne({ email: userData.email });
    if (currentUser == null) {
        throw new HttpError(404, 'User not found');
    }
    if (userData.email !== currentArticle.author.email) {
        throw new HttpError(403, 'Operation forbidden for this user');
    }

    let updatedArticle = {
        author: currentArticle.author,
        title: typeof title !== 'undefined'
            ? title : currentArticle.title,
        description: typeof description !== 'undefined'
            ? description : currentArticle.description,
        body: typeof body !== 'undefined'
            ? body : currentArticle.body,
        tagList: typeof tagList !== 'undefined'
            ? tagList : currentArticle.tagList,
        favoritesCount: typeof favoritesCount !== 'undefined'
            ? favoritesCount : currentArticle.favoritesCount
    };

    if (updatedArticle.title !== currentArticle.title) {
        updatedArticle.slug = createSlug(title);
    }
    return { article: await (new Article(updatedArticle)).save() };
};

export const deleteArticle = async (user, slug) => {
    if (user == null) {
        throw new HttpError(401, 'Unauthorized');
    }
    const { email } = user;
    const article = await Article.findOne({ slug });
    if (article == null) {
        throw new HttpError(404, 'Article not found');
    }
    if (email !== article.author.email) {
        throw new HttpError(403, 'Operation forbidden for this user');
    }
    const someUser = await User.findOne({ email });
    if (someUser == null) {
        throw new HttpError(404, 'User not found');
    }

    await Article.deleteOne({ slug });
};

export const getComments = async (slug) => {
    const article = await Article.findOne({ slug });
    if (article == null) {
        throw new HttpError(404, 'Article not found');
    }
    const result = await Article.aggregate([{ $match: { slug } }, {
        $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'articleId',
            as: 'comments'
        }
    }]);
    const { comments } = result[0];
    return { comments };
};

export const createComment = async (slug, data, user) => {
    if (user == null) {
        throw new HttpError(401, 'Unauthorized');
    }
    const { email } = user;
    const commentAuthor = await User.findOne({ email });
    if (commentAuthor == null) {
        throw new HttpError(404, 'User not found');
    }
    const article = await Article.findOne({ slug });
    if (article == null) {
        throw new HttpError(404, 'Article not found');
    }
    if (data == null || data.comment.body == null) {
        throw new HttpError(400, 'Bad request');
    }
    const { bio, image, username } = commentAuthor;
    let { comment } = data;
    const { _id } = article;
    comment.author = { bio, image, username };
    comment.articleId = _id;
    return {
        comment: await (new Comment(comment)).save()
    };

};

export const deleteComment = async (slug, _id, user) => {
    if (user == null) {
        throw new HttpError(401, 'Unauthorized');
    }
    const { email } = user;
    const commentDeleter = await User.findOne({ email });
    if (commentDeleter == null) {
        throw new HttpError(404, 'User not found');
    }
    const article = await Article.findOne({ slug });
    if (article == null) {
        throw new HttpError(404, 'Article not found');
    }
    const comment = await Comment.findOne({ _id });
    if (comment == null) {
        throw new HttpError(404, 'Comment not found');
    }
    if (commentDeleter.username !== comment.author.username) {
        throw new HttpError(403, 'Operation forbidden for this user');
    }
    return await Comment.deleteOne({ _id });
};

export const likeArticle = async (slug, user) => {
    if (user == null) {
        throw new HttpError(401, 'Unauthorized');
    }

    let { email } = user;
    const currentUser = await User.findOne({ email });
    if (currentUser == null) {
        throw new HttpError(404, 'User not found');
    }

    const article = await Article.findOne({ slug });
    if (article == null) {
        throw new HttpError(404, 'Article not found');
    }

    const favorited = await Favorite.findOne({
        userId: currentUser._id,
        articleId: article._id
    });

    if (favorited == null) {
        await (new Favorite({
            userId: currentUser._id,
            articleId: article._id
        })).save();
        article.favoritesCount += 1;
        article.favorited = article.favoritesCount > 0;
        await Article.updateOne({_id: article._id}, article);
    }
    return { article };
};

export const unlikeArticle = async (slug, user) => {
    if (user == null) {
        throw new HttpError(401, 'Unauthorized');
    }

    let { email } = user;
    const currentUser = await User.findOne({ email });
    if (currentUser == null) {
        throw new HttpError(404, 'User not found');
    }

    const article = await Article.findOne({ slug });
    if (article == null) {
        throw new HttpError(404, 'Article not found');
    }

    const result = await Favorite.deleteOne({
        userId: currentUser._id,
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

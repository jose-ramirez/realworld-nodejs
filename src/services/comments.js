import { Comment } from '../db';
import { getUserByEmail } from './users';
import { getArticle } from './articles';
import { HttpError } from '../errors';

export const getComments = async (slug) => {
    const {article} = await getArticle(slug);

    const result = await Comment
        .find({ articleId: article._id })
        .sort({ createdAt: -1 });
    return { comments: result };
};

export const createComment = async (slug, data, userData) => {
    if (userData == null) {
        throw new HttpError(401, 'Unauthorized');
    }

    if (data == null || data.comment.body == null) {
        throw new HttpError(400, 'Bad request');
    }

    const { user } = await getUserByEmail(userData);

    const { article } = await getArticle(slug);

    const { bio, image, username } = user;
    let { comment } = data;
    const { _id } = article;
    comment.author = { bio, image, username };
    comment.articleId = _id;
    return {
        comment: await (new Comment(comment)).save()
    };

};

export const deleteComment = async (slug, commentId, userData) => {
    if (userData == null) {
        throw new HttpError(401, 'Unauthorized');
    }

    await getArticle(slug);

    const { user } = await getUserByEmail(userData);

    const comment = await Comment.findOne({ _id: commentId });
    if (comment == null) {
        throw new HttpError(404, 'Comment not found');
    }
    if (user.username !== comment.author.username) {
        throw new HttpError(403, 'Operation forbidden for this user');
    }
    return await Comment.deleteOne({ _id: commentId });
};

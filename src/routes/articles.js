import express from 'express';
import { middleware } from './middleware/jwt';
import {
    getArticles,
    getArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    likeArticle,
    unlikeArticle,
    getFeed
} from '../services/articles';

import {
    createComment,
    deleteComment,
    getComments
} from '../services/comments';

let router = express.Router();

router.get('/', async (req, res) => {
    res.status(200).send(await getArticles(req.query));
});

router.post('/', middleware, async (req, res, next) => {
    try {
        res.status(200).send(await createArticle(req.body, req.user));
    } catch (error) {
        next(error);
    }
});

router.get('/feed', middleware, async (req, res, next) => {
    try {
        res.status(200).send(await getFeed(req.user, req.query));
    } catch (error) {
        next(error);
    }
});

router.get('/:slug', async (req, res, next) => {
    try {
        let { slug } = req.params;
        const possibleArticle = await getArticle(slug);
        res.status(200).send(possibleArticle);
    } catch (error) {
        next(error);
    }
});

router.put('/:slug', middleware, async (req, res, next) => {
    try {
        let { slug } = req.params;
        const result = await updateArticle(req.body, req.user, slug);
        res.status(200).send(result);
    } catch (error) {
        next(error);
    }
});

router.delete('/:slug', middleware, async (req, res, next) => {
    try {
        let { slug } = req.params;
        let { user } = req;
        res.status(200).send(await deleteArticle(user, slug));
    } catch (error) {
        next(error);
    }
});

router.get('/:slug/comments', async (req, res, next) => {
    try {
        const { slug } = req.params;
        res.status(200).send(await getComments(slug));
    } catch (error) {
        next(error);
    }
});

router.post('/:slug/comments', middleware, async (req, res, next) => {
    try {
        const { slug } = req.params;
        res.status(200).send(await createComment(slug, req.body, req.user));
    } catch (error) {
        next(error);
    }
});

router.delete('/:slug/comments/:id', middleware, async (req, res, next) => {
    try {
        const { slug, id } = req.params;
        res.status(200).send(await deleteComment(slug, id, req.user));
    } catch (error) {
        next(error);
    }
});

router.post('/:slug/favorite', middleware, async (req, res, next) => {
    try {
        const { slug } = req.params;
        res.status(200).send(await likeArticle(slug, req.user));
    } catch (error) {
        next(error);
    }
});

router.delete('/:slug/favorite', middleware, async (req, res, next) => {
    try {
        const { slug } = req.params;
        res.status(200).send(await unlikeArticle(slug, req.user));
    } catch (error) {
        next(error);
    }
});

export default router;

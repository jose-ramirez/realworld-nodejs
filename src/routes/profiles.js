import express from 'express';
import { getProfile, followProfile, unfollowProfile }
    from '../services/profiles';
import { middleware } from './middleware/jwt';

let router = express.Router();

router.get('/:username', async (req, res, next) => {
    try {
        const { username } = req.params;
        const profileResponse = await getProfile(username);
        res.status(200).send(profileResponse);
    } catch (error) {
        next(error);
    }
});

router.post('/:username/follow', middleware, async (req, res, next) => {
    try {
        const { user } = req;
        const { username } = req.params;
        const profileResponse = await followProfile(username, user);
        res.status(200).send(profileResponse);
    } catch (err) {
        next(err);
    }
});

router.delete('/:username/follow', middleware, async (req, res, next) => {
    try {
        const { user } = req;
        const { username } = req.params;
        const profileResponse = await unfollowProfile(username, user);
        res.status(200).send(profileResponse);
    } catch (error) {
        next(error);
    }
});

export default router;

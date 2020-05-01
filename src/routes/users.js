import express from 'express';
import {
    saveUser,
    updateUser,
    getUserWithPassword,
    getUserByEmail
} from '../services/users';
import { middleware } from './middleware/jwt';

let router = express.Router();

router.post('/users', async function (req, res, next) {
    try {
        res.status(200).send(await saveUser(req.body.user));
    } catch (error) {
        next(error);
    }
});

router.post('/users/login', async function (req, res, next) {
    try {
        res.status(200).send(await getUserWithPassword(req.body.user));
    } catch (error) {
        next(error);
    }
});

router.get('/user', middleware, async (req, res, next) => {
    try {
        const user = await getUserByEmail(req.user);
        res.status(200).send(user);
    } catch (error) {
        next(error);
    }
});

router.put('/user', middleware, async (req, res, next) => {
    try {
        const updatedUser = await updateUser(req.body.user, req.user);
        res.status(200).send(updatedUser);
    } catch (error) {
        next(error);
    }
});

export default router;

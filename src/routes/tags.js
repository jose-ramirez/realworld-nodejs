import express from 'express';
import { getAllTags } from '../services/tags';

var router = express.Router();

router.get('/', async (req, res) => {
    res.status(200).send(await getAllTags());
});

export default router;

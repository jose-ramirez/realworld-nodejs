import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import usersRouter from './routes/users';
import profilesRouter from './routes/profiles';
import articlesRouter from './routes/articles';
import tagsRouter from './routes/tags';

var app = express();

if (process.env.NODE_ENV !== 'test') {
    app.use(logger('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', usersRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/tags', tagsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    const { code, message } = err;
    res.status(code || 500).json({ message });
});

export default app;

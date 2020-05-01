import { use, should as _should, expect, request } from 'chai';
import chaiHttp from 'chai-http';
import {
    createFakeArticle,
    createFakeUser,
    getProfileFromUser,
    createFakeComment } from './utils';
import { it, describe, before, after } from 'mocha';
import { User, Article, Comment } from '../src/db';

use(chaiHttp);

import app from '../src/app';

const should = _should();

const BASE_PATH = '/api/articles';

const userData = createFakeUser();

const randomArticle = createFakeArticle();
const otherRandomArticle = createFakeArticle();

describe('GET /api/articles/:slug/comments', async () => {
    before(async () => {
        const articleCreator = createFakeUser();
        const authorProfile = getProfileFromUser(articleCreator);
        authorProfile.following = false;
        randomArticle.author = authorProfile;

        otherRandomArticle.author = authorProfile;

        const comment = createFakeComment();
        const someOtherUser = createFakeUser();
        const someOtherUserProfile = getProfileFromUser(someOtherUser);
        someOtherUserProfile.following = false;
        comment.author = someOtherUserProfile;

        const comment2 = createFakeComment();
        const someOtherUser2 = createFakeUser();
        const someOtherUser2Profile = getProfileFromUser(someOtherUser2);
        someOtherUser2Profile.following = false;
        comment2.author = someOtherUser2Profile;

        await (new Article(otherRandomArticle)).save();

        const savedArticle = await (new Article(randomArticle)).save();
        comment.articleId = savedArticle._id;
        await (new Comment(comment)).save();
        comment2.articleId = savedArticle._id;
        await (new Comment(comment2)).save();

    });

    after(async () => {
        await Article.deleteMany({});
        await Comment.deleteMany({});
    });

    it('should get all comments', done => {
        request(app)
            .get(`${BASE_PATH}/${randomArticle.slug}/comments`)
            .end((err, res) => {
                should.not.exist(err);

                res.should.have.status(200);
                expect(res.body).to.have.a.property('comments');
                expect(res.body.comments).to.be.an('array');
                expect(res.body.comments.length).to.equal(2);
                done();
            });
    });

    it('should throw 404 if article does not exist', done => {
        request(app)
            .get(`${BASE_PATH}/some_random_slug/comments`)
            .end(async (err, res) => {
                should.not.exist(err);

                res.should.have.status(404);

                done();
            });
    });
});

describe('POST /api/articles/:slug/comments', async () => {
    before(async () => {
        const articleCreator = createFakeUser();
        const authorProfile = getProfileFromUser(articleCreator);
        authorProfile.following = false;
        randomArticle.author = authorProfile;

        await (new User(articleCreator)).save();
        await (new User(userData)).save();
        await (new Article(randomArticle)).save();
    });

    after(async () => {
        await Article.deleteMany({});
        await Comment.deleteMany({});
        await User.deleteMany({});
    });

    it('should create comment', done => {
        request(app)
            .post(`${BASE_PATH}/${randomArticle.slug}/comments`)
            .set('Authorization', `Token ${userData.token}`)
            .send({
                comment: {
                    body: 'I agree.'
                }
            })
            .end((err, res) => {
                should.not.exist(err);

                res.should.have.status(200);
                expect(res.body).to.have.a.property('comment');
                expect(res.body.comment).to.be.an('object');
                done();
            });
    });

    it('should throw 404 if user does not exist', async () => {
        await User.deleteMany({});
        request(app)
            .post(`${BASE_PATH}/${randomArticle.slug}/comments`)
            .set('Authorization', `Token ${userData.token}`)
            .send({
                comment: {
                    body: 'I agree.'
                }
            })
            .end(async (err, res) => {
                should.not.exist(err);

                res.should.have.status(404);
            });
    });

    it('should throw 404 if article does not exist', async () => {
        request(app)
            .post(`${BASE_PATH}/some_random_slug/comments`)
            .set('Authorization', `Token ${userData.token}`)
            .send({
                comment: {
                    body: 'I agree.'
                }
            })
            .end(async (err, res) => {
                should.not.exist(err);

                res.should.have.status(404);
            });
    });

    it('should throw 401 if token is missing', async () => {
        request(app)
            .post(`${BASE_PATH}/${randomArticle.slug}/comments`)
            .end(async (err, res) => {
                should.not.exist(err);

                res.should.have.status(401);
            });
    });
});

describe('DELETE /api/articles/:slug/comments/:id', async () => {
    before(async () => {
        const articleCreator = createFakeUser();
        const authorProfile = getProfileFromUser(articleCreator);
        authorProfile.following = false;
        randomArticle.author = authorProfile;

        const comment = createFakeComment();
        const someOtherUserProfile = getProfileFromUser(userData);
        someOtherUserProfile.following = false;
        comment.author = someOtherUserProfile;

        await (new User(articleCreator)).save();
        await (new User(userData)).save();
        await (new Article(randomArticle)).save();
        await (new Comment(comment)).save();
    });

    after(async () => {
        await User.deleteMany({});
        await Comment.deleteMany({});
        await Article.deleteMany({});
    });

    it('should remove comment', done => {
        Comment.findOne({})
            .then(c => {
                let { slug } = randomArticle;
                request(app)
                    .delete(`${BASE_PATH}/${slug}/comments/${c._id}`)
                    .set('Authorization', `Token ${userData.token}`)
                    .end(async (err, res) => {
                        should.not.exist(err);
                        res.should.have.status(200);

                        const comment = await Comment.findOne({});
                        should.not.exist(comment);
                        done();
                    });
            });
    });

    it('should throw 404 if user does not exist', async () => {
        await User.deleteMany({});
        request(app)
            .delete(`${BASE_PATH}/${randomArticle.slug}/comments/random_id`)
            .set('Authorization', `Token ${userData.token}`)
            .end(async (err, res) => {
                should.not.exist(err);

                res.should.have.status(404);
            });
    });

    it('should throw 401 if token is missing', async () => {
        await User.deleteMany({});
        request(app)
            .delete(`${BASE_PATH}/${randomArticle.slug}/comments/random_id`)
            .end(async (err, res) => {
                should.not.exist(err);

                res.should.have.status(401);
            });
    });

    it('should throw 404 if article does not exist', async () => {
        await User.deleteMany({});
        request(app)
            .delete(`${BASE_PATH}/some_random_slug/comments/random_id`)
            .set('Authorization', `Token ${userData.token}`)
            .end(async (err, res) => {
                should.not.exist(err);

                res.should.have.status(404);
            });
    });
});

import { use, should as _should, expect, request } from 'chai';
import chaiHttp from 'chai-http';
import {
    createFakeArticle,
    createFakeUser,
    getProfileFromUser,
    createFakeComment } from './utils';
import { it, describe, before, after, beforeEach, afterEach } from 'mocha';
import { User, Article, Comment, Favorite, Following } from '../src/db';

use(chaiHttp);

import app from '../src/app';
import { generateToken } from '../src/services/token';

const should = _should();

const BASE_PATH = '/api/articles';

const userData = createFakeUser();

const otherUserData = createFakeUser();

const randomArticle = createFakeArticle();
const otherRandomArticle = createFakeArticle();

describe('GET /api/articles', () => {

    before(async () => {
        await (new Article(randomArticle)).save();
        await (new Comment({text: 'first comment!'})).save();
    });

    after(async () => {
        await Article.deleteMany({});
    });

    it('should return all existing articles', done => {
        request(app)
            .get(`${BASE_PATH}`)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);

                expect(res.body).to.have.a.property('articles');
                expect(res.body).to.have.a.property('articlesCount');

                let { articles, articlesCount } = res.body;

                expect(articles).to.be.an('array');
                expect(articlesCount).to.equal(articles.length);
                done();
            });
    });

    it('should return article by slug', done => {
        request(app)
            .get(`${BASE_PATH}/${randomArticle.slug}`)
            .end((err, res) => {

                should.not.exist(err);
                res.should.have.status(200);

                expect(res.body).to.have.a.property('article');

                let { article } = res.body;

                expect(article).to.have.a.property('slug');
                expect(article.slug).to.equal(randomArticle.slug);
                done();
            });
    });

    it('should return 404 by slug if no article exists', done => {
        request(app)
            .get(`${BASE_PATH}/some_other_random_slug`)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(404);
                done();
            });
    });
});

describe('POST /api/articles', () => {
    before(async () => {
        await (new User(userData)).save();
    });

    after(async () => {
        await User.deleteMany({});
        await Article.deleteMany({});
    });

    it('should return created article', done => {
        request(app)
            .post(`${BASE_PATH}`)
            .send({
                article: randomArticle
            })
            .set('Authorization', `Token ${userData.token}`)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);

                expect(res.body).to.have.a.property('article');

                let { article } = res.body;
                expect(article).to.be.an('object');
                expect(article).to.have.a.property('title');
                expect(article).to.have.a.property('description');
                expect(article).to.have.a.property('body');

                const { slug } = res.body.article;
                const createdArticle = Article.findOne({ slug });
                should.exist(createdArticle);

                done();
            });
    });

    it('should return 401 if token is missing', done => {
        request(app)
            .post(`${BASE_PATH}`)
            .send(randomArticle)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(401);

                done();
            });
    });
});

describe('PUT /api/articles/:slug', () => {
    before(async () => {
        const savedUser = await (new User(userData)).save();
        randomArticle.author = {
            email: savedUser.email,
            username: savedUser.username,
            bio: savedUser.bio,
            image: savedUser.image
        };
        await (new Article(randomArticle)).save();
    });

    after(async () => {
        await User.deleteMany({});
        await Article.deleteMany({});
    });

    it('should update article', done => {
        const updates = {
            article: {
                title: 'New Title'
            }
        };
        request(app)
            .put(`${BASE_PATH}/${randomArticle.slug}`)
            .send(updates)
            .set('Authorization', `Token ${userData.token}`)
            .end(async (err, res) => {
                should.not.exist(err);

                res.should.have.status(200);

                const { title, slug } = res.body.article;
                const updatedArticle = await Article.findOne({ slug });
                should.exist(updatedArticle);
                expect(title).to.equal('New Title');
                expect(slug).to.equal('new-title');
                done();
            });
    });

    it('should return 401 if token is missing', done => {
        const updates = {
            article: {
                title: 'New Title'
            }
        };
        request(app)
            .put(`${BASE_PATH}/${randomArticle.slug}`)
            .send(updates)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(401);

                done();
            });
    });
});

describe('DELETE /api/articles/:slug', () => {
    beforeEach(async () => {
        const savedUser = await (new User(userData)).save();
        randomArticle.author = {
            email: savedUser.email,
            username: savedUser.username,
            bio: savedUser.bio,
            image: savedUser.image
        };
        await (new Article(randomArticle)).save();
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Article.deleteMany({});
    });

    it('should delete article', done => {
        const slug = randomArticle.slug;
        request(app)
            .delete(`${BASE_PATH}/${slug}`)
            .set('Authorization', `Token ${userData.token}`)
            .end(async (err, res) => {
                should.not.exist(err);

                res.should.have.status(200);

                const deletedArticle = await Article.findOne({ slug });
                should.not.exist(deletedArticle);
                done();
            });
    });

    it('should return 401 if token is missing', done => {
        const slug = randomArticle.slug;
        request(app)
            .delete(`${BASE_PATH}/${slug}`)
            .end(async (err, res) => {
                should.not.exist(err);

                res.should.have.status(401);

                done();
            });
    });

    it('should return 403 if user is not the author', done => {
        const token = generateToken({email: 'some@email.com'});
        request(app)
            .delete(`${BASE_PATH}/${randomArticle.slug}`)
            .set('Authorization', `Token ${token}`)
            .end(async (err, res) => {
                should.not.exist(err);

                res.should.have.status(403);

                done();
            });
    });

    it('should return 404 if article does not exist', done => {
        request(app)
            .delete(`${BASE_PATH}/some_random_slug`)
            .set('Authorization', `Token ${userData.token}`)
            .end(async (err, res) => {
                should.not.exist(err);

                res.should.have.status(404);

                done();
            });
    });
});


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
            .end(async (err, res) => {
                should.not.exist(err);

                res.should.have.status(404);
            });
    });

    it('should throw 404 if article does not exist', async () => {
        request(app)
            .post(`${BASE_PATH}/some_random_slug/comments`)
            .set('Authorization', `Token ${userData.token}`)
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

describe('POST /:slug/favorite', async () => {
    beforeEach(async () => {
        randomArticle.author = getProfileFromUser(userData);
        randomArticle.favorited = false;
        randomArticle.favoritesCount = 0;
        await (new Article(randomArticle)).save();
        await (new User(userData)).save();
    });

    after(async () => {
        await Article.deleteMany({});
        await User.deleteMany({});
    });

    it('should add a like to the article', done => {
        request(app)
            .post(`${BASE_PATH}/${randomArticle.slug}/favorite`)
            .set('Authorization', `Token ${userData.token}`)
            .end((err, res) => {
                should.not.exist(err);

                res.should.have.status(200);
                const { article } = res.body;
                expect(article).to.have.a.property('favorited');
                expect(article.favorited).to.equal(true);
                expect(article).to.have.a.property('favoritesCount');
                expect(article.favoritesCount).to.equal(1);
                done();
            });
    });
});

describe('DELETE /:slug/favorite', async () => {
    before(async () => {
        randomArticle.author = getProfileFromUser(userData);
        randomArticle.favorited = true;
        randomArticle.favoritesCount = 1;
        const savedArticle = await (new Article(randomArticle)).save();
        const saveduser = await (new User(userData)).save();
        await (new Favorite({
            userId: saveduser._id,
            articleId: savedArticle._id
        })).save();
    });

    after(async () => {
        await Article.deleteMany({});
        await User.deleteMany({});
        await Favorite.deleteMany({});
    });

    it('should remove a like to the article and update accordingly', done => {
        request(app)
            .delete(`${BASE_PATH}/${randomArticle.slug}/favorite`)
            .set('Authorization', `Token ${userData.token}`)
            .end((err, res) => {
                should.not.exist(err);

                res.should.have.status(200);
                const { article } = res.body;
                expect(article).to.have.a.property('favorited');
                expect(article.favorited).to.equal(false);
                expect(article).to.have.a.property('favoritesCount');
                expect(article.favoritesCount).to.equal(0);
                done();
            });
    });
});

describe('DELETE /:slug/favorite', async () => {
    before(async () => {
        randomArticle.author = getProfileFromUser(userData);
        randomArticle.favorited = true;
        randomArticle.favoritesCount = 10;
        const savedArticle = await (new Article(randomArticle)).save();
        const saveduser = await (new User(userData)).save();
        await (new Favorite({
            userId: saveduser._id,
            articleId: savedArticle._id
        })).save();
    });

    after(async () => {
        await Article.deleteMany({});
        await User.deleteMany({});
        await Favorite.deleteMany({});
    });

    it('should remove a like to the article and update accordingly', done => {
        request(app)
            .delete(`${BASE_PATH}/${randomArticle.slug}/favorite`)
            .set('Authorization', `Token ${userData.token}`)
            .end((err, res) => {
                should.not.exist(err);

                res.should.have.status(200);
                const { article } = res.body;
                expect(article).to.have.a.property('favorited');
                expect(article.favorited).to.equal(true);
                expect(article).to.have.a.property('favoritesCount');
                expect(article.favoritesCount).to.equal(9);
                done();
            });
    });
});

describe('DELETE /:slug/favorite', async () => {
    before(async () => {
        randomArticle.author = getProfileFromUser(userData);
        randomArticle.favorited = false;
        randomArticle.favoritesCount = 0;
        await (new Article(randomArticle)).save();
        await (new User(userData)).save();
    });

    after(async () => {
        await Article.deleteMany({});
        await User.deleteMany({});
    });

    it('should do nothing if the article has no favorites yet', done => {
        request(app)
            .delete(`${BASE_PATH}/${randomArticle.slug}/favorite`)
            .set('Authorization', `Token ${userData.token}`)
            .end((err, res) => {
                should.not.exist(err);

                res.should.have.status(200);
                const { article } = res.body;
                expect(article).to.have.a.property('favorited');
                expect(article.favorited).to.equal(false);
                expect(article).to.have.a.property('favoritesCount');
                expect(article.favoritesCount).to.equal(0);
                done();
            });
    });
});

describe('GET /feed', async () => {
    before(async () => {
        randomArticle.author = getProfileFromUser(userData);
        await (new Article(randomArticle)).save();
        const followed = await (new User(userData)).save();
        const follower = await (new User(otherUserData)).save();
        await (new Following({
            followedUserId: followed._id,
            followerUserId: follower._id
        })).save();
    });

    after(async () => {
        await Article.deleteMany({});
        await User.deleteMany({});
        await Following.deleteMany({});
    });

    it('should return feed', done => {
        request(app)
            .get(`${BASE_PATH}/feed`)
            .set('Authorization', `Token ${otherUserData.token}`)
            .end((err, res) => {
                should.not.exist(err);

                res.should.have.status(200);
                const { articles } = res.body;
                expect(articles).to.be.an('array');
                expect(articles.length).to.equal(1);
                done();
            });
    });
});

import chaiHttp from 'chai-http';
import { use, should as _should, expect, request } from 'chai';
import { generateToken } from '../src/services/token';
import { it, describe, before, after, beforeEach, afterEach } from 'mocha';
import bcrypt from 'bcrypt';
import { User } from '../src/db';
import { createFakeUser } from '../src/utils';

use(chaiHttp);

import app from '../src/app';

const should = _should();

const userData = createFakeUser();

const nonExistingUserToken = generateToken({ email: 'asd@emails.com' });

describe('POST /api/users (signup)', () => {
    afterEach(async () => {
        await User.deleteMany({});
    });
    const BASE_PATH = '/api/users';
    it('should return the registered user', done => {
        request(app)
            .post(BASE_PATH)
            .send({ user: userData })
            .end((err, res) => {
                res.should.have.status(200);
                should.not.exist(err);
                expect(res.body).to.have.a.property('user');
                const signupResponse = res.body.user;
                expect(signupResponse).to.have.a.property('username');
                expect(signupResponse).to.have.a.property('email');
                expect(signupResponse).to.have.a.property('bio');
                expect(signupResponse).to.have.a.property('image');
                expect(signupResponse).to.have.a.property('token');
                done();
            });
    });

    it('should return 400 if email is missing', done => {
        request(app)
            .post(BASE_PATH)
            .send({
                username: userData.username,
                password: userData.password
            })
            .end((err, res) => {
                res.should.have.status(400);
                should.not.exist(err);
                done();
            });
    });

    it('should return 400 if password is missing', done => {
        request(app)
            .post(BASE_PATH)
            .send({
                username: userData.username,
                email: userData.email
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(400);
                done();
            });
    });
});

describe('POST /api/users/login', () => {
    const BASE_PATH = '/api/users/login';
    const rawPassword = (' ' + userData.password).slice(1);
    beforeEach(async () => {
        userData.password = await bcrypt.hash(userData.password, 10);
        await (new User(userData)).save();
    });

    afterEach(async () => {
        await User.deleteMany({});
    });

    it('should return the logged-in user', done => {
        request(app)
            .post(BASE_PATH)
            .send({
                user: {
                    email: userData.email,
                    password: rawPassword
                }
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                expect(res.body).to.have.a.property('user');

                const loginResponse = res.body.user;
                expect(loginResponse).to.have.a.property('username');
                expect(loginResponse).to.have.a.property('email');
                expect(loginResponse).to.have.a.property('bio');
                expect(loginResponse).to.have.a.property('image');
                expect(loginResponse).to.have.a.property('token');
                done();
            });
    });

    it('should return 400 if email is missing', done => {
        request(app)
            .post(BASE_PATH)
            .send({
                username: userData.username
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(400);
                done();
            });
    });

    it('should return 400 if password is missing', done => {
        request(app)
            .post(BASE_PATH)
            .send({
                user: {
                    email: userData.email
                }
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(400);
                done();
            });
    });
});

describe('GET /api/user', () => {
    const BASE_PATH = '/api/user';

    before(async () => {
        await (new User(userData)).save();
    });

    after(async () => {
        await User.deleteMany({});
    });

    it('should return user by token', done => {
        request(app)
            .get(BASE_PATH)
            .set('Authorization', `Token ${userData.token}`)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);

                expect(res.body).to.have.a.property('user');

                const loginResponse = res.body.user;
                expect(loginResponse).to.have.a.property('username');
                expect(loginResponse).to.have.a.property('email');
                expect(loginResponse).to.have.a.property('bio');
                expect(loginResponse).to.have.a.property('image');
                expect(loginResponse).to.have.a.property('token');
                done();
            });
    });

    it('should return 400 if token is missing', done => {
        request(app)
            .get(BASE_PATH)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(400);
                done();
            });
    });

    it('should return 404 if user does not exist', done => {
        request(app)
            .get(BASE_PATH)
            .set('Authorization', `Token ${nonExistingUserToken}`)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(404);
                done();
            });
    });
});

describe('PUT /api/user', () => {
    const BASE_PATH = '/api/user';

    before(async () => {
        await (new User(userData)).save();
    });

    after(async () => {
        await User.deleteMany({});
    });

    it('should return updated user by token', done => {
        const data = {
            user: {
                username: 'new_username'
            }
        };
        request(app)
            .put(BASE_PATH)
            .set('Authorization', `Token ${userData.token}`)
            .send(data)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                expect(res.body).to.have.a.property('user');
                const updateResponse = res.body.user;
                expect(updateResponse).to.have.a.property('username');
                expect(updateResponse.username).to.equal(data.user.username);
                done();
            });
    });

    it('should return 400 if update data is missing', done => {
        request(app)
            .put(BASE_PATH)
            .set('Authorization', `Token ${nonExistingUserToken}`)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(400);
                done();
            });
    });

    it('should return 401 if token is missing', done => {
        request(app)
            .put(BASE_PATH)
            .send({
                user: {
                    username: 'new_username'
                }
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(401);
                done();
            });
    });

    it('should return 404 if user does not exist', done => {
        request(app)
            .put(BASE_PATH)
            .set('Authorization', `Token ${nonExistingUserToken}`)
            .send({
                user: {
                    username: 'new_username'
                }
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(404);
                done();
            });
    });
});

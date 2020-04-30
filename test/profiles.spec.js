import chaiHttp from 'chai-http';
import app from '../src/app';
import { use, should as _should, expect, request } from 'chai';
import { generateToken } from '../src/services/token';
import { it, describe, beforeEach, afterEach } from 'mocha';
import { User, Following } from '../src/db';
import { createFakeUser } from './utils';

use(chaiHttp);

const should = _should();

const BASE_PATH = '/api/profiles';
const userData = createFakeUser();
const followerData = createFakeUser();
const followedData = createFakeUser();
const nonExistingUserToken = generateToken({
    email: 'asd@emails.com',
    username: 'some_random_username'
});

describe('GET /api/profiles', () => {
    beforeEach(async () => {
        const user = new User(userData);
        await user.save();
    });

    afterEach(async () => {
        await User.deleteMany({});
    });

    it('should return 404 if user does not exist', done => {
        request(app)
            .get(`${BASE_PATH}/something_something`)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(404);
                done();
            });
    });

    it("should return user's profile", done => {
        request(app)
            .get(`${BASE_PATH}/${userData.username}`)
            .end((err, res) => {
                res.should.have.status(200);
                should.not.exist(err);
                expect(res.body).to.have.a.property('profile');

                const profileResponse = res.body.profile;
                expect(profileResponse).to.have.a.property('username');
                expect(profileResponse).to.have.a.property('following');
                expect(profileResponse).to.have.a.property('bio');
                expect(profileResponse).to.have.a.property('image');
                done();
            });
    });
});

describe('POST /api/profiles/{username}/follow', () => {
    beforeEach(async () => {
        const follower = new User(followerData);
        const followed = new User(followedData);
        await follower.save();
        await followed.save();
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Following.deleteMany({});
    });

    it('should return 404 if user does not exist', done => {
        request(app)
            .post(`${BASE_PATH}/something_something/follow`)
            .set('Authorization', `Token ${nonExistingUserToken}`)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(404);
                done();
            });
    });

    it('should return 400 if token is missing', done => {
        request(app)
            .post(`${BASE_PATH}/something_something/follow`)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(400);
                done();
            });
    });

    it('should return follower profile', done => {
        request(app)
            .post(`${BASE_PATH}/${followerData.username}/follow`)
            .set('Authorization', `Token ${followedData.token}`)
            .end((err, res) => {

                should.not.exist(err);
                res.should.have.status(200);
                expect(res.body).to.have.a.property('profile');

                const profileResponse = res.body.profile;
                expect(profileResponse).to.have.a.property('username');
                expect(profileResponse).to.have.a.property('following');
                expect(profileResponse).to.have.a.property('bio');
                expect(profileResponse).to.have.a.property('image');

                const data = Following.find();
                should.exist(data);
                done();
            });
    });
});

describe('DELETE /api/profiles/{username}/follow', () => {
    beforeEach(async () => {
        const follower = new User(followerData);
        const followed = new User(followedData);
        const user1 = await follower.save();
        const user2 = await followed.save();
        await (new Following({
            followerUserId: user1._id,
            followedUserId: user2._id
        })).save();
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Following.deleteMany({});
    });

    it('should return 404 if followed user does not exist', done => {
        request(app)
            .delete(`${BASE_PATH}/something_something/follow`)
            .set('Authorization', `Token ${nonExistingUserToken}`)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(404);
                done();
            });
    });

    it('should return 400 if token is missing', done => {
        request(app)
            .delete(`${BASE_PATH}/something_something/follow`)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(400);
                done();
            });
    });

    it('should return follower profile', done => {
        request(app)
            .delete(`${BASE_PATH}/${followedData.username}/follow`)
            .set('Authorization', `Token ${followerData.token}`)
            .end(async (err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                expect(res.body).to.have.a.property('profile');

                const profileResponse = res.body.profile;
                expect(profileResponse).to.have.a.property('username');
                expect(profileResponse).to.have.a.property('following');
                expect(profileResponse).to.have.a.property('bio');
                expect(profileResponse).to.have.a.property('image');

                const following = await Following.findOne({});
                should.not.exist(following);
                done();
            });
    });
});

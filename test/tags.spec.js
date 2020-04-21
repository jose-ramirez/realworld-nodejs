import { use, should as _should, expect, request } from 'chai';
import { describe, it, before, after } from 'mocha';
import chaiHttp from 'chai-http';
import { Tag } from '../src/db';

use(chaiHttp);

import app from '../src/app';

const should = _should();

describe('GET /api/tags', () => {
    before(async () => {
        await (new Tag({name: 'tag1'})).save();
    });
    after(async () => {
        await Tag.deleteMany({});
    });
    it('should return a list of tags', done => {
        request(app)
            .get('/api/tags').end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                expect(res.body).to.have.a.property('tags');
                expect(res.body.tags).to.be.an('array');
                expect(res.body.tags.length).to.equal(1);
                expect(res.body.tags[0]).to.equal('tag1');
                done();
            });
    });
});

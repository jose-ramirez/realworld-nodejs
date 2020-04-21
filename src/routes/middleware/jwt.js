import jwt from 'express-jwt';

export const middleware = jwt({
    secret: 'some-secret',
    credentialsRequired: false,
    getToken: function fromHeaderOrQuerystring (req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.split(' ')[0] === 'Token') {
            return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            return req.query.token;
        }
        return null;
    },
});

import faker from 'faker';
import { generateToken } from '../src/services/token';
import { createSlug } from '../src/utils';

export const createFakeUser = () => {
    const email = faker.internet.email();
    return {
        email: email,
        username: faker.lorem.word(),
        token: generateToken({ email }),
        bio: faker.lorem.words(5),
        image: faker.image.imageUrl(),
        password: faker.random.alphaNumeric(8)
    };
};

export const getProfileFromUser = (user) => {
    const { bio, image, username } = user;
    return { bio, image, username };
};

export const createFakeArticle = () => {
    const title = faker.lorem.words(4);
    return {
        title,
        description: faker.lorem.words(3),
        body: faker.lorem.words(4),
        slug: createSlug(title),
        tagList: [faker.lorem.words(1), faker.lorem.words(1)]
    };
};

export const createFakeComment = () => {
    return {
        body: faker.lorem.words(4),
    };
};

export const createFakeArticleWithoutTags = () => {
    const title = faker.lorem.words(4);
    return {
        title,
        description: faker.lorem.words(3),
        body: faker.lorem.words(4),
        slug: createSlug(title)
    };
};

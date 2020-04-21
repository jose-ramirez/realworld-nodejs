import { Tag } from '../db';

export const getAllTags = async () => {
    const tags = await Tag.find();
    return { tags: tags.map(t => t.name) };
};

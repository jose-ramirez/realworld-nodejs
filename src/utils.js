export const createSlug = (title) => {
    return title
        .split(' ')
        .map(s => s.toLowerCase())
        .join('-');
};

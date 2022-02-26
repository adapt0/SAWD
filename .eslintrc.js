module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
    },
    extends: [
        'google',
    ],
    parserOptions: {
        ecmaVersion: 'latest',
    },
    rules: {
        'comma-dangle': ['error', 'only-multiline'],
        'indent': ['error', 4],
        'max-len': ['error', 200],
        'object-curly-spacing': ['error', 'always'],
    },
};

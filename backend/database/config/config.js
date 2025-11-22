require('dotenv').config({ path: '../.env' });

module.exports = {
    development: {
        dialect: 'sqlite',
        storage: './classroom.db',
        logging: false
    },
    test: {
        dialect: 'sqlite',
        storage: process.env.DB_PATH_TEST || './classroom_test.db',
        logging: false
    },
    production: {
        dialect: 'sqlite',
        storage: process.env.DB_PATH_PROD || './classroom.db',
        logging: false
    }
};

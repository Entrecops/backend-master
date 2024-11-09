require('dotenv').config();

module.exports =( process.env.NODE_ENV == 'PRODUCTION' ) ? {
    rootUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:8081',
} : {
    rootUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:8081'
}
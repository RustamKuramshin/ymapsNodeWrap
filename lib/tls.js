// Выбор протокола: HTTPS, если есть ключ и сертификат, иначе HTTP.

const fs = require('fs');

function tlsPaths() {
    return {
        key: process.env.TLS_KEY || 'key.pem',
        cert: process.env.TLS_CERT || 'cert.pem'
    };
}

function isTlsEnabled() {
    const paths = tlsPaths();
    return fs.existsSync(paths.key) && fs.existsSync(paths.cert);
}

function tlsOptions() {
    const paths = tlsPaths();
    return {
        key: fs.readFileSync(paths.key),
        cert: fs.readFileSync(paths.cert),
        passphrase: process.env.PASSPHRASE
    };
}

module.exports = { tlsPaths, isTlsEnabled, tlsOptions };

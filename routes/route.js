const crypto = require('crypto');
const express = require('express');
const ymaps = require('../lib/ymaps');
const { parseWaypoints } = require('../lib/waypoints');

const router = express.Router();

const DEFAULT_ROUTE_TIMEOUT_MS = 15000;

function routeTimeout() {
    const value = parseInt(process.env.ROUTE_TIMEOUT_MS, 10);
    return value > 0 ? value : DEFAULT_ROUTE_TIMEOUT_MS;
}

// Сравнение за постоянное время, чтобы не подсказывать ключ по времени ответа.
function isAuthorized(apikey) {
    const expected = process.env.ACCESSAPIKEY;
    if (!expected || typeof apikey !== 'string') {
        return false;
    }
    const hash = value => crypto.createHash('sha256').update(value).digest();
    return crypto.timingSafeEqual(hash(apikey), hash(expected));
}

router.get('/', async function (req, res) {
    if (!isAuthorized(req.query.apikey)) {
        res.status(401).send({ error: 'Неверный ключ доступа' });
        return;
    }

    let points;
    try {
        points = parseWaypoints(req.query.waypoints);
    } catch (err) {
        res.status(400).send({ error: err.message });
        return;
    }

    let result;
    try {
        result = await ymaps.getRouteLength(points, routeTimeout());
    } catch (err) {
        console.error(err);
        res.status(503).send({ error: 'API Карт недоступно' });
        return;
    }

    if (result.ok) {
        res.send({ length: result.length });
    } else if (result.reason === 'timeout') {
        res.status(504).send({ error: result.message });
    } else {
        res.status(422).send({ error: result.message });
    }
});

module.exports = router;

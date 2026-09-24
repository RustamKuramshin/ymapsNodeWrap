// Проверка HTTP-сервиса целиком: настоящий браузер, но вместо
// API Карт загружается заглушка test/fixtures/ymaps-stub.js.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const http = require('http');
const path = require('path');

const ACCESS_KEY = 'test-access-key';

let stubServer;
let appServer;
let baseUrl;
let ymaps;

test.before(async () => {
    const stub = fs.readFileSync(path.join(__dirname, 'fixtures', 'ymaps-stub.js'));
    stubServer = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(stub);
    });
    await new Promise(resolve => stubServer.listen(0, '127.0.0.1', resolve));

    process.env.YMAPS_API_URL = 'http://127.0.0.1:' + stubServer.address().port + '/ymaps.js';
    process.env.ACCESSAPIKEY = ACCESS_KEY;
    process.env.ROUTE_TIMEOUT_MS = '500';

    ymaps = require('../lib/ymaps');
    const app = require('../app');
    appServer = http.createServer(app);
    await new Promise(resolve => appServer.listen(0, '127.0.0.1', resolve));
    baseUrl = 'http://127.0.0.1:' + appServer.address().port;
});

test.after(async () => {
    await ymaps.close();
    appServer.close();
    stubServer.close();
});

function request(query) {
    return fetch(baseUrl + '/route?' + new URLSearchParams(query)).then(async res => ({
        status: res.status,
        body: await res.json()
    }));
}

test('без ключа доступа - 401', async () => {
    const res = await request({ waypoints: 'Азов|Аксай' });
    assert.strictEqual(res.status, 401);
});

test('неверный ключ доступа - 401', async () => {
    const res = await request({ apikey: 'wrong', waypoints: 'Азов|Аксай' });
    assert.strictEqual(res.status, 401);
});

test('без waypoints - 400', async () => {
    const res = await request({ apikey: ACCESS_KEY });
    assert.strictEqual(res.status, 400);
});

test('длина маршрута', async () => {
    const res = await request({ apikey: ACCESS_KEY, waypoints: 'Азов|10.5,20' });
    assert.deepStrictEqual(res, { status: 200, body: { length: 4000 + 30500 } });
});

test('совпадающие точки дают нулевую длину, а не зависание', async () => {
    const res = await request({ apikey: ACCESS_KEY, waypoints: '0,0|0,0' });
    assert.deepStrictEqual(res, { status: 200, body: { length: 0 } });
});

test('ошибка построения маршрута - 422', async () => {
    const res = await request({ apikey: ACCESS_KEY, waypoints: 'Азов|Нигде' });
    assert.strictEqual(res.status, 422);
    assert.match(res.body.error, /Не удалось найти адрес/);
});

test('маршрут не построился вовремя - 504', async () => {
    const res = await request({ apikey: ACCESS_KEY, waypoints: 'Азов|Долго' });
    assert.strictEqual(res.status, 504);
});

test('параллельные запросы получают свои ответы', async () => {
    const cities = ['Азов', 'Аксай', 'Абакан', 'Барнаул', 'Волжск', 'Кемерово', 'Краснодар', 'Беслан'];
    const pairs = [];
    for (const from of cities) {
        for (const to of cities) {
            pairs.push([from, to]);
        }
    }

    const results = await Promise.all(pairs.map(([from, to]) =>
        request({ apikey: ACCESS_KEY, waypoints: from + '|' + to })));

    results.forEach((res, i) => {
        const [from, to] = pairs[i];
        assert.deepStrictEqual(res, { status: 200, body: { length: (from.length + to.length) * 1000 } });
    });
});

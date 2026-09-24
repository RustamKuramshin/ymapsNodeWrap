// Браузер без графического интерфейса с загруженным JS API Яндекс.Карт.
// Одна страница обслуживает все запросы: каждый вызов page.evaluate
// получает собственный промис, общего состояния между запросами нет.

const path = require('path');
const puppeteer = require('puppeteer');
const debug = require('debug')('headless-ymaps:ymaps');

const DEFAULT_API_URL = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
const READY_TIMEOUT_MS = 30000;
const WRAP_PAGE = 'file://' + path.join(__dirname, '..', 'html_wrap', 'apiWrap.html');

let browser = null;
let pagePromise = null;

function apiUrl() {
    const base = process.env.YMAPS_API_URL || DEFAULT_API_URL;
    const key = process.env.YANDEXAPIKEY;
    if (!key) {
        return base;
    }
    return base + (base.includes('?') ? '&' : '?') + 'apikey=' + encodeURIComponent(key);
}

async function openPage() {
    const current = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    browser = current;
    current.on('disconnected', () => {
        debug('браузер отключился');
        if (browser === current) {
            browser = null;
            pagePromise = null;
        }
    });

    try {
        const page = await current.newPage();
        await page.goto(WRAP_PAGE);
        await page.addScriptTag({ url: apiUrl() });
        await page.evaluate(timeoutMs => new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('API Карт не загрузилось')), timeoutMs);
            ymaps.ready(() => {
                clearTimeout(timer);
                resolve();
            }, err => {
                clearTimeout(timer);
                reject(new Error(String(err && err.message || err)));
            });
        }), READY_TIMEOUT_MS);
        debug('API Карт готово');
        return page;
    } catch (err) {
        await current.close().catch(() => {});
        throw err;
    }
}

function getPage() {
    if (!pagePromise) {
        pagePromise = openPage().catch(err => {
            pagePromise = null;
            throw err;
        });
    }
    return pagePromise;
}

// Возвращает { ok: true, length } или { ok: false, reason: 'timeout' | 'route', message }.
async function getRouteLength(points, timeoutMs) {
    const page = await getPage();
    return page.evaluate((points, timeoutMs) => new Promise(resolve => {
        const timer = setTimeout(() => {
            resolve({ ok: false, reason: 'timeout', message: 'Превышено время построения маршрута' });
        }, timeoutMs);

        const waypoints = points.map(point => ({ type: 'wayPoint', point: point }));
        ymaps.route(waypoints, { routingMode: 'auto' }).then(route => {
            clearTimeout(timer);
            resolve({ ok: true, length: route.getLength() });
        }, err => {
            clearTimeout(timer);
            resolve({ ok: false, reason: 'route', message: String(err && err.message || err) });
        });
    }), points, timeoutMs);
}

async function close() {
    const current = browser;
    browser = null;
    pagePromise = null;
    if (current) {
        await current.close();
    }
}

module.exports = { getPage, getRouteLength, close };

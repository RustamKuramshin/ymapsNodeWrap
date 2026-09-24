// Разбор параметра waypoints: точки разделены символом "|",
// каждая точка - либо координаты "широта,долгота", либо адрес.

const COORDS_RE = /^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

const MIN_POINTS = 2;
const MAX_POINTS = 50;

function parsePoint(raw) {
    const text = raw.trim();
    if (text === '') {
        throw new Error('Пустая точка маршрута');
    }

    const match = COORDS_RE.exec(text);
    if (match) {
        const lat = Number(match[1]);
        const lon = Number(match[2]);
        if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
            throw new Error('Координаты вне допустимого диапазона: ' + text);
        }
        return [lat, lon];
    }

    return text;
}

function parseWaypoints(value) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error('Параметр waypoints обязателен');
    }

    const points = value.split('|').map(parsePoint);
    if (points.length < MIN_POINTS) {
        throw new Error('Нужно не меньше ' + MIN_POINTS + ' точек маршрута');
    }
    if (points.length > MAX_POINTS) {
        throw new Error('Допускается не больше ' + MAX_POINTS + ' точек маршрута');
    }

    return points;
}

module.exports = { parseWaypoints };

const test = require('node:test');
const assert = require('node:assert');
const { parseWaypoints } = require('../lib/waypoints');

test('координаты и адреса', () => {
    assert.deepStrictEqual(
        parseWaypoints('55.811511,37.312518|Ростов-на-Дону'),
        [[55.811511, 37.312518], 'Ростов-на-Дону']
    );
});

test('отрицательные и целые координаты, пробелы', () => {
    assert.deepStrictEqual(parseWaypoints('-33.8, 151|40,-74'), [[-33.8, 151], [40, -74]]);
});

test('адрес с запятыми остаётся адресом', () => {
    assert.deepStrictEqual(
        parseWaypoints('Татарстан Респ, Казань г, Тихорецкая ул, 13|Азов'),
        ['Татарстан Респ, Казань г, Тихорецкая ул, 13', 'Азов']
    );
});

test('ошибки ввода', () => {
    assert.throws(() => parseWaypoints(undefined), /обязателен/);
    assert.throws(() => parseWaypoints(['a', 'b']), /обязателен/);
    assert.throws(() => parseWaypoints('Азов'), /не меньше/);
    assert.throws(() => parseWaypoints('Азов||Аксай'), /Пустая/);
    assert.throws(() => parseWaypoints('95,10|Азов'), /диапазона/);
});

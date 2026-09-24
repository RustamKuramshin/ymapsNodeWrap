// Заглушка JS API Яндекс.Карт для тестов.
// Длина маршрута детерминирована и зависит только от точек,
// ответ приходит со случайной задержкой, чтобы запросы перемешивались.
(function () {
    function pointWeight(point) {
        if (typeof point === 'string') {
            return point.length * 1000;
        }
        return Math.round((Math.abs(point[0]) + Math.abs(point[1])) * 1000);
    }

    window.ymaps = {
        ready: function (onReady) {
            setTimeout(onReady, 10);
        },
        route: function (waypoints) {
            return new Promise(function (resolve, reject) {
                var points = waypoints.map(function (w) { return w.point; });
                if (points.indexOf('Нигде') !== -1) {
                    setTimeout(function () { reject(new Error('Не удалось найти адрес')); }, 10);
                    return;
                }
                if (points.indexOf('Долго') !== -1) {
                    return;
                }
                var length = points.reduce(function (sum, p) { return sum + pointWeight(p); }, 0);
                setTimeout(function () {
                    resolve({ getLength: function () { return length; } });
                }, Math.random() * 100);
            });
        }
    };
})();

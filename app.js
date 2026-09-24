var express = require('express');
var logger = require('morgan');

var routeRouter = require('./routes/route');
var ymaps = require('./lib/ymaps');

var app = express();

// Ключ доступа не должен попадать в журнал запросов.
logger.token('safe-url', function (req) {
  return req.originalUrl.replace(/([?&]apikey=)[^&]*/gi, '$1***');
});

app.use(logger(':method :safe-url :status :response-time ms - :res[content-length]'));

app.use('/route', routeRouter);

// Готовность к работе: браузер запущен и API Карт загружено.
app.get('/health', function(req, res) {
  if (ymaps.isReady()) {
    res.send({ status: 'ok' });
    return;
  }
  ymaps.getPage().catch(function () {});
  res.status(503).send({ status: 'starting' });
});

app.use(function(req, res) {
  res.status(404).send({ error: 'Не найдено' });
});

app.use(function(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).send({ error: 'Внутренняя ошибка сервера' });
});

module.exports = app;

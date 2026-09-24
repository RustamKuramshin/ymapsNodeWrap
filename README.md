# ymapsNodeWrap
API Карт под Node.js

Реализована node-обертка для API Карт с использованием библиотеки puppeteer, которая позволяет работать с JS API Карт без использования графического интерфейса браузера. Доступно создание контейнера docker.

## Запрос

```
GET https://server_ip:port/route?apikey=<secret_code>&waypoints=<point_1|point_2|...>
```

- `apikey` - ключ доступа к сервису (переменная окружения `ACCESSAPIKEY`);
- `point_n` - точка маршрута: географические координаты `широта,долгота` (например, `55.811511,37.312518`) или адрес. Точек от 2 до 50.

Значения параметров нужно кодировать (percent-encoding): Node.js отклоняет запросы с неэкранированной кириллицей в URL.

Ответы:

| Код | Тело | Когда |
|---|---|---|
| 200 | `{"length": <метры>}` | маршрут построен |
| 400 | `{"error": "..."}` | неверный параметр `waypoints` |
| 401 | `{"error": "..."}` | неверный ключ доступа |
| 422 | `{"error": "..."}` | API Карт не смогло построить маршрут (например, адрес не найден) |
| 503 | `{"error": "..."}` | API Карт не загрузилось |
| 504 | `{"error": "..."}` | маршрут не построен за `ROUTE_TIMEOUT_MS` |

`GET /health` (без ключа) возвращает 200 `{"status": "ok"}`, когда браузер запущен и API Карт загружено, иначе 503 и повторную попытку загрузки.

## Настройка

Переменные окружения (шаблон в `env.list.example`):

| Переменная | Назначение |
|---|---|
| `PORT` | порт, по умолчанию 8080 |
| `ACCESSAPIKEY` | ключ доступа к сервису, обязателен |
| `YANDEXAPIKEY` | ключ JavaScript API Яндекс.Карт |
| `TLS_KEY`, `TLS_CERT` | пути к ключу и сертификату, по умолчанию `key.pem` и `cert.pem`; если файлов нет, сервер работает по HTTP |
| `PASSPHRASE` | пароль к TLS-ключу |
| `ROUTE_TIMEOUT_MS` | таймаут построения маршрута, по умолчанию 15000 |
| `YMAPS_API_URL` | адрес загрузчика API Карт, нужен в основном для тестов |

## Запуск

Нужен Node.js 22.12 или новее (в Docker используется Node 24).

```
npm install
cp env.list.example env.list   # заполнить значения
set -a; . ./env.list; set +a
npm start
```

При `npm install` puppeteer скачивает свою сборку Chrome. Если она не нужна, можно указать уже установленный браузер: `PUPPETEER_SKIP_DOWNLOAD=1 npm install` и `PUPPETEER_EXECUTABLE_PATH=/путь/к/chrome`.

## Docker

```
cp env.list.example env.list   # заполнить значения
docker compose up -d --build
```

Сервис будет доступен на порту 8080, другой внешний порт задаётся переменной `HOST_PORT` (`HOST_PORT=9090 docker compose up -d`). Без compose:

```
./build.sh
docker run -d --env-file env.list -e PORT=8080 -p 8080:8080 nodedev/ymapsnode
```

Как устроен образ:

- сборка в три этапа: зависимости Node, скачивание `chrome-headless-shell` той версии, под которую выпущен puppeteer, итоговый образ на Ubuntu 24.04 только с нужными библиотеками (около 270 МБ в сжатом виде);
- процесс работает от непривилегированного пользователя `ubuntu` (uid 1000), `tini` передаёт сигналы и завершает дочерние процессы Chrome;
- `HEALTHCHECK` опрашивает `/health`, состояние видно в `docker ps`;
- Chrome for Testing выпускается только под amd64, поэтому `build.sh` и compose собирают образ под `linux/amd64`; на Apple Silicon он работает через эмуляцию.

Для HTTPS ключ и сертификат подключаются томами (в образ они не копируются), а ключ должен быть доступен на чтение uid 1000:

```
chown 1000 key.pem
docker run -d --env-file env.list -e PORT=8080 -p 8080:8080 \
  -v "$PWD/key.pem:/app/key.pem:ro" -v "$PWD/cert.pem:/app/cert.pem:ro" nodedev/ymapsnode
```

Если сеть подменяет TLS-сертификаты (корпоративный прокси), этапам сборки с `npm` нужен корневой сертификат прокси. Проще всего подготовить базовый образ с ним и подставить его без правки Dockerfile:

```
# в отдельной папке ca-base/ лежат proxy-ca.crt и Dockerfile:
#   FROM node:24-bookworm-slim
#   COPY proxy-ca.crt /ca.crt
#   ENV NODE_EXTRA_CA_CERTS=/ca.crt
docker build -t local/node24-ca ca-base/
./build.sh --build-context node:24-bookworm-slim=docker-image://local/node24-ca
```

## Тесты

```
npm test
```

Тесты запускают настоящий браузер, но вместо API Карт загружают заглушку `test/fixtures/ymaps-stub.js`, поэтому доступ к серверам Яндекса и ключ для них не нужны.

Скрипты `test/*.ps1` - ручная нагрузочная проверка работающего сервиса с настоящим API Карт.

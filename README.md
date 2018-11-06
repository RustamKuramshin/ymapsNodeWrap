# ymapsNodeWrap
API Карт под Node.js

Реализована node-обертка для API Карт с использованием библиотеки puppeteer, которая позволяет работать с JS API Карт без использования графического интерфейса браузера. Доступно создание контейнера docker.

Формат URL:
GET https://server_ip:port/route?apikey=<secret_code>&waypoints=<point_1|pint_2|...>, где
point_n - точка маршрута, заданная географическими координатами или точным адресом.

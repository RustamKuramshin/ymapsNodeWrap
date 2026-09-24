# syntax=docker/dockerfile:1

ARG NODE_VERSION=24

# Зависимости Node без браузера.
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN PUPPETEER_SKIP_DOWNLOAD=1 npm ci --omit=dev \
    && rm -rf /root/.npm

# chrome-headless-shell той версии, под которую выпущен puppeteer.
# Для Chrome for Testing есть сборки только под linux/amd64.
# В slim-образе нет unzip, поэтому архив распаковывает yauzl (только на этом этапе).
FROM deps AS chrome-dist
RUN npm install --no-save --no-package-lock yauzl \
    && npx puppeteer browsers install chrome-headless-shell --path /tmp/browsers \
    && mv /tmp/browsers/chrome-headless-shell/*/chrome-headless-shell-linux64 /chrome \
    && rm -rf /tmp/browsers

# Итоговый образ: только Node, зависимости приложения, браузер и его системные библиотеки.
# Список пакетов покрывает прямые зависимости chrome-headless-shell (objdump -p | grep NEEDED).
FROM ubuntu:24.04

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        fonts-liberation \
        libasound2t64 \
        libatk-bridge2.0-0t64 \
        libatk1.0-0t64 \
        libdbus-1-3 \
        libdrm2 \
        libgbm1 \
        libnss3 \
        libxcomposite1 \
        libxdamage1 \
        libxfixes3 \
        libxkbcommon0 \
        libxrandr2 \
        tini \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /usr/local/bin/node /usr/local/bin/node
COPY --from=chrome-dist /chrome /opt/chrome

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json app.js ./
COPY bin ./bin
COPY lib ./lib
COPY routes ./routes
COPY html_wrap ./html_wrap

ENV NODE_ENV=production \
    PORT=8080 \
    PUPPETEER_EXECUTABLE_PATH=/opt/chrome/chrome-headless-shell

USER ubuntu
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \
    CMD ["node", "./bin/healthcheck"]

# tini передаёт сигналы node и забирает завершившиеся процессы Chrome.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "./bin/www"]

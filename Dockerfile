FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production \
    PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

COPY package*.json ./

# Chrome нужной версии скачивает сам puppeteer, системные библиотеки для него ставит --install-deps.
RUN npm ci --omit=dev \
    && npx puppeteer browsers install chrome --install-deps \
    && rm -rf /var/lib/apt/lists/* /root/.npm

COPY . .

RUN useradd --create-home app && chown -R app:app /app/.cache
USER app

EXPOSE 8080

CMD [ "node", "./bin/www" ]

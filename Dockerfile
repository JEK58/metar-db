FROM node:17.8.0-alpine3.15
RUN yarn install
WORKDIR /qnh-scraper

COPY package.json .

RUN yarn install

COPY . .

CMD ["yarn", "start"]
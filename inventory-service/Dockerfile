FROM node:10-alpine
WORKDIR /app
COPY package.json /app
COPY yarn.lock /app
RUN yarn
COPY . .
CMD ["yarn", "start"]
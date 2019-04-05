# Convenient microservices development environment with docker-compose 

## 🤢 Problem to solve

Traditionally, in order to run development mode, developer would be forced to run each service individually and manage network in a very unconventional way. Difference between production and development environments would be too large and it would be hard to debug when things start breaking in production due to difference between environments. Creating additional set of Dockerfile(s) is terrible idea as well. We need approach which allows us to develop with current Dockerfile(s) and as little difference between environments as possible. We also need to persist changes that are made within containers. Finally, we want to run whole development environment with a single command.


## 💁 Resolution

To avoid running each service individually, we can still use docker-compose the same way we use it in production. In order to create different Docker image for development mode, and that is only for the services we want to modify, we use docker-compose overriding functionality, so we don’t need to create additional Dockerfile(s) other than single overriding docker-compose file. We then use the `-f` flag to append it when we need it.

To persist filesystem changes, we use volumes to link whole container workdir to the host, therefore we can make changes in code and watcher such as nodemon can easily restart development server. Containers won’t have to be rebuilt again. All changes will persist for both container and the host.


> Following this technique, we can use all Docker features the same way we’d use it in production, such as; run whole network with a single command, control how services have access among themselves and which are exposed to the outside.

📋 Example

Let’s assume we want to modify item-service and run all other services in the same way as we do it in production.

![Services illustration](https://cdn-images-1.medium.com/max/1600/1*lhoudJyty1Oc2cohWbVMvw.png)

In development, we use `dev` script which uses nodemon to watch file changes and restart server. Originally, we used `start` script which starts plain Node process. This same technique can be applied for any other language or toolset.

Let’s create repository of services:

```
# Create project root directory
mkdir docker-compose-development-environment && cd "$_"

# Create service directories
mkdir gateway-proxy item-service inventory-service user-service

# Create docker-compose files
touch docker-compose.yml docker-compose.develop.yml

# Initialize git
git init
```

To match figure above, this will be the content of main docker-compose file:

```
version: "3.2"

services:
  gateway-proxy:
    image: kunokdev/gateway-proxy:${TAG:-latest}
    restart: always
    ports:
      - "5000:80"
    networks:
      - private-network
    environment:
      - "USER_SERVICE_URL=http://user-service"

  user-service:
    image: kunokdev/user-service:${TAG:-latest}
    restart: always
    networks:
      - private-network
    environment:
      - "MONGO_URL=mongodb://mongo"

  item-service:
    image: kunokdev/item-service:${TAG:-latest}
    restart: always
    networks:
      - private-network
    environment:
      - "MONGO_URL=mongodb://mongo"
      - "INVENTORY_SERVICE_URL=http://inventory-service"

  inventory-service:
    image: kunokdev/inventory-service:${TAG:-latest}
    restart: always
    networks:
      - private-network
    environment:
      - "MONGO_URL=mongodb://mongo"

  mongo:
    image: mongo:${MONGO_TAG-latest}
    volumes:
      - ./data:/data/db
    networks:
      - private-network

networks:
private-network:
```

Within overriding docker-compose file, we use build.context instead of image in order to work with local image. Since we run everything as containers, we need a way to persist filesystem changes and we achieve that via volumes. The trick is to bind container’s working directory to the host filesystem. Finally, we override CMD to run dev script from `package.json` (instead of previously `start` script):

```
version: "3.2"
services:
  item-service:
    volumes:
      - "./item-service:/app"
    command: ["yarn", "dev"]
    build:
      context: "./item-service"
```


Let’s create sample item service:

```
cd item-service

# Initialize npm directory
yarn init

# Create entrypoint file
touch main.js

# Create .gitignore
touch .gitignore
echo "node_modules" >> .gitignore

# Add development dependency
yarn add -D nodemon
```


Add `start` and `dev` scripts to `package.json`:

```
"scripts": {
     "start": "node main.js",
     "dev": "nodemon main.js"
  },
```

Then we will create sample server:

```
require("http")
  .createServer((req, res) => res.end("Item service"))
  .listen(process.env.PORT || 80, err => console.log(err || "Item Service"))
```

And corresponding Dockerfile:

```
 FROM node:10-alpine
 WORKDIR /app
 COPY package.json /app
 COPY yarn.lock /app
 RUN yarn
 COPY . .
 CMD ["yarn", "start"]
 ```
 
 
 When we want to run development mode, we use `-f` flag to append overriding docker-compose file.
 
 ```
 docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
 ```
 
 Now when we make changes within enhanced service, they will be applied and server should be restarted:
 
 Now you can develop your microservice, save changes and those will be applied. This is very convenient because you can easily reproduce production, make some changes, see how it works together with other services, and then push further. Very agile I’d say.
 

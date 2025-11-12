# Stage 1: Build stage
FROM node:20.19-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Remove unnecessary files from build
RUN rm -rf \
    *.md \
    .git \
    .env \
    migrations

# Stage 2: Production image
FROM node:20.19-alpine

WORKDIR /app

COPY --from=build /app ./

EXPOSE 3010

CMD [ "npm", "start" ]

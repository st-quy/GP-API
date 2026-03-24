# Stage 1: Build stage
FROM node:20.19-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi

COPY . .

# Remove unnecessary files from build
RUN rm -rf \
    *.md \
    .git \
    .env

# Stage 2: Production image
FROM node:20.19-alpine

WORKDIR /app

COPY --from=build /app ./

EXPOSE 3010

CMD [ "npm", "start" ]

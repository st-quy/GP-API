# Stage 1: Build stage
FROM node:20.19-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN if [ ! -f package-lock.json ]; then echo "Error: package-lock.json is required for reproducible builds" >&2; exit 1; fi && npm ci

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

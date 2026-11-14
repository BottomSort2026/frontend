# Flame in Freefall frontend: build the static app, serve it with nginx.
# Not yet built in CI: verify with `docker build .` before the first compose run.

FROM node:22-slim AS build
WORKDIR /app
RUN npm install -g pnpm@12.18.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Behind the gateway every API path is same-origin. Build with VITE_API_URL= (empty) for sample data.
ARG VITE_API_URL=/
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm exec vp build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

# Stage 1: Build
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
# Nginx config will be mounted from docker-compose
EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]

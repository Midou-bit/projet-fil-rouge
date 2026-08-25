# --- Build du front (Vite) ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_PLAUSIBLE_DOMAIN optionnel (mesure d'audience) : --build-arg VITE_PLAUSIBLE_DOMAIN=ton-domaine
ARG VITE_PLAUSIBLE_DOMAIN
RUN npm run build

# --- Service statique + proxy /api ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

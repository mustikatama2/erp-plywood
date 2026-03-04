# ── Stage 1: Build React app ─────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Pass build-time env
ARG VITE_API_URL=/api
ARG VITE_APP_TITLE="Mustikatama ERP"
RUN VITE_API_URL=$VITE_API_URL VITE_APP_TITLE=$VITE_APP_TITLE npm run build

# ── Stage 2: Serve with Nginx ────────────────────────────────────────────────
FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

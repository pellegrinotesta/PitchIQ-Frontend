FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 4200
CMD ["sh", "-c", "npx ng serve --host 0.0.0.0 --port $PORT --disable-host-check"]
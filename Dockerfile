FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src/ ./src/
COPY public/ ./public/
EXPOSE 18792
CMD ["node", "src/server.js"]

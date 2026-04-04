# GDPR Q&A Platform — Node 20 (Express)
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
# Platforms inject PORT; local default remains 3847 in server.js
EXPOSE 3847

CMD ["npm", "start"]

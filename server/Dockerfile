FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci --workspace=server
COPY server/ ./server/
COPY server/prisma ./server/prisma
RUN npm run -w server prisma:generate
EXPOSE 3001
CMD ["npm", "run", "-w", "server", "start"]

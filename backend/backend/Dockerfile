FROM node:18
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY src ./src
EXPOSE 8080
CMD ["node", "src/server.js"]

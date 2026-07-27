FROM node:18
ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
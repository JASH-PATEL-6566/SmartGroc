FROM node:20.18.1

WORKDIR /app

COPY ./package.json ./package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "run", "serve"]

EXPOSE 8000
FROM navikt/node-express:16

COPY package.json ./
COPY package-lock.json ./

RUN npm ci
COPY src/ src/
COPY config.json config.json

EXPOSE 3000
ENTRYPOINT ["npm", "start"]

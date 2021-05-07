FROM node:15

WORKDIR /usr/src/app

# 1st dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 9615

CMD [ "node", "generate.js" ]



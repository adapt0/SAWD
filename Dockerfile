# docker build . --squash -t sawd

FROM node:17-alpine

COPY package.json package-lock.json /app/
COPY src /app/src
RUN cd /app && npm install --production

# Tini = https://github.com/krallin/tini#using-tini
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

ENV NODE_ENV=production
WORKDIR /app
CMD ["node", "src/index.js"]

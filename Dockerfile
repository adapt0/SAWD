# docker build . --squash -t sawd

FROM node:17-alpine

COPY package.json package-lock.json src /app/
RUN cd /app && npm install --production

# Tini = https://github.com/krallin/tini#using-tini
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

ENV NODE_ENV=production
WORKDIR /app
CMD ["node", "index.js"]

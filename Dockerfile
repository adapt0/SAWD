# docker build . --squash -t sawd

FROM node:17-alpine

COPY package.json package-lock.json src /home/node/app/
RUN cd /home/node/app && npm install --production

# Tini = https://github.com/krallin/tini#using-tini
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

USER node
ENV NODE_ENV=production
WORKDIR /home/node/app
CMD ["node", "index.js"]

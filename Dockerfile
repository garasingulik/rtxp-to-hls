# build environment
FROM node:12.18.4-stretch as build
WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json ./
RUN npm install

COPY . ./
RUN npm run build

# production environment
FROM node:12.18.4-stretch-slim
WORKDIR /app

ARG FFMPEG_VERSION=4.3.1

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Instal a statically linked, recent version of ffmpeg
RUN curl -o - https://www.johnvansickle.com/ffmpeg/releases/ffmpeg-${FFMPEG_VERSION}-amd64-static.tar.xz | tar -Jxf - --to-stdout ffmpeg-${FFMPEG_VERSION}-amd64-static/ffmpeg > /usr/bin/ffmpeg && chmod +x /usr/bin/ffmpeg

ENV PATH /app/node_modules/.bin:$PATH
ENV NODE_ENV production

COPY package.json ./
RUN npm install --production

COPY ./public ./public
COPY --from=build /app/build ./build

VOLUME [ "/app/public" ]

ENV API_SECRET='' STREAM_API_URL='' FFMPEG_PATH='/usr/bin/ffmpeg'

EXPOSE 80
CMD ["node", "/app/build/src/server.js"]

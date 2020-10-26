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

# Instal a statically linked, recent version of ffmpeg and ffprobe
RUN curl -o - https://www.johnvansickle.com/ffmpeg/releases/ffmpeg-${FFMPEG_VERSION}-amd64-static.tar.xz | tar -Jxf - -C /usr/bin --strip-components 1 ffmpeg-${FFMPEG_VERSION}-amd64-static/ffmpeg ffmpeg-${FFMPEG_VERSION}-amd64-static/ffprobe && chmod +x /usr/bin/ffmpeg && chmod +x /usr/bin/ffprobe

ENV PATH /app/node_modules/.bin:$PATH
ENV NODE_ENV production

COPY package.json ./
RUN npm install --production

COPY ./public ./public
COPY --from=build /app/build ./build

VOLUME [ "/app/public" ]

ENV API_SECRET='' STREAM_API_URL=''

EXPOSE 80
CMD ["node", "/app/build/src/server.js"]

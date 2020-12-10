# build environment
FROM node:12.20.0-buster as build
WORKDIR /app

ARG FFMPEG_VERSION=4.3.1

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN curl -o - -L https://bit.ly/ffmpeg-ci | tar -Jxf - -C /usr/bin --strip-components 1 ffmpeg-${FFMPEG_VERSION}-amd64-static/ffmpeg ffmpeg-${FFMPEG_VERSION}-amd64-static/ffprobe && chmod +x /usr/bin/ffmpeg && chmod +x /usr/bin/ffprobe

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . ./
RUN npm run build

# production environment
FROM node:12.20.0-buster-slim
WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH
ENV NODE_ENV production

COPY package.json ./
COPY package-lock.json ./

RUN npm install --production

COPY ./public ./public
COPY --from=build /app/build ./build

COPY --from=build /usr/bin/ffmpeg /usr/bin/ffmpeg
COPY --from=build /usr/bin/ffprobe /usr/bin/ffprobe

RUN chmod +x /usr/bin/ffmpeg && chmod +x /usr/bin/ffprobe

VOLUME [ "/app/public" ]

ENV API_SECRET='' \
    STREAM_API_URL='' \
    UNIQUE_STREAM=''

EXPOSE 80
CMD ["node", "/app/build/src/server.js"]

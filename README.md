# RTxP to HLS Realtime Stream Converter

This service will convert RTMP/RTSP stream into HLS stream that we can play directly using HTML 5 video element. The conversion is done by using [FFMpeg](https://ffmpeg.org/) with hardcoded transcoding profile (feel free to set the params as requirements).

The FFMpeg will run as child process (spawn) and detached, the code has minimum stream id checking, what is mean that request to convert the same source url will be ignored if the previous conversion for the same source url is still active.

The conversion will stop if the source stream ended or closed. However the latest cache will still be available unless it replaced.

# Running in Development

Clone this repository and run:

```
npm install
```

Before we run the project, create one `.env` file in the root of the project and configure this value:

```
STREAM_API_URL=<http://localhost:3005 or use hosting url in production>
UNIQUE_STREAM=<true | false>
FFMPEG_PATH=<path to ffmpeg i.e. /usr/bin/ffmpeg>
```

To run this project in the development:

```
npm run dev
```

The development server will run at http://localhost:3005

# Testing Endpoints

### Convert Stream

```
curl -L -X POST 'http://localhost:8006/stream/convert' -H 'Content-Type: application/json' -d '{ "url": "<rtmp://stream-url or rtsp://stream-url>" }'
```

Example response:

```
{
    "url": "http://localhost:3005/static/6f206b6cd45ac9a2244f7ae9c57c28b3/stream.m3u8"
}
```

### Stop Conversion

```
curl -L -X POST 'http://localhost:8006/stream/stop' -H 'Content-Type: application/json' -d '{ "url": "<rtmp://stream-url or rtsp://stream-url>" }'
```

Example response:

```
{
    "success": "true"
}
```

# Running in Production

It's highly recommended to run this service inside docker container, and here is the minimum required syntax to run:

```
docker run --name rtxp-to-hls -p 80:80 -d -e STREAM_API_URL=http://where-am-i-hosted.com rtxp-to-hls
```

Although the service is possible to run without binding a volume, it's highly recommender if you bind one, i.e:

```
docker run --name rtxp-to-hls --mount type=bind,source=/dedicated/volume,target=/app/public -p 80:80 -d -e STREAM_API_URL=http://where-am-i-hosted.com rtxp-to-hls
```

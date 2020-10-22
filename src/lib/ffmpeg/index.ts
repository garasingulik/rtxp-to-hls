import * as childProcess from 'child_process'

import config from '../../config'

interface RunningPid {
  streamId: string,
  pid: number
}
const runningStreams: RunningPid[] = []

export const convertStream = async (streamUrl: string, outputPath: string): Promise<void> => {
  return new Promise((resolve) => {
    // skip same stream id if it's still running
    const streamId = outputPath.split('/')[2]

    const runningStream = runningStreams.find(s => s.streamId === streamId)
    if (runningStream) {
      console.log(`Killing previous process PID: ${runningStream}`)
      if (process.kill(runningStream.pid)) {
        releaseStreamId(streamId)
      } else {
        console.log(`Cannot kill pid: ${runningStream.pid}`)
        return
      }
    }

    // GOP = segment length * frame rate
    // previously we set this value fixed to 30
    // our segment is 4s so the value will be 4 * fps

    // https://slhck.info/video/2017/03/01/rate-control.html
    // In H.264 and H.265, CRF ranges from 0 to 51 (like the QP).
    // 23 is a good default for x264, and 28 is the default for x265.
    // 18 (or 24 for x265) should be visually transparent;
    // anything lower will probably just waste file size.

    // construct params
    const cmdParams: string[] = [
      '-i',
      streamUrl,
      '-c:v',
      'libx264',
      '-crf',
      '21',
      '-preset',
      'ultrafast',
      '-g',
      '25',
      '-sc_threshold',
      '0',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-ac',
      '2',
      '-f',
      'hls',
      '-hls_time',
      '4',
      '-hls_delete_threshold',
      '1',
      '-hls_flags',
      'delete_segments',
      '-hls_list_size',
      '15',
      `${outputPath}/stream.m3u8`
    ]

    const ffmpegCommand = `${config.ffmpeg} ${cmdParams.join(' ')}`
    console.log(`FFMPEG Command: ${ffmpegCommand}`)

    try {
      const spawnedCmd = childProcess.spawn(config.ffmpeg, cmdParams)
      lockStreamId(streamId, spawnedCmd.pid)

      spawnedCmd.stdout.setEncoding("utf8")
      spawnedCmd.stdout.on('data', (data) => {
        console.log('STDOUT:', data)
      })

      spawnedCmd.stderr.setEncoding("utf8")
      spawnedCmd.stderr.on('data', (data) => {
        console.log('STDERR:', data)

        // wait a moment until the stream ready
        if (data.includes('stream3.ts')) {
          return resolve()
        }
      })

      spawnedCmd.on('close', (code) => {
        releaseStreamId(streamId)
        if (code !== 0) {
          console.log(`Process exited with code ${code}`);
        }
      })

      spawnedCmd.on('end', (code) => {
        releaseStreamId(streamId)
        console.log(`Stream is ended: ${code}`);
      })
    } catch (error) {
      releaseStreamId(streamId)
      console.error(error)
    }
  })
}

const lockStreamId = (streamId: string, pid: number) => {
  console.log(`Locking stream: ${streamId}`)
  runningStreams.push({
    streamId,
    pid
  })
}

const releaseStreamId = (streamId: string) => {
  console.log(`Releasing stream: ${streamId}`)
  // remove from array
  const removeIndex = runningStreams.findIndex(s => s.streamId === streamId)
  runningStreams.splice(removeIndex, 1)
}

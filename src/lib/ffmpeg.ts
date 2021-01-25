/* eslint-disable prefer-promise-reject-errors */
import * as fs from 'fs'
import * as childProcess from 'child_process'

import config from '../config'

interface RunningPid {
  streamId: string,
  pid: number
}
const runningStreams: RunningPid[] = []

export const stopStream = async (streamId: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const runningStream = runningStreams.find(s => s.streamId === streamId)
    if (runningStream) {
      console.log(`Killing previous process PID: ${runningStream}`)
      if (process.kill(runningStream.pid)) {
        releaseStreamId(streamId)
        return resolve(true)
      } else {
        console.log(`Cannot kill pid: ${runningStream.pid}`)
        return resolve(false)
      }
    }
  })
}

export const convertStream = async (streamUrl: string, streamId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // construct output path
    const outputPath = getOutputPath(streamId)
    const fullPath = `${outputPath}/stream.m3u8`

    const runningStream = runningStreams.find(s => s.streamId === streamId)
    if (runningStream) {
      return resolve(fullPath.replace('./public/', ''))
    }

    // https://slhck.info/video/2017/03/01/rate-control.html
    // In H.264 and H.265, CRF ranges from 0 to 51 (like the QP).
    // 23 is a good default for x264, and 28 is the default for x265.
    // 18 (or 24 for x265) should be visually transparent;
    // anything lower will probably just waste file size.

    // construct params
    const cmdParams: string[] = [
      '-i',
      streamUrl,
      '-rtsp_flags',
      'prefer_tcp',
      '-c:v',
      'libx264',
      '-crf',
      '21',
      '-preset',
      'ultrafast',
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
      '2',
      '-hls_delete_threshold',
      '1',
      '-hls_flags',
      'delete_segments',
      '-hls_list_size',
      '30'
    ]

    // GOP = segment length * frame rate
    // our segment is 2s so the value will be 2 * fps
    cmdParams.push('-g')
    // assuming the fps is 24
    cmdParams.push('48')
    // set the output path
    cmdParams.push(fullPath)

    const ffmpegCommand = `${config.ffmpeg} ${cmdParams.join(' ')}`
    console.log(`FFMPEG Command: ${ffmpegCommand}`)

    try {
      const spawnedCmd = childProcess.spawn(config.ffmpeg, cmdParams)
      lockStreamId(streamId, spawnedCmd.pid)

      spawnedCmd.stdout.setEncoding('utf8')
      spawnedCmd.stdout.on('data', (data) => {
        console.log('STDOUT:', data)
      })

      spawnedCmd.stderr.setEncoding('utf8')
      spawnedCmd.stderr.on('data', (data) => {
        console.log('STDERR:', data)
      })

      spawnedCmd.on('close', (code) => {
        releaseStreamId(streamId)
        if (code !== 0) {
          console.log(`Process exited with code ${code}`)
          if (code !== 255) {
            setTimeout(() => {
              convertStream(streamUrl, streamId)
            }, 1000)
          }
        }
      })

      spawnedCmd.on('end', (code) => {
        releaseStreamId(streamId)
        console.log(`Stream is ended: ${code}`)
      })
    } catch (error) {
      releaseStreamId(streamId)
      console.error(error)
      return reject()
    }

    // wait a sec before returning
    setTimeout(() => {
      return resolve(fullPath.replace('./public/', ''))
    }, 1000)
  })
}

const getOutputPath = (streamId: string) => {
  const outputPath = `./public/${streamId}`

  // setup output path
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true })
  }

  return outputPath
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

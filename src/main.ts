import * as core from '@actions/core'
import glob from 'glob'
import fs from 'fs'

function uploadFile(webStore: any, filePath: string): void {
  const myZipFile = fs.createReadStream(filePath)
  webStore.uploadExisting(myZipFile).then((uploadRes: any) => {
    core.debug(uploadRes)
    webStore.publish().then((publishRes: any) => {
      core.debug(publishRes)
    })
  })
}

async function run(): Promise<void> {
  try {
    const filePath = core.getInput('file-path', {required: true})
    const extensionId = core.getInput('extension-id', {required: true})
    const clientId = core.getInput('client-id', {required: true})
    const clientSecret = core.getInput('client-secret', {required: true})
    const refreshToken = core.getInput('refresh-token', {required: true})
    const globFlg = core.getInput('glob') as 'true' | 'false'

    const webStore = require('chrome-webstore-upload')({
      extensionId,
      clientId,
      clientSecret,
      refreshToken
    })

    if (globFlg === 'true') {
      const files = glob.sync(filePath)
      if (files.length > 0) {
        uploadFile(webStore, files[0])
      } else {
        core.setFailed('No files to match.')
      }
    } else {
      uploadFile(webStore, filePath)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()

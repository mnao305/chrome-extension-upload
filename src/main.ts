import * as core from '@actions/core'
import fs from 'fs'
import glob from 'glob'
import chromeWebstoreUpload from 'chrome-webstore-upload'
import axios from 'axios'

function uploadFile(
  webStore: any,
  filePath: string,
  publishFlg: string,
  publishTarget: string
): void {
  const myZipFile = fs.createReadStream(filePath)
  webStore
    .uploadExisting(myZipFile)
    .then((uploadRes: any) => {
      console.log(uploadRes)
      core.debug(uploadRes)

      if (
        uploadRes.uploadState &&
        (uploadRes.uploadState === 'FAILURE' ||
          uploadRes.uploadState === 'NOT_FOUND')
      ) {
        uploadRes.itemError.forEach((itemError: any) => {
          core.error(
            Error(`${itemError.error_detail} (${itemError.error_code})`)
          )
        })
        core.setFailed(
          'upload error - You will need to go to the Chrome Web Store Developer Dashboard and upload it manually.'
        )
        return
      }

      if (publishFlg === 'true') {
        webStore
          .publish(publishTarget)
          .then((publishRes: any) => {
            core.debug(publishRes)
          })
          .catch((e: any) => {
            core.error(e)
            core.setFailed(
              'publish error - You will need to access the Chrome Web Store Developer Dashboard and publish manually.'
            )
          })
      }
    })
    .catch((e: any) => {
      console.log(e)
      core.error(e)
      core.setFailed(
        'upload error - You will need to go to the Chrome Web Store Developer Dashboard and upload it manually.'
      )
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
    const publishFlg = core.getInput('publish') as 'true' | 'false'
    const publishTarget = core.getInput('publish-target')
    const cancelReviewFlg = core.getInput('cancel-review') as 'true' | 'false'
    const publisherId = core.getInput('publisher-id')

    const webStore = chromeWebstoreUpload({
      extensionId,
      clientId,
      clientSecret,
      refreshToken
    })

    if (cancelReviewFlg === 'true') {
      if (!publisherId) {
        core.setFailed('publisher-id is required when cancel-review is true.')
        return
      }
      try {
        const token = await webStore.fetchToken()
        const cancelUrl = `https://chromewebstore.googleapis.com/v2/publishers/${publisherId}/items/${extensionId}:cancelSubmission`
        
        core.info('Attempting to cancel pending review...')
        await axios.post(
          cancelUrl, 
          {}, 
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'x-goog-api-version': '2'
            }
          }
        )
        core.info('Successfully canceled pending review.')
        
      } catch (error: any) {
        // If the error is not "no active submission", we might want to fail or warn.
        // For now, let's log it. If it fails, maybe there was no review to cancel.
        // We'll proceed to upload.
        core.warning(`Failed to cancel review: ${error.message}`)
        if (error.response) {
            core.debug(JSON.stringify(error.response.data))
        }
      }
    }

    if (globFlg === 'true') {
      const files = glob.sync(filePath)
      if (files.length > 0) {
        uploadFile(webStore, files[0], publishFlg, publishTarget)
      } else {
        core.setFailed('No files to match.')
      }
    } else {
      uploadFile(webStore, filePath, publishFlg, publishTarget)
    }
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

run()

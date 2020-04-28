import * as core from '@actions/core'

async function run(): Promise<void> {
  try {
    const filePath = core.getInput('file-path', {required: true})
    const extensionId = core.getInput('extension-id', {required: true})
    const clientId = core.getInput('client-id', {required: true})
    const clientSecret = core.getInput('client-secret', {required: true})
    const refreshToken = core.getInput('refresh-token', {required: true})
    const publishTarget = core.getInput('publish-target', {required: true})
    const glob = core.getInput('glob')
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()

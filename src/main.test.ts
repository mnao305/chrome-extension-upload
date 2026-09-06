import * as core from '@actions/core'
import fs from 'fs'
import {globSync} from 'glob'
import chromeWebstoreUpload from 'chrome-webstore-upload'
import {run} from './main'

jest.mock(
  '@actions/core',
  () => ({
    debug: jest.fn(),
    getInput: jest.fn(),
    setFailed: jest.fn()
  }),
  {virtual: true}
)
jest.mock('fs')
jest.mock('glob')
jest.mock('chrome-webstore-upload', () => jest.fn())

const inputs: {[name: string]: string} = {
  'file-path': 'dist/extension.zip',
  'extension-id': 'extension-id',
  'publisher-id': 'publisher-id',
  'client-id': 'client-id',
  'client-secret': 'client-secret',
  'refresh-token': 'refresh-token',
  glob: 'false',
  publish: 'true'
}

const webStore = {
  fetchToken: jest.fn(),
  uploadExisting: jest.fn(),
  publish: jest.fn()
}

beforeEach(() => {
  jest.resetAllMocks()
  ;(core.getInput as jest.Mock).mockImplementation(
    (name: string) => inputs[name] || ''
  )
  ;(fs.createReadStream as jest.Mock).mockReturnValue({
    path: 'dist/extension.zip'
  })
  ;(globSync as jest.Mock).mockReturnValue(['dist/extension.zip'])
  ;(chromeWebstoreUpload as jest.Mock).mockReturnValue(webStore)

  webStore.fetchToken.mockResolvedValue('access-token')
  webStore.uploadExisting.mockResolvedValue({uploadState: 'SUCCEEDED'})
  webStore.publish.mockResolvedValue({state: 'PENDING_REVIEW'})

  inputs['file-path'] = 'dist/extension.zip'
  inputs.glob = 'false'
  inputs.publish = 'true'
  delete inputs['publish-target']
})

test('uploads and publishes with the v2 publisher ID', async () => {
  await run()

  expect(chromeWebstoreUpload).toHaveBeenCalledWith({
    extensionId: 'extension-id',
    publisherId: 'publisher-id',
    clientId: 'client-id',
    clientSecret: 'client-secret',
    refreshToken: 'refresh-token'
  })
  expect(webStore.fetchToken).toHaveBeenCalledTimes(1)
  expect(webStore.uploadExisting).toHaveBeenCalledWith(
    expect.anything(),
    'access-token',
    60
  )
  expect(webStore.publish).toHaveBeenCalledWith(
    'DEFAULT_PUBLISH',
    'access-token'
  )
  expect(core.setFailed).not.toHaveBeenCalled()
})

test.each(['FAILED', 'NOT_FOUND', 'UPLOAD_STATE_UNSPECIFIED', 'UNKNOWN_STATE'])(
  'does not publish when the upload state is %s',
  async uploadState => {
    webStore.uploadExisting.mockResolvedValue({uploadState})

    await run()

    expect(webStore.publish).not.toHaveBeenCalled()
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining(`upload state "${uploadState}"`)
    )
  }
)

test('does not publish when the library returns an unfinished upload', async () => {
  webStore.uploadExisting.mockResolvedValue({uploadState: 'IN_PROGRESS'})
  await run()
  expect(webStore.publish).not.toHaveBeenCalled()
  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining('upload state "IN_PROGRESS"')
  )
})

test('ignores the publish target and stops after upload when publish is false', async () => {
  inputs.publish = 'false'
  inputs['publish-target'] = 'trustedTesters'

  await run()

  expect(webStore.uploadExisting).toHaveBeenCalledTimes(1)
  expect(webStore.publish).not.toHaveBeenCalled()
  expect(core.setFailed).not.toHaveBeenCalled()
})

test('rejects the legacy trusted testers target before uploading', async () => {
  inputs['publish-target'] = 'trustedTesters'

  await run()

  expect(chromeWebstoreUpload).not.toHaveBeenCalled()
  expect(webStore.uploadExisting).not.toHaveBeenCalled()
  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining('publish-target has been removed')
  )
})

test.each(['PENDING_REVIEW', 'PUBLISHED', 'PUBLISHED_TO_TESTERS'])(
  'accepts the successful publish state %s',
  async publishState => {
    webStore.publish.mockResolvedValue({state: publishState})

    await run()

    expect(core.setFailed).not.toHaveBeenCalled()
  }
)

test.each([
  'STAGED',
  'REJECTED',
  'CANCELLED',
  'ITEM_STATE_UNSPECIFIED',
  'UNKNOWN_STATE',
  undefined
])('reports partial success for publish state %s', async publishState => {
  webStore.publish.mockResolvedValue({state: publishState})

  await run()

  expect(webStore.uploadExisting).toHaveBeenCalledTimes(1)
  expect(webStore.publish).toHaveBeenCalledTimes(1)
  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining(
      `Chrome Web Store returned publish state "${publishState || 'missing'}"`
    )
  )
})

test('uploads the alphabetically first file matched by a glob', async () => {
  inputs.glob = 'true'
  ;(globSync as jest.Mock).mockReturnValue([
    'dist/second.zip',
    'dist/first.zip'
  ])

  await run()

  expect(fs.createReadStream).toHaveBeenCalledWith('dist/first.zip')
})

test('normalizes Windows separators before sorting glob matches', async () => {
  inputs['file-path'] = '**\\*.zip'
  inputs.glob = 'true'
  ;(globSync as jest.Mock).mockReturnValue([
    'dist／extension.zip',
    'dist\\0.zip'
  ])
  const platform = Object.getOwnPropertyDescriptor(process, 'platform')
  Object.defineProperty(process, 'platform', {value: 'win32'})

  try {
    await run()
  } finally {
    Object.defineProperty(process, 'platform', platform as PropertyDescriptor)
  }

  expect(globSync).toHaveBeenCalledWith('**\\*.zip', {
    windowsPathsNoEscape: true
  })
  expect(fs.createReadStream).toHaveBeenCalledWith('dist\\0.zip')
  expect(core.setFailed).not.toHaveBeenCalled()
})

test('sorts glob matches using English collation regardless of the host locale', async () => {
  inputs.glob = 'true'
  ;(globSync as jest.Mock).mockReturnValue(['dist/z.zip', 'dist/ä.zip'])

  await run()

  expect(fs.createReadStream).toHaveBeenCalledWith('dist/ä.zip')
  expect(core.setFailed).not.toHaveBeenCalled()
})

test.each(['linux', 'darwin'])(
  'preserves literal backslashes when sorting glob matches on %s',
  async platformName => {
    inputs['file-path'] = '**/*.zip'
    inputs.glob = 'true'
    ;(globSync as jest.Mock).mockReturnValue([
      'dist/a\\0.zip',
      'dist/a／extension.zip'
    ])
    const platform = Object.getOwnPropertyDescriptor(process, 'platform')
    Object.defineProperty(process, 'platform', {value: platformName})

    try {
      await run()
    } finally {
      Object.defineProperty(process, 'platform', platform as PropertyDescriptor)
    }

    expect(globSync).toHaveBeenCalledWith('**/*.zip', {
      windowsPathsNoEscape: false
    })
    expect(fs.createReadStream).toHaveBeenCalledWith('dist/a／extension.zip')
    expect(core.setFailed).not.toHaveBeenCalled()
  }
)

test('does not publish when the upload request fails', async () => {
  webStore.uploadExisting.mockRejectedValue(new Error('upload rejected'))

  await run()

  expect(webStore.publish).not.toHaveBeenCalled()
  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining('upload error - upload rejected')
  )
})

test('reports partial success when publishing fails', async () => {
  webStore.publish.mockRejectedValue(new Error('publish rejected'))

  await run()

  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining('Upload succeeded, but publishing failed')
  )
})

test('accepts a legacy default target without changing publishing', async () => {
  inputs['publish-target'] = 'default'

  await run()

  expect(webStore.publish).toHaveBeenCalledWith(
    'DEFAULT_PUBLISH',
    'access-token'
  )
  expect(core.setFailed).not.toHaveBeenCalled()
})

test('fails when a glob does not match any files', async () => {
  inputs.glob = 'true'
  ;(globSync as jest.Mock).mockReturnValue([])

  await run()

  expect(webStore.uploadExisting).not.toHaveBeenCalled()
  expect(core.setFailed).toHaveBeenCalledWith('No files to match.')
})

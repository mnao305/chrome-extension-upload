import * as core from '@actions/core'
import chromeWebstoreUpload from 'chrome-webstore-upload'
import axios from 'axios'
import fs from 'fs'
import glob from 'glob'

// Mock dependencies
jest.mock('@actions/core')
jest.mock('chrome-webstore-upload', () => {
    return jest.fn().mockImplementation(() => ({
        fetchToken: jest.fn(),
        uploadExisting: jest.fn(),
        publish: jest.fn()
    }))
})
jest.mock('axios')
jest.mock('fs', () => {
    return {
        createReadStream: jest.fn(),
        promises: {
            access: jest.fn(),
            stat: jest.fn().mockResolvedValue({ isFile: () => true })
        },
        constants: {
            O_RDONLY: 0
        }
    }
})
jest.mock('glob')

// We need to import main to run it, but since it runs on import/execution, 
// we might need to wrap it or use a different approach.
// However, main.ts executes `run()` at the end. 
// A better approach for testing is to modify main.ts to export run, 
// or just mock everything and require it.
// Since I cannot easily modify main.ts structure without breaking things potentially, 
// I will use `jest.isolateModules` to re-require main.ts for each test.

describe('Upload Action', () => {
    let inputs: { [key: string]: string } = {}

    beforeEach(() => {
        jest.clearAllMocks()
        inputs = {
            'file-path': 'test.zip',
            'extension-id': 'test-extension-id',
            'client-id': 'test-client-id',
            'client-secret': 'test-client-secret',
            'refresh-token': 'test-refresh-token',
            'glob': 'false',
            'publish': 'true',
            'publish-target': 'default',
            'cancel-review': 'false',
            'publisher-id': ''
        }

            // Mock core.getInput
            ; (core.getInput as jest.Mock).mockImplementation((name: string) => {
                return inputs[name] || ''
            })

            // Mock chrome-webstore-upload
            ; (chromeWebstoreUpload as unknown as jest.Mock).mockReturnValue({
                fetchToken: jest.fn().mockResolvedValue('mock-access-token'),
                uploadExisting: jest.fn().mockResolvedValue({ uploadState: 'SUCCESS' }),
                publish: jest.fn().mockResolvedValue({ status: ['OK'] })
            })

            // Mock glob
            ; (glob.sync as jest.Mock).mockReturnValue(['test.zip'])

            // Mock fs
            ; (fs.createReadStream as jest.Mock).mockReturnValue('mock-stream')
    })

    // Helper to run the action
    const runAction = async () => {
        jest.isolateModules(async () => {
            await require('./main')
        })
        // Give promises a chance to resolve
        await new Promise(resolve => setTimeout(resolve, 100))
    }

    it('skips cancel review when cancel-review is false', async () => {
        inputs['cancel-review'] = 'false'
        await runAction()

        expect(axios.post).not.toHaveBeenCalled()
    })

    it('fails when cancel-review is true but publisher-id is missing', async () => {
        inputs['cancel-review'] = 'true'
        inputs['publisher-id'] = ''

        await runAction()

        expect(core.setFailed).toHaveBeenCalledWith('publisher-id is required when cancel-review is true.')
        expect(axios.post).not.toHaveBeenCalled()
    })

    it('calls cancelSubmission when cancel-review is true and publisher-id provided', async () => {
        inputs['cancel-review'] = 'true'
        inputs['publisher-id'] = 'test-publisher-id'

        await runAction()

        expect(axios.post).toHaveBeenCalledWith(
            'https://chromewebstore.googleapis.com/v2/publishers/test-publisher-id/items/test-extension-id:cancelSubmission',
            {},
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer mock-access-token',
                    'x-goog-api-version': '2'
                })
            })
        )
        expect(core.info).toHaveBeenCalledWith('Successfully canceled pending review.')
    })

    it('handles cancelSubmission error gracefully', async () => {
        inputs['cancel-review'] = 'true'
        inputs['publisher-id'] = 'test-publisher-id'

            ; (axios.post as jest.Mock).mockRejectedValue(new Error('API Error'))

        await runAction()

        expect(axios.post).toHaveBeenCalled()
        expect(core.warning).toHaveBeenCalledWith('Failed to cancel review: API Error')
        // Should verify it proceeds to upload (which is mocked in this test setup implicitly as main continues)
    })
})

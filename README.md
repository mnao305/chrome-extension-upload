# chrome-extension-upload

This Action allows you to automatically upload and publish browser extensions to the Chrome Web Store.

This action is a wrapper for [chrome-webstore-upload](https://github.com/fregante/chrome-webstore-upload) and uses Chrome Web Store API v2.

## Migrating to v7

- `publisher-id` is now required. Find it under **Publisher > Settings** in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
- `publish-target` has been removed. Remove it from your workflow and configure visibility in the Developer Dashboard. After changing a published item's visibility, publish it once from the Dashboard before using the API again. Legacy `trustedTesters` settings stop the action before uploading when publishing is enabled.

## Input variables

| name           | required | description                                                                                                                                                          |
| -------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| file-path      | true     | The path to the zip file. ex. `dist/hoge.zip`                                                                                                                        |
| extension-id   | true     | The extension ID.                                                                                                                                                    |
| publisher-id   | true     | The publisher ID shown in the Chrome Web Store Developer Dashboard.                                                                                                  |
| client-id      | true     | The OAuth client ID.                                                                                                                                                 |
| client-secret  | true     | The OAuth client secret.                                                                                                                                             |
| refresh-token  | true     | The OAuth refresh token.                                                                                                                                             |
| glob           | false    | If you set it to true, you can specify the file as a glob pattern.<br>Please note that only the alphabetically first match will be uploaded.                         |
| publish        | false    | Defaults to `true`. Set to `false` to upload without publishing. Publishing may require review before the extension becomes available. |

See [Google's guide](https://developer.chrome.com/docs/webstore/using-api) for OAuth setup instructions.

## Usage

Simple example:

```yaml
name: Publish

on:
  push:
    tags:
      - '*'

jobs:
  build:
    name: Publish webextension
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v7
    - uses: actions/setup-node@v7
      with:
        node-version: 24
    - name: Build
      run: |
        npm ci
        npm run build
    - name: Upload and publish
      uses: mnao305/chrome-extension-upload@v7.0.0
      with:
        file-path: dist/file.zip
        extension-id: YOUR_EXTENSION_ID
        publisher-id: YOUR_PUBLISHER_ID
        client-id: ${{ secrets.CLIENT_ID }}
        client-secret: ${{ secrets.CLIENT_SECRET }}
        refresh-token: ${{ secrets.REFRESH_TOKEN }}
```

Example with `glob`:

```yaml
name: Publish

on:
  push:
    tags:
      - '*'

jobs:
  build:
    name: Publish webextension
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v7
    - uses: actions/setup-node@v7
      with:
        node-version: 24
    - name: Build
      run: |
        npm ci
        npm run build
    - name: Upload and publish
      uses: mnao305/chrome-extension-upload@v7.0.0
      with:
        file-path: dist/*.zip
        extension-id: YOUR_EXTENSION_ID
        publisher-id: YOUR_PUBLISHER_ID
        client-id: ${{ secrets.CLIENT_ID }}
        client-secret: ${{ secrets.CLIENT_SECRET }}
        refresh-token: ${{ secrets.REFRESH_TOKEN }}
        glob: true
```

Example: upload without publishing:

```yaml
name: Test

on:
  push:
    tags:
      - '*'

jobs:
  build:
    name: Upload webextension
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v7
    - uses: actions/setup-node@v7
      with:
        node-version: 24
    - name: Build
      run: |
        npm ci
        npm run build
    - name: Upload
      uses: mnao305/chrome-extension-upload@v7.0.0
      with:
        file-path: dist/file.zip
        extension-id: YOUR_EXTENSION_ID
        publisher-id: YOUR_PUBLISHER_ID
        client-id: ${{ secrets.CLIENT_ID }}
        client-secret: ${{ secrets.CLIENT_SECRET }}
        refresh-token: ${{ secrets.REFRESH_TOKEN }}
        publish: false
```

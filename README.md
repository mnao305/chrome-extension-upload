# chrome-extension-upload

This Action allows you to automatically upload and publish browser extensions to the Chrome web store.

This action is a wrapper for [chrome-webstore-upload](https://github.com/fregante/chrome-webstore-upload).

## Input variables

| name          | required | description                                                                                                                                                          |
| ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| file-path     | true     | The path to the zip file. ex) `dist/hoge.zip`                                                                                                                        |
| extension-id  | true     |                                                                                                                                                                      |
| client-id     | true     |                                                                                                                                                                      |
| client-secret | true     |                                                                                                                                                                      |
| client-secret | true     |                                                                                                                                                                      |
| refresh-token | true     |                                                                                                                                                                      |
| glob          | false    | If you set it to true, you can specify the file as a glob pattern.<br>Please note that only the first match will be uploaded.                                        |
| publish       | false    | If you set it to false, the extension will not be published. Default as true.<br>Use this option if you want to upload the extension but not publish it for testing. |

Want to know how to make a CLIENT ID, etc.?  
[Reference link](https://github.com/DrewML/chrome-webstore-upload/blob/master/How%20to%20generate%20Google%20API%20keys.md)

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
    - uses: actions/checkout@v1
    - uses: actions/setup-node@v1
      with:
        node-version: 12
    - name: Build
      run: |
        npm ci
        npm run build
    - name: Upload & release
      uses: mnao305/chrome-extension-upload@v4.0.1
      with:
        file-path: dist/file.zip
        extension-id: hogefuga(extension id)
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
    - uses: actions/checkout@v1
    - uses: actions/setup-node@v1
      with:
        node-version: 12
    - name: Build
      run: |
        npm ci
        npm run build
    - name: Upload & release
      uses: mnao305/chrome-extension-upload@v4.0.1
      with:
        file-path: dist/*.zip
        extension-id: hogefuga(extension id)
        client-id: ${{ secrets.CLIENT_ID }}
        client-secret: ${{ secrets.CLIENT_SECRET }}
        refresh-token: ${{ secrets.REFRESH_TOKEN }}
        glob: true
```

Example with `publish` for testing:

```yaml
name: Test

on:
  push:
    tags:
      - '*'

jobs:
  build:
    name: Publish webextension
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v1
    - uses: actions/setup-node@v1
      with:
        node-version: 12
    - name: Build
      run: |
        npm ci
        npm run build
    - name: Upload & release
      uses: mnao305/chrome-extension-upload@v4.0.1
      with:
        file-path: dist/file.zip
        extension-id: hogefuga(extension id)
        client-id: ${{ secrets.CLIENT_ID }}
        client-secret: ${{ secrets.CLIENT_SECRET }}
        refresh-token: ${{ secrets.REFRESH_TOKEN }}
        publish: false
```

Example with `publish-target` for publishing to `trustedTesters`:

```yaml
name: Test

on:
  push:
    tags:
      - '*'

jobs:
  build:
    name: Publish webextension
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v1
    - uses: actions/setup-node@v1
      with:
        node-version: 12
    - name: Build
      run: |
        npm ci
        npm run build
    - name: Upload & release
      uses: mnao305/chrome-extension-upload@v4.0.1
      with:
        file-path: dist/file.zip
        extension-id: hogefuga(extension id)
        client-id: ${{ secrets.CLIENT_ID }}
        client-secret: ${{ secrets.CLIENT_SECRET }}
        refresh-token: ${{ secrets.REFRESH_TOKEN }}
        publish-target: trustedTesters

```

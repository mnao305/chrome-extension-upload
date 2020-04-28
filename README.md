# chrome-extension-upload
upload & publish extensions to the Chrome Web Store.

## Input variables

You must provide:

- `file-path`
  - The path to the zip file. ex) `dist/hoge.zip`
- `extension-id`
- `client-id`
- `client-secret`
- `refresh-token`

Optional Arguments

 - `glob`
   - It's still not working right now.

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
      uses: mnao305/chrome-extension-upload@1.0.0
      with:
        file-path: dist/file.zip
        extension-id: hogefuga(extension id)
        client-id: ${{ secrets.CLIENT_ID }}
        client-secret: ${{ secrets.CLIENT_SECRET }}
        refresh-token: ${{ secrets.REFRESH_TOKEN }}
```

Want to know how to make a CLIENT ID, etc.?  
[Reference link](https://github.com/DrewML/chrome-webstore-upload/blob/master/How%20to%20generate%20Google%20API%20keys.md)

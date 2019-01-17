# Vanta frontend screen

## Running

Check out this repository, run `npm install` and then `npm start`

The server will be available at`localhost:3000`

## API

Information about the API is available in `main.ts` -- you shouldn't need to read further than that file, but the source is available for you.

Some useful details:

* Adding or setting url details will return `{ ok: boolean, retryable: boolean }` -- if `ok` is `false` and `retryable` is `true`, the error is transient and you should retry

* Screenshots can take time to capture, and may not be ready immediately

* 

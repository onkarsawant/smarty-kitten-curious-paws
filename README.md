# Smarty Kitten Curious Paws

This is Smarty the Kitten .

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/edb59c49-d7f4-47f0-b25a-57c070ec94bf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Run in Docker

Build the image and run the container:

```sh
docker build -t smarty-kitten .
docker run --rm -p 3000:3000 smarty-kitten
```

Then open http://localhost:3000. The image builds the app as a standalone Node server (`NITRO_PRESET=node-server`) and serves it with `node .output/server/index.mjs`. Change the port with `-e PORT=<port>` and `-p <port>:<port>`.


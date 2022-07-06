<img width="32" src="/favicon.svg" />

[<strong>0x55</strong>](https://0x55.netlify.app) is an image editor for 5x5 binary sprites.

The pixels of the images are encoded as bits in [row-major order](https://en.wikipedia.org/wiki/Row-_and_column-major_order). This makes them ideal for embedding directly into source code for emulators, games, and retro user interfaces.

Unlike conventional images, you'll need to write some code to render these sprites.

```ts
let sprite = 0x7FF8FEBF;

for (let y = 0; y < 5; y++) {
  for (let x = 0; x < 5; x++) {
    let bit = 1 & (sprite >> x + y * 5);
    setPixel(x, y, bit);
  }
}
```

For a canvas `setPixel` could call `ctx.fillRect`, or perhaps set pixels directly on `imageData`.


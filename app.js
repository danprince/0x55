const width = 5;
const height = 5;
const radix = 16;
const isMac = /Mac/.test(navigator.platform);
const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
const initialSprites = [17974417,22369621,8895426,15728366,33553983,33554431,22730421,32537631,4685819,15400945,2147024575,15039940,2129188398,4685252,10976718,10976708,9044037,328000,15396526,4540074,4685802,18157905,15396526,8796552,2308290,21716692,5698981,10824010,30438429,29215326,7590276,2607631,18299876,4347332,4674692,4291652,4488452,15713855,22695175,17245478,4488388,33553742,33553486,15154043,8862152,4972260,28490632,33522659,16235627,4208671,11371370,28869179,2269696,15724526,29200721,15716206,32969166,15025476,33081322,15259300,9422399,4198670,4198532,10634564,4539530,4357258,15012174,1030272,146400,762592,29197179,22696464,25301761,15018318,4329668,14749966,14946574,4691012,14956622,15022158,4329742,15022414,8665422,10828100,6633798,12650572,15288910,14760014,2177102,14988334,9747753,14815374,7508110,10819914,14747714,18405233,9745769,6595878,2194014,23373094,9616687,16006191,4329631,6595881,4532785,10835633,9738441,4329809,15763599,32652260,9405410,32066508,4685678,486848,1047583,19286977,17145262,33522340,14832789,10972618,359744,33095359,32538052,24239359,33093437,33423227,9382370,27070835,33553546,9253704,15583214,15714158,15591278,15585134,33539524,29214254,30213219,4340586,9437183,33344152,15714286,33543743,14843012,11047466,15622924,18125951,18436895,15658734,32471106,1048014,4357252,31744,4226052,1016800,23068334,10959310,786144,14815935,33095118,14842533,33095662,32066512,12995148,8521864,2236546,33413088,5224900,7460636,15018980,28873275,2193862,11512810,32996831,917034,18860017,21504,0x7FFDD7F1,0x488224,0x1F9125F];

/**
 * @typedef {"idle" | "drawing" | "erasing"} Mode
 */

function init() {
  return {
    width,
    height,
    editing: parseHash(),
    sprite: parseHash(),
    sprites: loadSprites(),
    initialSprites,
    randomSprites: generateRandomSprites(100),
    mode: "idle",
    showExports: true,
  };
}

/**
 * @param {number} sprite
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function getBit(sprite, x, y) {
  return Boolean(sprite >> (x + y * width) & 1);
}

/**
 * @param {number} sprite
 * @param {number} x
 * @param {number} y
 * @param {boolean} state
 */
function setBit(sprite, x, y, state) {
  let mask = 1 << (x + y * width);
  return state ? sprite | mask : sprite & ~mask;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} sprite
 */
function render(canvas, sprite) {
  let ctx = canvas.getContext("2d");
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  if (isDarkMode) imageData.data.fill(0xFF);

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      let bit = getBit(sprite, x, y);
      let pos = (x + y * canvas.width) * 4;
      imageData.data[pos + 3] = bit ? 0xFF : 0x00;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * @param {PointerEvent} event 
 * @returns {[x: number, y: number]}
 */
function eventToGrid(event) {
  let canvas = event.target;

  if (canvas instanceof HTMLCanvasElement) {
    let bounds = canvas.getBoundingClientRect();
    let scaleX = canvas.width / bounds.width;
    let scaleY = canvas.height / bounds.height;
    let gridX = Math.floor((event.clientX - bounds.x) * scaleX);
    let gridY = Math.floor((event.clientY - bounds.y) * scaleY);
    return [gridX, gridY];
  } else {
    return [0, 0];
  }
}

/**
 * @param {PointerEvent} event
 * @param {number} sprite 
 * @returns {boolean}
 */
function sample(event, sprite) {
  let [x, y] = eventToGrid(event);
  return getBit(sprite, x, y);
}

/**
 * @param {PointerEvent} event
 * @param {number} sprite
 * @param {Mode} mode
 * @returns {number}
 */
function paint(event, sprite, mode) {
  if (mode === "idle") {
    return sprite;
  } else {
    let [x, y] = eventToGrid(event);
    return setBit(sprite, x, y, mode === "drawing");
  }
}

/**
 * @returns {number}
 */
function random() {
  let sprite = 0;
  let mirrorX = Math.random() < 0.75;
  let mirrorY = Math.random() < (mirrorX ? 0.25 : 0.75);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (Math.random() > 0.7) {
        sprite = setBit(sprite, x, y, true);
        if (mirrorX) sprite = setBit(sprite, width - x - 1, y, true);
        if (mirrorY) sprite = setBit(sprite, x, height - y - 1, true);
      }
    }
  }

  return sprite;
}

/**
 * @param {number} count
 * @returns {number[]}
 */
function generateRandomSprites(count) {
  let sprites = [];
  for (let i = 0; i < count; i += 2) {
    let sprite = random();
    sprites.push(sprite);
    sprites.push(invert(sprite));
  }
  return sprites;
}

/**
 * @param {number} number 
 * @returns {number}
 */
function invert(number) {
  let mask = 2 ** 31 - 1;
  return ~number & mask;
}

/**
 * @param {number} sprite
 * @param {boolean} horizontal
 * @returns {number}
 */
function flip(sprite, horizontal) {
  let out = 0;

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let bit = getBit(sprite, x, y);
      if (horizontal) {
        out = setBit(out, width - x - 1, y, bit);
      } else {
        out = setBit(out, x, height - y - 1, bit);
      }
    }
  }

  return out;
}

/**
 * @param {number} sprite
 * @returns {number}
 */
function flipHorizontal(sprite) {
  let out = 0;

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let bit = getBit(sprite, x, y);
      out = setBit(out, width - x - 1, y, bit);
    }
  }

  return out;
}

/**
 * @returns {number}
 */
function parseHash() {
  return decode(location.hash.slice(1)) || 0;
}

/**
 * @param {number} sprite
 */
function setHash(sprite) {
  history.replaceState(null, "", `#${encode(sprite)}`);
}

/**
 * @returns {number[]}
 */
function loadSprites() {
  return (localStorage.savedSprites || "")
    .split(",")
    .map(decode)
    .filter(sprite => sprite)
}

/**
 * @param {number[]} sprites
 */
function saveSprites(sprites) {
  localStorage.setItem("savedSprites", sprites.map(encode).join(","));
}

/**
 * @param {number} editing
 * @param {number} sprite
 * @param {number[]} sprites
 */
function save(editing, sprite, sprites) {
  let index = sprites.indexOf(editing);
  let exists = index >= 0;
  let empty = sprite === 0;

  if (exists && empty) {
    sprites.splice(index, 1); // delete
  } else if (exists) {
    sprites[index] = sprite; // overwrite
  } else {
    sprites.push(sprite); // create
  }

  return sprites;
}

/**
 * @param {number} sprite
 * @returns {string}
 */
function encode(sprite) {
  return "0x" + sprite.toString(radix).toUpperCase();
}

/**
 * @param {string} string
 * @returns {number}
 */
function decode(string) {
  return parseInt(string, radix) || 0;
}

// Keep a permanent canvas around for makeSpriteLink
let _canvas = document.createElement("canvas");
let _ctx = _canvas.getContext("2d");
_canvas.width = width;
_canvas.height = height;

/**
 * Turns out it's much faster to generate data urls and use images than to
 * render each sprite on its own canvas.
 * @param {number} sprite
 * @returns {string}
 */
function toDataUrl(sprite) {
  _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
  render(_canvas, sprite);
  return _canvas.toDataURL();
}

/**
 * Converts a sprite to an SVG.
 * @param {number} sprite 
 * @returns {string}
 */
function toSVG(sprite) {
  let path = [];

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let bit = getBit(sprite, x, y);
      if (bit) {
        path.push(`M${x} ${y}h1v1H${x}z`);
      }
    }
  }

  let fill = isDarkMode ? ` fill="white"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 5" shape-rendering="crispEdges"${fill}><path d="${path.join("")}"/></svg>`;
}

/**
 * @param {number} sprite 
 */
function setFavicon(sprite) {
  let link = document.querySelector("link[rel=icon]");
  let svg = toSVG(sprite);
  let url = `data:image/svg+xml;base64,${btoa(svg)}`;
  link.setAttribute("href", url);
}

/**
 * @param {number} sprite
 */
function toDataURL(sprite) {
  let canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  render(canvas, sprite);
  return canvas.toDataURL();
}

/**
 * @param {number} sprite
 */
function savePNG(sprite) {
  let url = toDataURL(sprite);
  let name = `${encode(sprite)}.png`;
  download(name, url);
}

/**
 * @param {number} sprite
 */
function saveSVG(sprite) {
  let svg = toSVG(sprite);
  let blob = new Blob([svg], { type: "text/svg" });
  let url = URL.createObjectURL(blob);
  let name = `${encode(sprite)}.svg`;
  download(name, url);
  URL.revokeObjectURL(url);
}

/**
 * @param {string} fileName
 * @param {string} url
 */
function download(fileName, url) {
  let a = document.createElement("a");
  a.download = fileName;
  a.href = url;
  document.body.append(a);
  a.click();
  a.remove();
}

export function iterateImageData(image: ImageData, iterator: (point: { x: number, y: number }, color: { r: number, g: number, b: number, a: number }) => void) {
    const channels = 4;
    const color = { r: 0, g: 0, b: 0, a: 0 };
    if (channels * image.width * image.height !== image.data.length) {
        throw new Error('Invalid image data');
    }
    image.data.forEach((value, index) => {
        const x = Math.floor(index / channels) % image.width;
        const y = Math.floor((index / channels) / image.width);
        const chan = index % channels;
        switch (chan) {
            case 0: color.r = value; break;
            case 1: color.g = value; break;
            case 2: color.b = value; break;
            case 3:
                color.a = value;
                iterator({ x, y }, { ...color });
                break;
        }
    });
}

export function isEqualColor(a: { r: number, g: number, b: number, a: number }, b: { r: number, g: number, b: number, a: number }) {
    return a.r == b.r && a.g == b.g && a.b == b.b && a.a == b.a;
}

export function getMapFromImageData(data: ImageData) {
    const map = generateEmptyMap(data.width, data.height, Number.MAX_SAFE_INTEGER);
    iterateImageData(data, (pos, color) => {
        let mapColor = 0;
        if (isEqualColor(color, { r: 255, g: 255, b: 0, a: 255 })) {
            mapColor = 1;
        } else if (isEqualColor(color, { r: 255, g: 0, b: 0, a: 255 })) {
            mapColor = 2;
        } else if (isEqualColor(color, { r: 0, g: 255, b: 0, a: 255 })) {
            mapColor = 3;
        } else if (isEqualColor(color, { r: 0, g: 0, b: 255, a: 255 })) {
            mapColor = 4;
        }
        map[pos.x][pos.y] = mapColor;
        map[pos.x][pos.y] = mapColor;
    });
    return map;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        let image = new Image();
        image.onload = () => {
            resolve(image)
        }
        image.onerror = (ev) => {
            reject(ev);
        }
        image.src = src;
    });
}

export function getImageData(image: HTMLImageElement) {
    let canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    let context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Canvas context is not available.');
    }
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height);
}

export function generateEmptyMap(width: number, height: number, val: number) {
    const map: Array<Array<number>> = [];
    for (let i = 0; i < height; i++) {
        const row: Array<number> = [];
        for (let j = 0; j < width; j++) {
            row.push(val);
        }
        map.push(row);
    }
    return map;
}

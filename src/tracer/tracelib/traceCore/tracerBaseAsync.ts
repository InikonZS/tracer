import { IVector, Vector } from "../../../common/vector";
import { findPath, iteration } from "./tracerBase";

export function* indexGenerator(map: Array<Array<number>>, points: Array<{ x: number, y: number }>, generation: number) {
    let gen = generation;
    let nextPoints = points;
    do {
        nextPoints = iteration(map, nextPoints, gen);
        gen += 1;
        yield { generation: gen, points: nextPoints };
    } while (nextPoints.length);
    return { gen };
}

export function indexateAsync(map: Array<Array<number>>, points: Array<{ x: number, y: number }>, generation: number, onFinish: () => void, startTime?: number) {
    let gen = indexGenerator(map, points, generation);
    let res: IteratorResult<{ generation: number; points: { x: number; y: number; }[]; }> | null = null;

    const chunkLength = 300;
    for (let i = 0; i < chunkLength; i++) {
        res = gen.next();
        if (res.done) {
            break;
        }
    }
    if (!res){
        throw new Error('Generator error.');
    }
    if (res.done) {
        onFinish();
    } else {
        setTimeout(() => {
            if (!res){
                throw new Error('Generator error.');
            }
            indexateAsync(map, res.value.points, res.value.generation, onFinish, startTime);
        }, 0);
    }
}


export function tracePath(map: Array<Array<number>>, indexPoint: IVector, destination: IVector, onFinish: (path: Array<Vector> | null) => void) {
    let mp = map.map(it => it.map(jt => jt == 0 ? Number.MAX_SAFE_INTEGER : -1));
    indexateAsync(mp, [indexPoint], 0, () => {
        const path = findPath(mp, Vector.fromIVector(indexPoint), Vector.fromIVector(destination));
        onFinish(path);
    }, Date.now())
}

export function tracePathes(map: Array<Array<number>>, indexPoint: IVector, destinations: Array<IVector>, onFinish: (pathes: Array<Array<Vector>>) => void) {
    const pathes: Array<Array<Vector>> = [];
    let mp = map.map(it => it.map(jt => jt == 0 ? Number.MAX_SAFE_INTEGER : -1));
    indexateAsync(mp, [indexPoint], 0, () => {
        destinations.forEach(destination => {
            const path = findPath(mp, Vector.fromIVector(indexPoint), Vector.fromIVector(destination));
            if (path) {
                pathes.push(path);
            }
        });
        onFinish(pathes);
    }, Date.now())
}

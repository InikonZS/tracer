import { Vector } from "../../../common/vector";
import { indexate } from "./tracerBase";

export type Array2d = Array<Array<number>>;
export const maxValue = Number.MAX_SAFE_INTEGER

export function getEmptyIndexationMap(map: Array2d): Array2d {
    const indexationMap = map.map(row => row.map(cell => cell == 0 ? maxValue : -1));
    return indexationMap;
}

/**
 * 
 * @param map Game map, -1 is obstacle, 0 is empty point.
 * @returns New map, -1 is obstacle, -2, -3.. is indexes of isolated areas.
 */
export function getIsolated(map: Array2d):Array2d {
    const indexationMap = getEmptyIndexationMap(map);
    let currentId = 0;
    indexationMap.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell == maxValue) {
                currentId += 1;
                const nextMap = getAreaFromPoint(indexationMap, new Vector(x, y), -currentId - 1);
                if (!nextMap) {
                    return;
                }
                indexationMap.forEach((row, y) => {
                    row.forEach((cell, x) => {
                        row[x] = nextMap[y][x];
                    })
                });
            }
        })
    })
    return indexationMap;

}


/**
 * 
 * @param indexationMap Map to wave indexation, -1 is obstacle, maxValue is empty.
 * @param indexPoint Point from indexation should be started.
 * @param areaId Start area id, -2 as default.
 * @returns New Array2d with area filled by area id values or null if no one points was indexed.
 */
export function getAreaFromPoint(indexationMap: Array2d, indexPoint: Vector, areaId: number):Array2d | null {
    let isFound = false;
    indexate(indexationMap, [indexPoint], 0);

    //fix, initial isnt indexed
    if (indexationMap[indexPoint.y][indexPoint.x] > -1) {
        indexationMap[indexPoint.y][indexPoint.x] = areaId;
    }

    const resultMap = indexationMap.map(row => row.map(cell => {
        if (cell != maxValue && cell > -1) {
            isFound = true;
            return areaId;
        } else {
            return cell;
        }
    }));

    return isFound ? resultMap : null
}
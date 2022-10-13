import { IVector, Vector } from "../../common/vector";
import { iteration } from "./traceCore/tracerBase";
import { Array2d, maxValue } from "./traceCore/traceTools";
import { checkMap } from "./building";

interface IBuilding{
    pos:Vector, 
    mask:Array2d
}

function flatBuildingsPlaces(buildings: Array<IBuilding>) {
    const pts: Vector[] = [];
    buildings.forEach(bld => {
        bld.mask.map((row, y) => {
            row.forEach((cell, x) => {
                if (cell != 0) {
                    pts.push(new Vector((bld.pos.x + x), (bld.pos.y + y)))
                }
            })
        })
    })
    return pts;
}

function filterAvailablePlaces(positions: Array<Vector>, mpb: Array2d, mpc: Array2d, mask:Array2d){
    const result = positions.filter(it=>{
        try{
        const bld = checkMap(mpb, mask, it);
        const blc = checkMap(mpc, mask, it);
        return (-1 ==(bld.findIndex(it=> -1 != it.findIndex(jt=> jt == 1))) && -1 !=(blc.findIndex(it=> -1 != it.findIndex(jt=> jt == 1))))
        } catch(e){
            return false;
        }
    })
    return result;
}

function getMapsAndPositions(map: Array2d, points: Array<Vector>) {
    const positions: Vector[] = [];
    const mpb = map.map(it => it.map(jt => jt));
    const mpc = map.map(it => it.map(jt => 0));
    const ind = indexateAround(map.map(it => it.map(jt => jt == 0 ? maxValue : -1)), points, 0, (indexated, gen) => {

        indexated.forEach(it => {
            const canvasRow = map[it.y]//this.canvas.canvasBack[(it.y)];
            if (canvasRow) {
                if (gen <= 5) {
                    //canvasRow[(it.x)] = '#225';
                    mpc[it.y][it.x] = 1;
                }
                if (gen <= 1) {
                    //canvasRow[(it.x)] = '#f25';
                    mpb[it.y][it.x] = 1;
                }
                positions.push(Vector.fromIVector(it));
            }
        })
    });
    return { ind, mpb, mpc, positions }
}

export function getBuildingPoints(map:Array2d, buildings:Array<IBuilding>, mask: Array2d){
    const builded = flatBuildingsPlaces(buildings);
    const {ind, mpc, mpb, positions} = getMapsAndPositions(map, builded);
    const result = filterAvailablePlaces(positions, mpb, mpc, mask);
    return result;
}

export function indexateAround(map:Array<Array<number>>, points:Array<{x:number, y:number}>, generation:number, onIterate:(pts:IVector[], gen:number)=>void):IVector[] | null{
    const nextPoints = iteration(map, points, generation);
    onIterate(nextPoints, generation);
    if (generation>=10){
        return nextPoints;
    }

    if (!points.length) { return null; }
    return indexateAround(map, nextPoints, generation+1, onIterate);
  }
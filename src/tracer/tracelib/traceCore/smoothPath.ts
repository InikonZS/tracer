import { Vector } from "../../../common/vector";
import { getPathBreaks } from "./findChunkPath";
import { tileLine } from "./tileLine";
import { Array2d } from "./traceTools";

const debug = false;

export function smoothPath(path:Vector[], map:Array2d){
    let currentPoint = 0;
    if (path.length<2){
        return path;
    }
    let smPath:Vector[] = [path[0]];
        for (let j=1; j<path.length; j++){
            let intersected = false;
            const res = tileLine(path[currentPoint], path[j], (x, y)=>{
                if (map[Math.floor(y)][Math.floor(x)] !=0 ){
                    intersected = true;
                }
            });
            if (intersected){
                currentPoint = j-1;
                intersected = false;
                smPath.push(path[j-1]);
            }
        }
        smPath.push(path[path.length-1])
        
    const outPath: Vector[] = [];
    smPath.forEach((pth, i)=>{
        if (i>0){ 
            const res = tileLine(smPath[i-1], smPath[i], (x, y)=>{
                outPath.push(new Vector(x, y));
            });
        }
    })
    if (debug){
        const breaks = getPathBreaks(outPath, map);
        if (breaks.length){
            console.log('Path breaked ', breaks);
        }
    }
    return outPath;
}
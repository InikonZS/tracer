import Control from "../../common/control";
import { IVector, Vector } from '../../common/vector';
import { Canvas } from "../../tracer/testenv/canvasRenderer";
import { RenderTicker } from '../../tracer/testenv/ticker';
import { getImageData, getMapFromImageData, loadImage } from "../../tracer/tracelib/imageDataTools";
import mapFile from '../../tracer/testenv/assets/map4.png';
import {checkMap} from '../../tracer/tracelib/building';
import { iteration } from "../../tracer/tracelib/traceCore/tracerBase";
import { Array2d, maxValue } from "../../tracer/tracelib/traceCore/traceTools";


const mapSize = 256;

const mask = [
    [0, 0, 0, 0],
    [0, 1, 1, 0],
    [1, 1, 1, 1],
    [1, 1, 1, 1]
]

class Building{
    pos: Vector;
    mask = mask;
    
    constructor(pos:Vector){
        this.pos = pos;
    }
}

export class MiniMapTestScene {
    private canvas: Canvas;
    private map: Array<Array<number>>;

    /*building: Array<Array<number>> = mask;*/
    pos: Vector = new Vector(0, 0);
    buildings: Array<Building> = [];
    tileSize = 4;
    mpb: number[][];
    mpc: number[][];
    buildPositions: Vector[];

    destroy(){
        this.canvas.destroy();
    }

    constructor(parentNode: HTMLElement) {
        this.canvas = new Canvas(parentNode, this.render, mapSize);
        this.canvas.onMove = (e)=>{
            this.pos = new Vector(Math.floor(e.offsetX / this.tileSize), Math.floor(e.offsetY / this.tileSize));
        }
        this.build().then(_=>{
            this.canvas.startRender();
        });
    }

    async build() {
        this.map = fill2d1(256);
        const image = await loadImage(mapFile);
        const map = getMapFromImageData(getImageData(image));
        this.map = map;
        this.mpb = map.map(it=> it.map(jt=>jt));
        this.mpc = map.map(it=> it.map(jt=>0));
        //this.mpc[30][30] = 1;
        const rnd = new Vector(Math.floor(Math.random() * mapSize), Math.floor(Math.random() * mapSize));
        const building = new Building(rnd);
        this.buildings.push(building)
    }

    renderMap(canvas:Canvas, delta:number){
        this.map.forEach((row, y)=>{
            row.forEach((cell, x)=>{
                canvas.canvasBack[(y)][(x)] = ['#000','#090', '#ff0', '#f0f', '#574'][cell];
            })
        })
    }

    renderBuilding(building_: Building, canvas:Canvas, delta:number){
        const building = checkMap(this.map, building_.mask, building_.pos);
        building.forEach((row, y)=>{
            row.forEach((cell, x)=>{
                if (building_.mask[y][x] != 0){
                    const canvasRow = canvas.canvasBack[(building_.pos.y + y)];
                    if (canvasRow){
                        canvasRow [(building_.pos.x + x)] = ['#09f', '#f00'][cell];
                    }
                }
            })
        })
    }

    render = (ctx: CanvasRenderingContext2D, delta:number)=>{
        const tileSize = 3;
        if (this.map){

            const bp = getBuildingPoints(this.map, this.buildings);
            const rnp = bp[Math.floor(Math.random() * bp.length)];
            if (rnp){
                const building = new Building(rnp);
                this.buildings.push(building);
            }
            
            this.renderMap(this.canvas, delta);
           
            //const rnd = new Vector(Math.floor(Math.random() * mapSize), Math.floor(Math.random() * mapSize));
            const rnv = Math.random()<0.95;
                this.buildings = this.buildings.filter(it=> Math.random()<0.95);
            try {
                const rnd1 = this.buildPositions[Math.floor(Math.random() * this.buildPositions.length)];
                
                const rndAr = this.buildPositions.filter(it=>{
                    try{
                    const bld = checkMap(this.mpb, mask, it);
                    const blc = checkMap(this.mpc, mask, it);
                    return (-1 ==(bld.findIndex(it=> -1 != it.findIndex(jt=> jt == 1))) && -1 !=(blc.findIndex(it=> -1 != it.findIndex(jt=> jt == 1))))
                    } catch(e){
                        return false;
                    }
                })
                const rnd = rndAr[Math.floor(Math.random() * rndAr.length)];
                const bld = checkMap(this.mpb, mask, rnd);
                const blc = checkMap(this.mpc, mask, rnd);
                if (-1 ==(bld.findIndex(it=> -1 != it.findIndex(jt=> jt == 1))) && -1 !=(blc.findIndex(it=> -1 != it.findIndex(jt=> jt == 1)))){
                    const building = new Building(rnd)
                    //this.buildings.push(building);
                    
                    /*building.mask.forEach((row, y)=>{
                        row.forEach((cell, x)=>{
                            if (cell!=0){
                                const canvasRow = this.mpb[(building.pos.y + y)];
                                if (canvasRow){
                                    canvasRow[(building.pos.x + x)] = 1;
                                }
                            }
                        })
                    })*/
                }
                
                /*const rem = this.buildings.filter(it=> !(rnv));
                rem.forEach(building=>{
                    building.mask.forEach((row, y)=>{
                        row.forEach((cell, x)=>{
                            if (cell!=0){
                                const canvasRow = this.mpb[(building.pos.y + y)];
                                if (canvasRow){
                                    canvasRow[(building.pos.x + x)] = 0;
                                }
                            }
                        })
                    })
                })*/
            } catch(e){
                //console.log('not builded')
            }

            const pts: Vector[] = [];
            this.buildings.forEach(bld=>{
                const vct = bld.mask.map((row, y)=>{
                    return row.map((cell, x)=>{
                        if (cell!=0){
                            //const canvasRow = this.mpb[(building.pos.y + y)];
                            //if (canvasRow){v
                            pts.push(new Vector((bld.pos.x + x), (bld.pos.y + y)))   
                           // }
                        }
                    })
                })
                //indexate 
                
            })
            if (pts.length){
            this.buildPositions = [];
            this.mpb = this.map.map(it=> it.map(jt=>jt));
            this.mpc = this.map.map(it=> it.map(jt=>0));
             const ind = indexateAround(this.map.map(it=> it.map(jt=> jt == 0 ? maxValue : -1)), pts,0, (ind, gen)=>{
                
                ind.forEach(it=>{
                    const canvasRow = this.canvas.canvasBack[(it.y)];
                    if (canvasRow){
                        if (gen<=5){
                            canvasRow[(it.x)] = '#225';
                            this.mpc[it.y][it.x] = 1;
                        }
                        if (gen<=1){
                            canvasRow[(it.x)] = '#f25';
                            this.mpb[it.y][it.x] = 1;
                        }
                        this.buildPositions.push(Vector.fromIVector(it));
                    }
                }) 
                }); 
                
                ind && ind.forEach(it=>{
                        const canvasRow = this.canvas.canvasBack[(it.y)];
                        if (canvasRow){
                            canvasRow[(it.x)] = '#55f';
                        }
                    }) 
                }

            this.buildings.forEach(building=>{
                this.renderBuilding(building, this.canvas, delta);
            })
            

            
            
            /*const newMap = this.map.map((row, y)=>{
                return row.map((cell, x)=>{
                    return Math.random() < 0.01 ? 1 : (Math.random() < 0.01 ? 0 : row[x]);
                })
            })*/


            this.visualize();
            
            //this.map = newMap;
        }

    }
    visualize(){
        const tileSize = this.tileSize;
        const ctx = this.canvas.ctx;
        this.canvas.canvasBack.forEach((row, y)=>{
            row.forEach((cell, x)=>{ 
                if (this.canvas.canvasBackLast[y][x] !== this.canvas.canvasBack[y][x]){
                    ctx.fillStyle = this.canvas.canvasBack[y][x];
                    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                }
            })
        })
        this.canvas.canvasBackLast = this.canvas.canvasBack.map(it=>[...it]);
    }
}

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

function filterAvailablePlaces(positions: Array<Vector>, mpb: Array2d, mpc: Array2d){
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

function getBuildingPoints(map:Array2d, buildings:Array<IBuilding>){
    const builded = flatBuildingsPlaces(buildings);
    const {ind, mpc, mpb, positions} = getMapsAndPositions(map, builded);
    const result = filterAvailablePlaces(positions, mpb, mpc);
    return result;
}

function fill2d1(iterations: number){
    const arr:Array<Array<number>> = new Array(iterations);
    for (let i = 0; i< iterations; i++){
        const row = new Array(iterations);
        for (let j = 0; j< iterations; j++){
            row[j] = 0;
        }
        arr[i] = row;
    }
    return arr;
}

function showTime(func: Function, args: Array<any>, iterations:number = 1, text:string) {
    const startTime = Date.now();
    for (let i = 0; i< iterations; i++){
       func(...args); 
    }  
    console.log(text + ': ', Date.now()-startTime);
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
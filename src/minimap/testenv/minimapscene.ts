import Control from "../../common/control";
import { IVector, Vector } from '../../common/vector';
import { Canvas } from "../../tracer/testenv/canvasRenderer";
import { RenderTicker } from '../../tracer/testenv/ticker';
import { getImageData, getMapFromImageData, loadImage } from "../../tracer/tracelib/imageDataTools";
import mapFile from '../../tracer/testenv/assets/map4.png';
import {checkMap} from '../../tracer/tracelib/building';
import { iteration } from "../../tracer/tracelib/traceCore/tracerBase";
import { maxValue } from "../../tracer/tracelib/traceCore/traceTools";


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
            this.renderMap(this.canvas, delta);
           
            const rnd = new Vector(Math.floor(Math.random() * mapSize), Math.floor(Math.random() * mapSize));
            try {
                const bld = checkMap(this.mpb, mask, rnd);
                if (-1 ==(bld.findIndex(it=> -1 != it.findIndex(jt=> jt == 1)))){
                    const building = new Building(rnd)
                    this.buildings.push(building);
                    
                    building.mask.forEach((row, y)=>{
                        row.forEach((cell, x)=>{
                            if (cell!=0){
                                const canvasRow = this.mpb[(building.pos.y + y)];
                                if (canvasRow){
                                    canvasRow[(building.pos.x + x)] = 1;
                                }
                            }
                        })
                    })
                }
            } catch(e){

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
             const ind = indexateAround(this.map.map(it=> it.map(jt=> jt == 0 ? maxValue : -1)), pts,0, (ind)=>{
                /*ind.forEach(it=>{
                    const canvasRow = this.canvas.canvasBack[(it.y)];
                    if (canvasRow){
                        canvasRow[(it.x)] = '#55f';
                    }
                }) */
                }); ind.forEach(it=>{
                        const canvasRow = this.canvas.canvasBack[(it.y)];
                        if (canvasRow){
                            canvasRow[(it.x)] = '#55f';
                        }
                    }) 

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

export function indexateAround(map:Array<Array<number>>, points:Array<{x:number, y:number}>, generation:number, onIterate:(pts:IVector[])=>void):IVector[] | null{
    const nextPoints = iteration(map, points, generation);
    onIterate(nextPoints);
    if (generation>=3){
        return nextPoints;
    }

    if (!points.length) { return null; }
    return indexateAround(map, nextPoints, generation+1, onIterate);
  }
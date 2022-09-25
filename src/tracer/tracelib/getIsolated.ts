import { Vector } from "../../common/vector";
import { indexate, indexate2 } from "./tracer";

export const steps = [
    {x: -1, y: 0}, 
    {x: 1, y: 0}, 
    {x: 0, y: 1}, 
    {x: 0, y: -1}
];

export const steps2 = [
    {x: -1, y: -1}, 
    {x: 1, y: 1}, 
    {x: -1, y: 1}, 
    {x: 1, y: -1}
]

export function getHash(x:number,y:number,z:number): string | number{
    return `${x}_${y}_${z}`; 
    //return (y+1)*2048*100 + (x+1)*100+(-z);
}

export function getIsolated(map: Array<Array<number>>){
    let mp = map.map(it=>it.map(jt=>jt==0?Number.MAX_SAFE_INTEGER:-1));
    let currentId = 0;
    mp.forEach((row, y)=>{
        row.forEach((cell, x)=>{
            if (cell == Number.MAX_SAFE_INTEGER){
                currentId +=1;
                const nextMap = getAreaFromPoint(mp, new Vector(x, y), -currentId -1);
                if (!nextMap.isFound){
                    return;
                } 
                mp.forEach((row, y)=>{
                    row.forEach((cell, x)=>{
                        row[x] = nextMap.map[y][x];
                    })
                });
            }
        })
    })
    return mp;
    
}

export function getAreaFromPoint(mp: Array<Array<number>>, indexPoint: Vector, areaId:number){
    //let mp = map.map(it=>it.map(jt=>jt==0?Number.MAX_SAFE_INTEGER:-1));
    let isFound = false;
    indexate(mp, [indexPoint], 0);

    //fix, initial isnt indexed
    if (mp[indexPoint.y][indexPoint.x] > -1){
        mp[indexPoint.y][indexPoint.x] = areaId;
    }

    const resultMap = mp.map(it=>it.map(jt=>{
        if (jt != Number.MAX_SAFE_INTEGER &&  jt > -1){
            isFound =true;
            return areaId;
        } else {
            return jt;
        }     
    }));

    return {
        isFound,
        map: resultMap
    }
}

export function getChunks(map: Array<Array<number>>, chunkSize: number){
    //const chunkSize = 16;
    const chunks = [];
    for (let i = 0; i< map.length; i+=chunkSize){
        const chunksRow = [];
        for (let j = 0; j< map[i].length; j+=chunkSize){
            const chunk:Array<Array<number>> = [];
            for (let ii = 0; ii< chunkSize; ii+=1){
                const chunkRow: Array<number> = [];
                for (let jj = 0; jj< chunkSize; jj+=1){
                    chunkRow.push(map[i+ii][j+jj]);
                }
                chunk.push(chunkRow);
            }
            chunksRow.push(/*{
                map:chunk,
                pos: new Vector(j, i)
            }*/chunk);
        }
        chunks.push(chunksRow);
    }
    return chunks;
}

function getChunk(map:Array<Array<number>>, pos:Vector, chunkSize:number){
    const chunk: number[][] = [];
    for (let ii = 0; ii< chunkSize; ii+=1){
        const chunkRow: Array<number> = [];
        for (let jj = 0; jj< chunkSize; jj+=1){
            chunkRow.push(map[Math.floor(pos.y/chunkSize)*chunkSize +ii][Math.floor(pos.x /chunkSize)*chunkSize+jj]);
        }
        chunk.push(chunkRow);
    }
    return chunk;
}

export function getIsolatedChunks(map: Array<Array<number>>, chunkSize: number){
    const chunks = getChunks(map, chunkSize);
    return chunks.map((chunkRow, i)=>chunkRow.map((chunk, j)=>{
        const ch = getIsolated(chunk)
        return ch;
    }));
}

export function getConnections(chunks:number[][][][], pos:Vector){
    const chunk = chunks[pos.y][pos.x];
    const connections: {pos:Vector, i:number, ci:number}[] = [];
    const addConnection = (obj:any) => {
        if (connections.find(it=>{
          return it.pos.x == obj.pos.x && it.pos.y == obj.pos.y && it.i == obj.i  && it.ci == obj.ci 
        }) == null){
            connections.push(obj);
        }
    }
    steps.forEach(step=>{
        const nextVector = pos.clone().add(Vector.fromIVector(step));
        const nextChunk = chunks[nextVector.y]?.[nextVector.x];
        if (!nextChunk) return;
        if (step.x == 1){
            chunk.forEach((row, y)=>{
                const cell = row[row.length-1];
                const nextCell = nextChunk[y][0];
                if (nextCell<-1 && cell<-1){
                    addConnection({pos:nextVector, i: nextCell, ci: cell});
                }
            })
        } else 
        if (step.x == -1){
            chunk.forEach((row, y)=>{
                const cell = row[0];
                const nextCell = nextChunk[y][row.length-1];
                if (nextCell<-1 && cell<-1){
                    addConnection({pos:nextVector, i: nextCell, ci: cell});
                }
            })
        } else
        if (step.y == 1){
            chunk[chunk.length-1].forEach((cell, x)=>{
                const nextCell = nextChunk[0][x];
                if (nextCell<-1 && cell<-1){
                    addConnection({pos:nextVector, i: nextCell, ci: cell});
                }
            })
        } else 
        if (step.y == -1){
            chunk[0].forEach((cell, x)=>{
                const nextCell = nextChunk[chunk.length-1][x];
                if (nextCell<-1 && cell<-1){
                    addConnection({pos:nextVector, i: nextCell, ci: cell});
                }
            })
        }
    });

    steps2.forEach(step=>{
        const nextVector = pos.clone().add(Vector.fromIVector(step));
        const nextChunk = chunks[nextVector.y]?.[nextVector.x];
        if (!nextChunk) return;
        if (step.x == 1 && step.y == 1){
            const cell = chunk[chunk.length-1][chunk[0].length-1];
            const nextCell = nextChunk[0][0];
            if (nextCell<-1 && cell<-1){
                addConnection({pos:nextVector, i: nextCell, ci: cell});
            }
        } else 
        if (step.x == -1 && step.y == 1){
            const cell = chunk[chunk.length-1][0];
            const nextCell = nextChunk[0][nextChunk[0].length-1];
            if (nextCell<-1 && cell<-1){
                addConnection({pos:nextVector, i: nextCell, ci: cell});
            }
        } else
        if (step.y == -1 && step.x == 1){
            const cell = chunk[0][chunk[0].length-1];
            const nextCell = nextChunk[nextChunk.length-1][0];
            if (nextCell<-1 && cell<-1){
                addConnection({pos:nextVector, i: nextCell, ci: cell});
            }
        } else 
        if (step.y == -1 && step.x == -1){
            const cell = chunk[0][0];
            const nextCell = nextChunk[nextChunk.length-1][nextChunk[0].length-1];
            if (nextCell<-1 && cell<-1){
                addConnection({pos:nextVector, i: nextCell, ci: cell});
            }
        }
    });
    return connections;
}

export function getAllConnections(chunks:number[][][][]){
    return chunks.map((row, j)=> row.map((chunk, i)=>{
        return getConnections(chunks, new Vector(i, j));
    }));
}

export interface IChunk{
    original: {
        pos: Vector,
        i: number
    };
    connections: Array<string | number>;
    index: number;
}

const getHashByVector = (chunks:number[][][][], pos: Vector)=>{
    const size = chunks[0][0][0].length;
    const z = chunks[Math.floor(pos.y / size)][Math.floor(pos.x / size)][Math.floor(pos.y % size)][Math.floor(pos.x % size)];
    return `${Math.floor(pos.x / size)}_${Math.floor(pos.y / size)}_${z}`
}

const getChunkPosByVector = (chunks:number[][][][], pos: Vector)=>{
    const size = chunks[0][0][0].length;
    //const z = chunks[Math.floor(pos.y / size)][Math.floor(pos.x / size)][Math.floor(pos.y % size)][Math.floor(pos.x % size)];
    return new Vector(Math.floor(pos.x / size), Math.floor(pos.y / size));
}

export function getAffected(chunks:number[][][][], tree: Record<string, IChunk>, point: Vector){
    const affectedChunkPos = getChunkPosByVector(chunks, point);
    //make only if border point or restructurized zones;
    return affectedChunkPos
}

export function getClosest(chunks:number[][][][], tree: Record<string, IChunk>, point: Vector){
    //const affectedChunkPos = getChunkPosByVector(chunks, point);
    //make only if border point or restructurized zones;
    const closest: Array<Vector> = [];
    [...steps, ...steps2].forEach(step=>{
        const next = point.clone().add(Vector.fromIVector(step));
        const chunk = chunks[next.y]?.[next.x];
        if (chunk){
            closest.push(next)
        }
    });
    return closest;
}

function findChunkHashes(tree: Record<string | number, IChunk>, pos:Vector){
    const hashes:Array<string | number> = [];
    for (let i = -2; i>-100; i--){
        const hash = getHash(pos.x, pos.y, i);//`${pos.x}_${pos.y}_${i}`;
        if (tree[hash]){
            hashes.push(hash);
        } else {
            break;
        }
    }
    return hashes;
}

export function updateChunkTree(map:number[][],chunks:number[][][][], tree: Record<string | number, IChunk>, points: {pos: Vector, val:number}[]){
    const affected: Vector[] = [];
    const size = chunks[0][0][0].length;
    points.forEach(point=>{
        const affectedChunk = getAffected(chunks, tree, point.pos);
        //chunks[affectedChunk.y][affectedChunk.x][point.pos.y % size][point.pos.x % size] = point.val;
        map[point.pos.y][point.pos.x] = point.val;
        const chunk = getChunk(map, point.pos, size);
        chunks[affectedChunk.y][affectedChunk.x] = getIsolated(chunk);
        if (affected.find(it=> it.x == affectedChunk.x && it.y == affectedChunk.y) == null){
            affected.push(affectedChunk);
        }
    })

    const closest:Vector[] = [];
    affected.forEach(it=>{
        const closestChunks = getClosest(chunks, tree, it);
        closestChunks.forEach(jt=>{
            if (closest.find(iit=> iit.x == jt.x && iit.y == jt.y) == null){
                closest.push(jt);
            }
        })
    });

    const all = [...affected, ...closest];

    const hashes:Array<string| number> = [];
    all.forEach(it=>{
        const newh = findChunkHashes(tree, it);
        newh.forEach(jt=>{
            hashes.push(jt);
        })
    })

    hashes.forEach(hash=>{
        delete tree[hash];
        //tree[hash] = undefined;
    })

    all.forEach((vec, i)=>{
        const connections = getConnections(chunks, vec);
        //const hash = hashes[i];
        connections.forEach(z=>{
            tree[/*`${vec.x}_${vec.y}_${z.ci}`*/getHash(vec.x, vec.y, z.ci)] = {
                index: Number.MAX_SAFE_INTEGER,
                original: {
                    pos: new Vector(vec.x, vec.y),
                    i: z.ci
                },
                connections: connections.filter(it=> it.ci == z.ci).map(it=> /*`${it.pos.x}_${it.pos.y}_${it.i}`*/getHash(it.pos.x, it.pos.y, it.i))
            }
        })
    });
    return tree;
}

export function getChunkTree(chunks:number[][][][]){
    const connections = getAllConnections(chunks);
    const tree: Record<string | number, IChunk> = {}
    chunks.forEach((row, i)=>{
        row.forEach((chunk, j)=>{
            connections[i][j].forEach(z=>{
                tree[/*`${j}_${i}_${z.ci}`*/getHash(j, i, z.ci)] = {
                    index: Number.MAX_SAFE_INTEGER,
                    original: {
                        pos: new Vector(j, i),
                        i: z.ci
                    },
                    connections: connections[i][j].filter(it=> it.ci == z.ci).map(it=> /*`${it.pos.x}_${it.pos.y}_${it.i}`*/getHash(it.pos.x, it.pos.y, it.i))
                }
            })
        })
    })
    return tree;
}

export function dublicateChunkTree(tree: Record<string | number, IChunk>){
    const dub:Record<string, IChunk> = {};
    //*Object.keys(tree).map(key=>{
        //warning, use +key for num
        //dub[key] = {...tree[key]}
    //    dub[+key] = {...tree[+key]}
    //})
    for (let key in tree){
        dub[key] = {...tree[key]/*, connections:[...tree[key].connections]*/}
    }
    return dub;
}

function iteration(tree: Record<string, IChunk>, points:Array<string|number>, generation:number){
    const nextPoints: Array<string|number> = [];
    if (!points.length) { return; }
    points.forEach(point=>{
        const pointItem = tree[point];
        if (!pointItem){
            return;
        }
      pointItem.connections.forEach(step=>{
        //const px = point.x+step.x;
        //const py = point.y+step.y;
        //const row = map[py];
       //console.log(tree[step].index, generation);
       const treeItem = tree[step];
        if (treeItem && treeItem.index>generation){   
            treeItem.index = generation;
            nextPoints.push(step);
        }
      })
    });
    return nextPoints;
  }
  
  export function chunkIndexate(tree: Record<string|number, IChunk>, points:Array<string|number>, generation:number){
    const nextPoints = iteration(tree, points, generation);
    if (!points.length) { return generation; }
    chunkIndexate(tree, nextPoints, generation+1);
  }

  export function findChunkPath(tree: Record<string|number, IChunk>, destHash:string|number){
    let path:Array<IChunk> = [];
    if (!tree[destHash]) {
        return null;
    }
    let currentValue = tree[destHash].index;
    path.push(tree[destHash]);
    if (currentValue == Number.MAX_SAFE_INTEGER) {
      return null;
    }
    let currentPoint: string |number = destHash;
    let crashDetector = 10000;
    while (currentValue != 0 && crashDetector>0){
      crashDetector--;
      let nextStep = tree[currentPoint].connections.findIndex((step)=>{
        //let point = currentPoint.clone().add(Vector.fromIVector(step));
        if (!tree[step]){
            return false;
        }
        let result = tree[step].index <currentValue//== currentValue-1;
        if (result){
          currentPoint = step;
          currentValue = tree[step].index;
          path.push(tree[step]);
        }
        return result;
      });
      
    }
  if (crashDetector<0){
      throw new Error('Infinity cycle');
    }
    return path;
  }

export function getLimitPathMap(chunkPath:IChunk[], chunks: number[][][][], map:Array<Array<number>>, _mp?:number[][]){
    /*
        let mp = map.map(it=>it.map(jt=>{
            return -1;//jt==0?Number.MAX_SAFE_INTEGER:-1
        }));
    */
        
    let mp = /*_mp? _mp:*/ new Array(map.length).fill(0).map((it, i)=> new Array(map[i].length).fill(-1));
    //let mp: Record<number, Record<number, number>>= {};
    const size = chunks[0][0][0].length;
    chunkPath.forEach((chunk)=>{
        const pos = chunk.original.pos;
        const py = pos.y*size;
        const px = pos.x *size;
        const oi = chunk.original.i;
        chunks[pos.y][pos.x].forEach((row, y)=>{
            const my = py + y;
            let mpy = mp[my];
            //for record optimization
            /*if (!mpy){ 
                mp[my]={};
                mpy = mp[my];
            }*/
            const mapy = map[my];
            row.forEach((cell, x)=>{
                const mx = px + x;
                if (cell == oi){
                    mpy[mx] = mapy[mx]==0?Number.MAX_SAFE_INTEGER:-1
                    //ctx.fillRect((pos.x * size + x) * tileSize, (pos.y * size + y) * tileSize, tileSize, tileSize);
                } else {
                  //  mpy[mx] =-1;
                }
            })
        })
        
    })
    return mp;
}

export function limitTree2(tree:Record<string | number, IChunk>, chunkPath: IChunk[], cw:number, mw:number){
    const ra = Math.floor(cw / mw);
    const allowed: Record<string | number, boolean> ={}
    chunkPath.forEach(chunk=>{
        const chp = chunk.original.pos;
        for (let i =0; i<ra; i++){
            for (let j =0; j<ra; j++){
                for (let z =2; z<10; z++){
                    allowed[getHash(chp.x * ra +i, chp.y * ra + j, -z)] = true;
                }
            }
        }
    });
    for (let chunkIndex in tree){
        if (!allowed[chunkIndex]){
            delete tree[chunkIndex];
        } else {
            const chunk = tree[chunkIndex];
            chunk.connections.forEach((it, i)=>{
                if (!allowed[it]){
                    chunk.connections[i] = undefined;
                }
            })
            chunk.connections = chunk.connections.filter(it=>it);
        }
        
    }
}


export function limitTree(tree:Record<string | number, IChunk>, chunkPath: IChunk[], cw:number, mw:number){
    const ra = Math.floor(cw / mw);
    const allowed: Record<string | number, boolean> ={}
    chunkPath.forEach(chunk=>{
        const chp = chunk.original.pos;
        allowed[getHash(chp.x, chp.y, 0)] = true;
        /*for (let i =0; i<ra; i++){
            for (let j =0; j<ra; j++){
                allowed[getHash(chp.x +i, chp.y + j, 0)] = true;
            }
        }*/
    });

    const dub:Record<string, IChunk> = {};
    for (let chunkIndex in tree){
        const o = tree[chunkIndex].original.pos;
        const hash = getHash(Math.floor(o.x / ra), Math.floor(o.y / ra), 0);
        if (allowed[hash]){
            dub[chunkIndex] = {...tree[chunkIndex]}
            //delete tree[chunkIndex];
        } 
    }

    /*for (let chunkIndex in dub){
        const chunk = tree[chunkIndex];
        dub[chunkIndex].connections = chunk.connections.filter((it)=>{
            return dub[it] !== undefined
        })
        //const connections:Array<string | number> = [];
        /*chunk.connections.forEach((it, i)=>{
            if (dub[it]){
                connections.push(it);
                //chunk.connections[i] = undefined;
            }
        })*/
        //dub[chunkIndex].connections = connections;//chunk.connections.filter(it=>it);
    //}
    return dub;
}

export function getPathBreaks(path:Array<Vector>, map:number[][]){
    return path.filter(point=>{
        return map[point.y][point.x] != 0;
    })
}
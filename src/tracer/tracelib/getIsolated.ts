import { Vector } from "../../common/vector";
import { indexate } from "./tracer";

export const steps = [
    {x: -1, y: 0}, 
    {x: 1, y: 0}, 
    {x: 0, y: 1}, 
    {x: 0, y: -1}
]

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

export function getChunks(map: Array<Array<number>>){
    const chunkSize = 16;
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

export function getIsolatedChunks(map: Array<Array<number>>){
    const chunks = getChunks(map);
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
    connections: string[];
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
    steps.forEach(step=>{
        const next = point.clone().add(Vector.fromIVector(step));
        const chunk = chunks[next.y]?.[next.x];
        if (chunk){
            closest.push(next)
        }
    });
    return closest;
}

function findChunkHashes(tree: Record<string, IChunk>, pos:Vector){
    const hashes:string[] = [];
    for (let i = -2; i>-100; i--){
        const hash = `${pos.x}_${pos.y}_${i}`;
        if (tree[hash]){
            hashes.push(hash);
        } else {
            break;
        }
    }
    return hashes;
}

export function updateChunkTree(map:number[][],chunks:number[][][][], tree: Record<string, IChunk>, points: {pos: Vector, val:number}[]){
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

    const hashes:string[] = [];
    all.forEach(it=>{
        const newh = findChunkHashes(tree, it);
        newh.forEach(jt=>{
            hashes.push(jt);
        })
    })

    hashes.forEach(hash=>{
        delete tree[hash];
    })

    all.forEach((vec, i)=>{
        const connections = getConnections(chunks, vec);
        //const hash = hashes[i];
        connections.forEach(z=>{
            tree[`${vec.x}_${vec.y}_${z.ci}`] = {
                index: Number.MAX_SAFE_INTEGER,
                original: {
                    pos: new Vector(vec.x, vec.y),
                    i: z.ci
                },
                connections: connections.filter(it=> it.ci == z.ci).map(it=> `${it.pos.x}_${it.pos.y}_${it.i}`)
            }
        })
    });
    return tree;
}

export function getChunkTree(chunks:number[][][][]){
    const connections = getAllConnections(chunks);
    const tree: Record<string, IChunk> = {}
    chunks.forEach((row, i)=>{
        row.forEach((chunk, j)=>{
            connections[i][j].forEach(z=>{
                tree[`${j}_${i}_${z.ci}`] = {
                    index: Number.MAX_SAFE_INTEGER,
                    original: {
                        pos: new Vector(j, i),
                        i: z.ci
                    },
                    connections: connections[i][j].filter(it=> it.ci == z.ci).map(it=> `${it.pos.x}_${it.pos.y}_${it.i}`)
                }
            })
        })
    })
    return tree;
}

export function dublicateChunkTree(tree: Record<string, IChunk>){
    const dub:Record<string, IChunk> = {};
    Object.keys(tree).map(key=>{
        dub[key] = {...tree[key]}
    })
    return dub;
}

function iteration(tree: Record<string, IChunk>, points:Array<string>, generation:number){
    const nextPoints: Array<string> = [];
    if (!points.length) { return; }
    points.forEach(point=>{
      tree[point].connections.forEach(step=>{
        //const px = point.x+step.x;
        //const py = point.y+step.y;
        //const row = map[py];
       //console.log(tree[step].index, generation);
        if (tree[step].index>generation){   
            tree[step].index = generation;
            nextPoints.push(step);
        }
      })
    });
    return nextPoints;
  }
  
  export function chunkIndexate(tree: Record<string, IChunk>, points:Array<string>, generation:number){
    const nextPoints = iteration(tree, points, generation);
    if (!points.length) { return generation; }
    chunkIndexate(tree, nextPoints, generation+1);
  }

  export function findChunkPath(tree: Record<string, IChunk>, destHash:string){
    let path:Array<IChunk> = [];
    if (!tree[destHash]) {
        return null;
    }
    let currentValue = tree[destHash].index;
    path.push(tree[destHash]);
    if (currentValue == Number.MAX_SAFE_INTEGER) {
      return null;
    }
    let currentPoint: string = destHash;
    let crashDetector = 1000;
    while (currentValue != 0 && crashDetector>0){
      crashDetector--;
      let nextStep = tree[currentPoint].connections.find(step=>{
        //let point = currentPoint.clone().add(Vector.fromIVector(step));
        let result = tree[step].index == currentValue-1;
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

export function getLimitPathMap(chunkPath:IChunk[], chunks: number[][][][], map:Array<Array<number>>){
    /*
        let mp = map.map(it=>it.map(jt=>{
            return -1;//jt==0?Number.MAX_SAFE_INTEGER:-1
        }));
    */
    let mp = new Array(map.length).fill(0).map((it, i)=> new Array(map[i].length).fill(-1));
    //let mp: Record<number, Record<number, number>>= {};
    const size = chunks[0][0][0].length;
    chunkPath.forEach((chunk)=>{
        const pos = chunk.original.pos;
        chunks[pos.y][pos.x].forEach((row, y)=>{
            const my = pos.y * size + y;
            let mpy = mp[my];
            //for record optimization
            /*if (!mpy){ 
                mp[my]={};
                mpy = mp[my];
            }*/
            const mapy = map[my];
            row.forEach((cell, x)=>{
                if (cell == chunk.original.i){
                    const mx = pos.x * size + x;
                    mpy[mx] = mapy[mx]==0?Number.MAX_SAFE_INTEGER:-1
                    //ctx.fillRect((pos.x * size + x) * tileSize, (pos.y * size + y) * tileSize, tileSize, tileSize);
                }
            })
        })
        
    })
    return mp;
}
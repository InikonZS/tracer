import { IVector, Vector } from "../../common/vector";

export const steps = [
  {x: -1, y: 0}, 
  {x: 1, y: 0}, 
  {x: 0, y: 1}, 
  {x: 0, y: -1}, 
  {x: -1, y: -1}, 
  {x: -1, y: 1}, 
  {x: 1, y: 1}, 
  {x: 1, y: -1},

 /* {x: -1, y: -2}, 
  {x: -1, y: 2}, 
  {x: 1, y: 2}, 
  {x: 1, y: -2},
  {x: -2, y: -1}, 
  {x: -2, y: 1}, 
  {x: 2, y: 1}, 
  {x: 2, y: -1},*/
]

function iteration(map:Array<Array<number>>, points:Array<{x:number, y:number}>, generation:number){
  const nextPoints: Array<{x:number, y:number}> = [];
  if (!points.length) { return; }
  points.forEach(point=>{
    steps.forEach(step=>{
      const px = point.x+step.x;
      const py = point.y+step.y;
      const row = map[py];
      if (row && row[px]!=null && row[px]>generation){
        row[px] = generation;
        nextPoints.push({x:px, y:py});
      }
    })
  });
  return nextPoints;
}

export function indexate(map:Array<Array<number>>, points:Array<{x:number, y:number}>, generation:number){
  const nextPoints = iteration(map, points, generation);
  if (!points.length) { return generation; }
  indexate(map, nextPoints, generation+1);
}

const mp = new Array(512 * 10).fill(0);
const tm = new Array(512 * 10).fill(0);

function iteration2(map:Array<Array<number>>, points:Array<{x:number, y:number}>, generation:number, len:number): number{

  //const nextPoints: Array<{x:number, y:number}> = mp;//[{x:0, y:43},{x:34, y:34}];
  if (/*!points.length ||*/ !len) { 
    return 0; 
  }  
  
  for (let i=0; i< len; i++){
    tm[i] = points[i];
  }
  let cnt = 0;
  tm.findIndex((point, ind)=>{
    steps.forEach(step=>{
      const px = point.x+step.x;
      const py = point.y+step.y;
      const row = map[py];
      if (row && row[px]!=null && row[px]>generation){
        row[px] = generation;
        mp[cnt] = {x:px, y:py};
        //nextPoints.push({x:px, y:py});
        cnt++;
      }
    })
    if (len <= ind+1) {
      //cnt++;
      return true;
    }
    return false;
  });
  return cnt;//[nextPoints, cnt];
}


export function indexate2(map:Array<Array<number>>, points:Array<{x:number, y:number}>, generation:number, length:number = 1){
  const len = iteration2(map, points, generation, /*points.length*/length);
  if (!points.length || !length) { return generation; }
  indexate2(map, mp, generation+1, len);
}

export function* indexGenerator(map:Array<Array<number>>, points:Array<{x:number, y:number}>, generation:number){
  let gen = generation;
  let nextPoints = points;
  do {
    //@ts-ignore;
    nextPoints = iteration(map, nextPoints, gen);
    gen+=1;
    yield {generation:gen, points:nextPoints};
  } while (nextPoints.length); 
  return {gen};
  //indexGenerator(map, nextPoints, generation+1);
}

/*export function indexateAsync( map:Array<Array<number>>, points:Array<{x:number, y:number}>, generation:number, onFinish:()=>void){
  let gen = indexGenerator(map, points, generation);
  indexateAsyncGen(gen, map, points, generation, onFinish, Date.now());
}*/

export function indexateAsync( map:Array<Array<number>>, points:Array<{x:number, y:number}>, generation:number, onFinish:()=>void, startTime?:number){
  let gen = indexGenerator(map, points, generation);
  let iterationStart = new Date();
  let res:any;

  const chunkLength = 300;
  for (let i=0; i<chunkLength; i++){
    res = gen.next();  
    if (res.done){
      break;
    }
  }
  if (res.done){
    //console.log('finished ', (new Date()).valueOf() - startTime.valueOf());
    onFinish();
  }else {
    setTimeout(()=>{
     // console.log('iteration '+ generation.toString(), (new Date()).valueOf() - iterationStart.valueOf());
      indexateAsync( map, res.value.points, res.value.generation, onFinish, startTime);
    }, 0);
  }

  //let startTime = new Date();
  /*setTimeout(()=>{
    let iterationStart = new Date();
    //for (let i=0; i<10; i++){
      const nextPoints = iteration(map, points, generation);
      console.log('iteration '+ generation.toString(), (new Date()).valueOf() - iterationStart.valueOf());
      if (!nextPoints || !nextPoints.length){
        console.log('finished ', (new Date()).valueOf() - startTime.valueOf());
        onFinish();
        return;
      }
    //}
    indexateAsync(map, nextPoints, generation+1, onFinish, startTime);
  }, 0);*/
  //indexate(map, points, generation);
  //console.log('finished ', (new Date()).valueOf() - startTime.valueOf());
  //onFinish();
}


export function tracePath(map:Array<Array<number>>, indexPoint:IVector, destination:IVector, onFinish:(path:Array<Vector>)=>void){
    let mp = map.map(it=>it.map(jt=>jt==0?Number.MAX_SAFE_INTEGER:-1));
  indexateAsync(mp, [indexPoint], 0, ()=>{
    const path = findPath(mp, Vector.fromIVector(indexPoint), Vector.fromIVector(destination));
    onFinish(path);
  }, Date.now())
}

export function tracePathes(map:Array<Array<number>>, indexPoint:IVector, destinations:Array<IVector>, onFinish:(pathes:Array<Array<Vector>>)=>void){
  const pathes: Array<Array<Vector>> = [];
  let mp = map.map(it=>it.map(jt=>jt==0?Number.MAX_SAFE_INTEGER:-1));
  indexateAsync(mp, [indexPoint], 0, ()=>{
    destinations.forEach(destination=>{
      const path = findPath(mp, Vector.fromIVector(indexPoint), Vector.fromIVector(destination));
      if (path){
        pathes.push(path);
      }
    });
    onFinish(pathes);
  }, Date.now())
}

export function findPath(map:Array<Array<number>>, indexPoint:Vector, destPoint:Vector){
  let path:Array<Vector> = [];
  let currentValue = map[destPoint.y][destPoint.x]
  if (currentValue == Number.MAX_SAFE_INTEGER) {
    return null;
  }
  let currentPoint:Vector = destPoint.clone();
  let crashDetector = 10000;
  while (currentValue != 0 && crashDetector>0){
    crashDetector--;
    let nextStep = steps.find(step=>{
      let point = currentPoint.clone().add(Vector.fromIVector(step));
      let result = map[point.y]?.[point.x] == currentValue-1;
      if (result){
        currentPoint = point;
        currentValue = map[point.y][point.x];
        path.push(Vector.fromIVector(point));
      }
      return result;
    });
    
  }
if (crashDetector<0){
    throw new Error('Infinity cycle');
  }
  return path;
}

/*export function parseData(data:ImageData) {
   const map:Gold[] = [];
  iterateImageData(data, (pos, color)=>{
    
    if (isEqualColor(color, { r: 255, g: 255, b: 0, a: 255 })) {
      const gold = new Gold(new Vector(pos.y, pos.x))
     map.push(gold)
    }
  });
  return map;
}*/



export function inBox(point:Vector, _start:Vector, _end:Vector){
  const start = new Vector(Math.min(_start.x, _end.x), Math.min(_start.y, _end.y));
  const end = new Vector(Math.max(_start.x, _end.x), Math.max(_start.y, _end.y));
  return point.x>start.x && point.y>start.y && point.x<end.x && point.y<end.y;
}
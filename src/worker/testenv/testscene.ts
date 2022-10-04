

import Control from '../../common/control';

//@ts-ignore
import wscript from './worker.w.js';

console.log('path: ', wscript);
export class TestScene extends Control {
    constructor(parentNode: HTMLElement) {
        super(parentNode);
        const worker = new Worker(wscript);

        worker.onmessage = (msg) => {
            console.log(msg.data);
        }

        const buttonFreeze = new Control(this.node, 'button', '', 'freeze');
        buttonFreeze.node.onclick = () => {
            //worker.postMessage({ a: 32423, b: 'dafsada' });
            heavyOne();
            //worker.postMessage({route: 'heaveOne'});
        }

        const button = new Control(this.node, 'button', '', 'send');
        button.node.onclick = () => {
            //worker.postMessage({ a: 32423, b: 'dafsada' });
            //heavyOne();
            worker.postMessage({route: 'heaveOne'});
        }

        const iterateButton = new Control(this.node, 'button', '', 'iterate');
        iterateButton.node.onclick = () => {
            const res: Array<number> = [];
            console.log('start async');
            asyncIterate(notBigData, (item, index) => {
                res.push(Math.sin(item));
            }, () => {
                console.log('done ', res);
            })
        }

        const iterateButtonB = new Control(this.node, 'button', '', 'iterateBatch');
        iterateButtonB.node.onclick = () => {
            const res: Array<number> = [];
            console.log('start async');
            batchIterate(bigData, (item, index) => {
                res.push(Math.sin(item));
            }, () => {
                console.log('done ', res);
            }, 100)
        }

        const startOnceWorkerButton = new Control(this.node, 'button', '', 'onceWorker');
        startOnceWorkerButton.node.onclick = async () => {
           /* const onceWorker = new Worker(wscript);
            onceWorker.onmessage = (msg) => {
                console.log(msg.data);
                onceWorker.terminate();
                //onceWorker.postMessage({route: 'heaveOne'});
            }
            onceWorker.onerror = (err) => {
                console.log(err);
            }
            onceWorker.onmessageerror= (err) => {
                console.log(err);
            }

            onceWorker.postMessage({route: 'heaveOne'});*/
            const response = await heaveOneInWorker();
            console.log(response);
        }

        const animated = new Control(this.node, 'div', 'animated');

        let angle = 0;
        const render = () => {
            requestAnimationFrame(() => {
                angle+=1;
                animated.node.style.transform = `translate(300px, 300px) rotate(${angle}deg)`
                render();
            })
        }
        render();
    }
}

function heavyOne(){
    const arr = [];
    for(let i=0; i<10000000; i++){
        const a = Math.sin(i);
        if (Math.random()< 0.001){
            arr.push(a)
        }
    }
    return arr;
}

const notBigData = (()=>{
    return new Array(343).fill(0).map((_, i)=> i);
})();

const bigData = (()=>{
    return new Array(34343).fill(0).map((_, i)=> i);
})();

function asyncIterate<T>(array: Array<T>, onIterate: (item:T, index:number)=>void, onFinish:()=>void){
    
    const rec = (iteration:number, onIterate: (item:T, index:number)=>void, onFinish: ()=>void)=>{
        setTimeout(()=>{
            onIterate(array[iteration], iteration)
            if (iteration >= array.length-1){
                onFinish();
            } else { 
                rec(iteration + 1, onIterate, onFinish);
            }
           
        }, 0)
    }

    rec(0, onIterate, onFinish);
}

function batchIterate<T>(array: Array<T>, onIterate: (item:T, index:number)=>void, onFinish:()=>void, batchSize:number){
    
    const rec = (iteration:number, onIterate: (item:T, index:number)=>void, onFinish: ()=>void)=>{
        //let i = iteration;
        let bi = 0;
        setTimeout(()=>{
            //use it outside timeout for sync first calc.
            while((bi+iteration <= array.length-1) && bi< batchSize){
                onIterate(array[bi+iteration], iteration)
                bi++;
            }

            if (bi + iteration >= array.length-1){
                onFinish();
            } else { 
                rec(iteration + bi, onIterate, onFinish);
            }
           
        }, 0)
    }

    rec(0, onIterate, onFinish);
}

function batchIterateAsync<T>(array: Array<T>, batchSize:number, onIterate: (item:T, index:number)=>void){
    return new Promise<void>(resolve=>{
        batchIterate(array, onIterate, ()=>{
            resolve();
        }, batchSize)
    })
}

/*batchIterate([], 100, (item, index)=>{

}).then(()=>{

});*/


function _heaveOneInWorker(onResult:(result:Array<number>)=>void, onError:(err: any)=>void){
    const onceWorker = new Worker(wscript);
    onceWorker.onmessage = (msg) => {
        onceWorker.terminate();
        onResult(msg.data);
    }
    onceWorker.onerror = (err) => {
        onError(err);
    }
    onceWorker.onmessageerror= (err) => {
        onError(err);
    }

    onceWorker.postMessage({route: 'heaveOne'});    
}

function heaveOneInWorker():Promise<Array<number>>{
    return new Promise((resolve, reject)=>{
        _heaveOneInWorker(
            (res)=>{resolve(res)}, 
            (err)=>{reject(err)}
        );
    })
}
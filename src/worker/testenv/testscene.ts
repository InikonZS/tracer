

import Control from '../../common/control';

//@ts-ignore
import wscript from './worker.w.js';

console.log('path: ', wscript);
export class TestScene {
    constructor(parent: HTMLElement) {
        const worker = new Worker(wscript);

        worker.onmessage = (msg) => {
            console.log(msg.data);
        }

        const button = new Control(parent, 'button', '', 'send');
        button.node.onclick = () => {
            //worker.postMessage({ a: 32423, b: 'dafsada' });
            //heavyOne();
            worker.postMessage({route: 'heaveOne'});
        }

        const startOnceWorkerButton = new Control(parent, 'button', '', 'onceWorker');
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

        const animated = new Control(parent, 'div', 'animated');

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
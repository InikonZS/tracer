console.log('worker started');
onmessage = (msg)=>{
    const route = msg.data.route;
    switch(route){
        case 'heaveOne': {
            console.log('heaveOne started');
            const res = heavyOne();
            postMessage(res);
            console.log('heaveOne finished');
            break;
        }
        case 'echo': {
            console.log('console from worker');
            postMessage({received: msg.data, response: 'hello from worker'});
            break;
        }
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
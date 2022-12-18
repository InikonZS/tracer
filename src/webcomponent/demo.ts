import Control from "../common/control";

const Ht = window.HTMLElement

class MyEl1 extends Ht{
    timer: number;
    onMyEvent: ()=>void = null;

    static get observedAttributes() {
        return ['myattr'];
    }
    constructor(){
        super();
        const val = this.getAttribute('myattr');
        console.log(val);
        const shadow = this.attachShadow({mode: 'open'});
        shadow.innerHTML = `
        <div>
            <button>
                <slot> 
            </button>
            <button class="bt1">
                
            </button>
        </div>
        `

        const bt1 = shadow.querySelector('.bt1');
        if (!(bt1 instanceof HTMLElement)) throw new Error();
        bt1.onclick = ()=>{
            console.log('dispatch');
            this.dispatchEvent(new CustomEvent('myevent'));
            this.onMyEvent?.();
        }
        

        this.timer = window.setInterval(()=>{console.log(1)}, 500);
    }

    disconnectedCallback(): void {
        console.log('removed');
        window.clearInterval(this.timer);
        this.timer = null;
        super.remove();
    }

    attributeChangedCallback(name:string, oldValue:string, newValue:string) {
        console.log(name, oldValue, newValue);
    }
}

class MyEl extends Ht{
    constructor(){
        super();
        const shadow = this.attachShadow({mode: 'open'});
        shadow.innerHTML = `
        <div>
        <m-b myattr="qwert" class="mc1">qwertyu</m-b>
        </div>
        `
        const mc = shadow.querySelector('.mc1');
        if (!(mc instanceof MyEl1)) throw new Error();
        mc.addEventListener('myevent', ()=>{
            console.log('myevent');
        })

        mc.onMyEvent = ()=>{
            console.log('onMyEvent');
        }

    }
}

export class DemoWComponent extends Control{
    constructor(parentNode:HTMLElement){
        super(parentNode);

        window.customElements.define('m-b', MyEl1);

        window.customElements.define('my-el', MyEl);
        this.node.innerHTML = `
        <my-el>sdfsfd</my-el>
        `
        const btn = new Control(this.node, 'button', '', 'remove');
        btn.node.onclick = ()=>{
            this.node.innerHTML = '';
        }
    }
}

function getObjectKeys<T>(obj: T): (keyof T)[]{
    return Object.keys(obj) as (keyof T)[];
}

const ks = getObjectKeys({a:'43a4', b:43});
ks.forEach(it=>{
    const f = {a:'43a4', b:43}[it]
})

class Iter1{
    *[Symbol.iterator](){
        console.log('iter')
            yield 23;
            yield 3453;
    }
}

const ff =  new Iter1();
enum A{
    a = 1,
    b = 2
  }
  
  enum B{
    a = '1',
    b = '2'
  }
  
 // let a: A = 4 //correct
 // let b: B = '1' //incorrect
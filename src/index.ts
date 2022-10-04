import Control from './common/control';
import {TestScene} from './tracer/testenv/testscene';
import {TestScene as OptScene} from './tracer/testenv/optimized';
import {TestScene as OptScene2} from './tracer/testenv/animated2';
import {TestScene as WorkerScene} from './worker/testenv/testscene';
import {runBabylonExample} from './babylon/testenv/testscene';
import {MiniMapTestScene} from './minimap/testenv/minimapscene';
import './style.css'
import {Demo} from './mvcdemo/testenv/test';

const rootWrapper = new Control(document.body, 'div', 'screen');
//runBabylonExample(rootWrapper.node);
//const testScene = new TestScene(rootWrapper.node);
//const optScene2 = new OptScene2(rootWrapper.node);
//const optScene = new OptScene(rootWrapper.node);
//const workerScene = new WorkerScene(rootWrapper.node);
//new MiniMapTestScene(rootWrapper.node)
//const demo = new Demo(rootWrapper.node);

class MainRouter extends Control{
    menu: Control<HTMLElement>;
    content: Control<HTMLElement>;

    constructor(parentNode:HTMLElement){
        super(parentNode);
        this.menu = new Control(this.node);
        this.content = new Control(this.node);

        const item = new Control(this.menu.node, 'button', '', 'route1');
        item.node.onclick = ()=>{
            const scene = new OptScene2(this.content.node);
            const backButton = new Control(this.content.node, 'button', '', 'back');
            backButton.node.onclick = ()=>{
                scene.destroy();
                backButton.destroy();
            }
        }

        const item2 = new Control(this.menu.node, 'button', '', 'route2');
        item2.node.onclick = ()=>{
            const scene = new OptScene2(this.content.node);
            const backButton = new Control(this.content.node, 'button', '', 'back');
            backButton.node.onclick = ()=>{
                scene.destroy();
                backButton.destroy();
            }
        }
    }
}

const router = new MainRouter(rootWrapper.node);
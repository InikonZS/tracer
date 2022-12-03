import Control from './common/control';
import {TestScene} from './tracer/testenv/testscene';
import {TestScene as OptScene} from './tracer/testenv/optimized';
import {TestScene as OptScene2} from './tracer/testenv/animated2';
import {TestScene as WorkerScene} from './worker/testenv/testscene';
import {runBabylonExample} from './babylon/testenv/testscene';
import {MiniMapTestScene} from './minimap/testenv/minimapscene';
import './style.css'
import {Demo} from './mvcdemo/testenv/test';
import {MainRouter, IRoute, IRouteScene} from './router';
import {DemoWComponent} from './webcomponent/demo';
import {TodoApp} from './todolist/todoApp';

//runBabylonExample(rootWrapper.node);
//const testScene = new TestScene(rootWrapper.node);
//const optScene2 = new OptScene2(rootWrapper.node);
//const optScene = new OptScene(rootWrapper.node);
//const workerScene = new WorkerScene(rootWrapper.node);
//new MiniMapTestScene(rootWrapper.node)
//const demo = new Demo(rootWrapper.node);


const routes: Array<IRoute> = [
    {
        name: 'optimized path',
        component: (parent: HTMLElement)=>{
            const scene = new OptScene(parent);
            return scene;
        }
    },
    {
        name: 'units fight',
        component: (parent: HTMLElement)=>{
            const scene = new OptScene2(parent);
            return scene;
        }
    },
    {
        name: 'babylon init',
        component: (parent: HTMLElement)=>{
            const destroy = runBabylonExample(parent);
            return {destroy};
        }
    },
    {
        name: 'worker',
        component: (parent: HTMLElement)=>{
            const scene = new WorkerScene(parent);
            return scene
        }
    },
    {
        name: 'mvc',
        component: (parent: HTMLElement)=>{
            const scene = new  Demo(parent);
            return scene
        }
    },
    {
        name: 'testScene',
        component: (parent: HTMLElement)=>{
            const scene = new TestScene(parent);
            return scene
        }
    },
    {
        name: 'miniMap',
        component: (parent: HTMLElement)=>{
            const scene = new MiniMapTestScene(parent);
            return scene
        }
    },
    {
        name: 'webComponent',
        component: (parent: HTMLElement)=>{
            const scene = new DemoWComponent(parent);
            return scene
        }
    },
    {
        name: 'todo list',
        component: (parent: HTMLElement)=>{
            const scene = new TodoApp(parent);
            return scene
        }
    },
]

const rootWrapper = new Control(document.body, 'div', '');
const router = new MainRouter(rootWrapper.node, routes);
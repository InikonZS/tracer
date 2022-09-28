import Control from './common/control';
import {TestScene} from './tracer/testenv/testscene';
import {TestScene as OptScene} from './tracer/testenv/optimized';
import {TestScene as OptScene2} from './tracer/testenv/animated2';
import {TestScene as WorkerScene} from './worker/testenv/testscene';
import {runBabylonExample} from './babylon/testenv/testscene';
import {MiniMapTestScene} from './minimap/testenv/minimapscene';
import './style.css'

const rootWrapper = new Control(document.body, 'div', 'screen');
//runBabylonExample(rootWrapper.node);
//const testScene = new TestScene(rootWrapper.node);
const optScene2 = new OptScene2(rootWrapper.node);
//const workerScene = new WorkerScene(rootWrapper.node);
//new MiniMapTestScene(rootWrapper.node)
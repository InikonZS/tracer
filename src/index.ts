import Control from './common/control';
import {TestScene} from './tracer/testenv/testscene';
import {TestScene as OptScene} from './tracer/testenv/optimized';
import {TestScene as WorkerScene} from './worker/testenv/testscene';
import {runBabylonExample} from './babylon/testenv/testscene';
import {MiniMapTestScene} from './minimap/testenv/minimapscene';
import './style.css'

const rootWrapper = new Control(document.body, 'div', 'screen');
//runBabylonExample(rootWrapper.node);
//const testScene = new TestScene(rootWrapper.node);
const optScene = new OptScene(rootWrapper.node);
//const workerScene = new WorkerScene(rootWrapper.node);
//new MiniMapTestScene(rootWrapper.node)
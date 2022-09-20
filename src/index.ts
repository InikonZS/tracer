import Control from './common/control';
import {TestScene} from './tracer/testenv/testscene';
import {TestScene as WorkerScene} from './worker/testenv/testscene';
import {runBabylonExample} from './babylon/testenv/testscene';
import './style.css'

const rootWrapper = new Control(document.body, 'div', 'screen');
runBabylonExample(rootWrapper.node);
//const testScene = new TestScene(rootWrapper.node);
//const workerScene = new WorkerScene(rootWrapper.node);
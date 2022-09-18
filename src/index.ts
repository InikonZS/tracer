import Control from './common/control';
import {Canvas} from './tracer/testenv/testscene';
import './style.css'

const rootWrapper = new Control(document.body, 'div', 'screen');
const canvas = new Canvas(rootWrapper.node);
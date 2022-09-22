import { ActionManager, ArcRotateCamera, Engine, ExecuteCodeAction, HemisphericLight, MeshBuilder, Scene, Vector3 } from 'babylonjs';
import { getMapFromImageData, getImageData, loadImage } from '../../tracer/tracelib/imageDataTools';
import mapFile from '../assets/map1.png';

async function createScene(engine: Engine, canvas: HTMLCanvasElement) {
    const scene = new Scene(engine);

    const camera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    const light1 = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

    

   const image = await loadImage(mapFile);
    const map = getMapFromImageData(getImageData(image));
    const objects = []
    for (let i = 0; i < map.length; i++){
            for (let j = 0; j < map[0].length; j++){
                switch (map[i][j]){
                    case 1:
                        const gold = MeshBuilder.CreateSphere("sphere", { diameter: 1, segments: 10 }, scene);
                        const posGold = new Vector3(i, 0,j);
                        gold.position = posGold.clone();
                        //ON MOUSE ENTER
                        gold.actionManager = new ActionManager(scene);
                        gold.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (ev) => {	
                            scene.hoverCursor = "pointer";
                            gold.scaling = new Vector3(2, 2, 2);
                        }));
	
                //     //ON MOUSE EXIT
                        gold.actionManager.registerAction(new ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, (ev)=>{
                            gold.scaling = new Vector3(1, 1, 1);
                        }));
                        objects.push(gold);
                        break;
                    case 2:
                        const tree = MeshBuilder.CreateCylinder("cone", {height:2, diameterBottom:1, diameterTop:0}, scene)
                        const treePos = new Vector3(i, 0,j);
                        tree.position = treePos.clone();
                        objects.push(tree);
                }
            }
        }
        const widthGround = map.length;
        const heightGround = map[0].length;
        const ground = MeshBuilder.CreateGround("ground", { width: widthGround, height: heightGround, updatable: true, subdivisions: 1 }, scene);
        ground.position = new Vector3(widthGround / 2, -1, heightGround / 2);
        return {scene, objects};
    
   
    
    // for (let i = 0; i<100; i++){
    //     //const sphere = MeshBuilder.CreateBox("sphere", { width:1, depth:1, height:1 }, scene);
       
    //     const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1, segments: 10 }, scene);
    //     const pos = new Vector3((i % 20) * 2, Math.floor( i / 20) * 2, 0);
    //     sphere.position = pos.clone();

    //     	//ON MOUSE ENTER
    //     sphere.actionManager = new ActionManager(scene);
    //     sphere.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (ev) => {	
    //         scene.hoverCursor = "pointer";
    //         sphere.scaling = new Vector3(2, 2, 2);
    //     }));
	
    //     //ON MOUSE EXIT
    //     sphere.actionManager.registerAction(new ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, (ev)=>{
    //         sphere.scaling = new Vector3(1, 1, 1);
    //     }));
	
    //     spheres.push({sphere, pos});
    // }

    
}

async function runBabylonExample(parentNode: HTMLElement) {
    const canvas = document.createElement('canvas');
    const autoSize = () => {
        canvas.width = parentNode.clientWidth;
        canvas.height = parentNode.clientHeight;

    }
    canvas.width = 1500;
    canvas.height = 600;
    parentNode.appendChild(canvas);
    const engine = new Engine(canvas, true);

    const { scene,  objects } = await createScene(engine, canvas);

    let ani = 0;
    window.addEventListener('resize',autoSize);
    engine.runRenderLoop(() => {
        // ani+=0.01;
        // sphere.position = new Vector3(Math.sin(ani), Math.cos(ani), 0);
        // spheres.forEach(({sphere, pos:position}, i) =>{
        //     sphere.position = position.add(new Vector3(Math.sin(ani + i), Math.cos(ani), 0));
        // })
        scene.render();
    });
    autoSize();
}



export {runBabylonExample}
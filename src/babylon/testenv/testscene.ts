import { ActionManager, ArcRotateCamera, Engine, ExecuteCodeAction, HemisphericLight, MeshBuilder, Scene, Vector3 } from 'babylonjs';

function createScene(engine: Engine, canvas: HTMLCanvasElement) {
    const scene = new Scene(engine);

    const camera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    const light1 = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

    const spheres = [];
    for (let i = 0; i<1000; i++){
        //const sphere = MeshBuilder.CreateBox("sphere", { width:1, depth:1, height:1 }, scene);
        const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1, segments: 10 }, scene);
        const pos = new Vector3((i % 20) * 2, Math.floor( i / 20) * 2, 0);
        sphere.position = pos.clone();
        	//ON MOUSE ENTER
        sphere.actionManager = new ActionManager(scene);
        sphere.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (ev) => {	
            scene.hoverCursor = "pointer";
            sphere.scaling = new Vector3(2, 2, 2);
        }));
	
        //ON MOUSE EXIT
        sphere.actionManager.registerAction(new ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, (ev)=>{
            sphere.scaling = new Vector3(1, 1, 1);
        }));
	
        spheres.push({sphere, pos});
    }

    return {scene, sphere, spheres};
}

export function runBabylonExample(parentNode: HTMLElement){
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    parentNode.appendChild(canvas);
    const engine = new Engine(canvas, true);

    const {scene, sphere, spheres} = createScene(engine, canvas);

    let ani = 0;
    engine.runRenderLoop(() => {
        ani+=0.01;
        sphere.position = new Vector3(Math.sin(ani), Math.cos(ani), 0);
        spheres.forEach(({sphere, pos:position}, i) =>{
            sphere.position = position.add(new Vector3(Math.sin(ani + i), Math.cos(ani), 0));
        })
        scene.render();
    });
}
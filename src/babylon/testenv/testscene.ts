import { ArcRotateCamera, Engine, HemisphericLight, MeshBuilder, Scene, Vector3 } from 'babylonjs';

function createScene(engine: Engine, canvas: HTMLCanvasElement) {
    const scene = new Scene(engine);

    const camera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    const light1 = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

    return {scene, sphere};
}

export function runBabylonExample(parentNode: HTMLElement){
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    parentNode.appendChild(canvas);
    const engine = new Engine(canvas, true);

    const {scene, sphere} = createScene(engine, canvas);

    let ani = 0;
    engine.runRenderLoop(() => {
        ani+=0.1;
        sphere.position = new Vector3(Math.sin(ani), Math.cos(ani), 0)
        scene.render();
    });
}
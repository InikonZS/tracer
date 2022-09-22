import { ActionManager, ArcRotateCamera, Color3, Engine, ExecuteCodeAction, HemisphericLight, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from 'babylonjs';
import { Vector } from '../../common/vector';
import { getMapFromImageData, getImageData, loadImage } from '../../tracer/tracelib/imageDataTools';
import mapFile from '../assets/map1.png';

async function createScene(engine: Engine, canvas: HTMLCanvasElement) {
    const scene = new Scene(engine);
    const dummyTarget = new Vector3(10,0,10);

    const camera = new ArcRotateCamera("Camera", 0, Math.PI / 5, 30, dummyTarget, scene);
    camera.attachControl(canvas, true);
    camera.upperBetaLimit = Math.PI/2 - Math.PI/20;
    // let cameraForward = dummyTarget.subtract(camera.position).normalize();
    // let cameraRight = new Vector3.Cross(camera.upVector, cameraForward);
    canvas.onkeydown = (e: KeyboardEvent) => {
         const cameraForward = dummyTarget.subtract(camera.position).normalize();
        switch (e.code) {
            case "KeyD":
                const cameraRight = Vector3.Cross(new Vector3(0,1,0), cameraForward);
                dummyTarget.subtractInPlace(cameraRight);
                              
                break;
            case 'KeyA':               
                const cameraLeft = Vector3.Cross(new Vector3(0,1,0), cameraForward);
                dummyTarget.addInPlace(cameraLeft);
                break;
            case 'KeyS':
                const cameraTop = Vector3.Cross(new Vector3(0,0,1), cameraForward);
                dummyTarget.subtractInPlace(cameraTop);
                break;
            case 'KeyW':
                const cameraBottom = Vector3.Cross(new Vector3(0,0,1), cameraForward);
                dummyTarget.addInPlace(cameraBottom);
                break;
        }
         camera.setTarget(dummyTarget); 
        //camera.setTarget(vector);
    }

    const light1 = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

   const image = await loadImage(mapFile);
    const map = getMapFromImageData(getImageData(image));
    const objects: Mesh[] = [];
    const units:Mesh[]=[];
    for (let i = 0; i < map.length; i++){
            for (let j = 0; j < map[0].length; j++){
                switch (map[i][j]){
                    case 1:
                        const gold = MeshBuilder.CreateSphere("sphere", { diameter: 1, segments: 10 }, scene);
                        const posGold = new Vector3(i, 0, j);
                        gold.position = posGold.clone();
                        //ON MOUSE ENTER
                        gold.actionManager = new ActionManager(scene);
                        gold.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (ev) => {	
                            scene.hoverCursor = "pointer";
                            gold.scaling = new Vector3(2, 2, 2);
                        }));
	
                       //ON MOUSE EXIT
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
     for (let i = 0; i < 100; i++){
        const unit = MeshBuilder.CreateBox('box', { size: 1 }, scene);
         unit.position = new Vector3(Math.floor(Math.random() * widthGround), 0, Math.floor(Math.random() * heightGround));
         const myMaterial = new StandardMaterial("myMaterial", scene);

        myMaterial.ambientColor  = new Color3(1, 0, 0);
        myMaterial.specularColor = new Color3(1, 0, 0);
        myMaterial.emissiveColor = new Color3(1, 0, 0);
        

        unit.material = myMaterial;
        units.push(unit);
    }
    return {scene, objects, units,widthGround,heightGround};
    
   
    
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

    const { scene,  objects,units, widthGround,heightGround } = await createScene(engine, canvas);

    let ani = 0;
    window.addEventListener('resize',autoSize);
    engine.runRenderLoop(() => {
        units.forEach(it => {
            const x = it.position._x + 1 > widthGround ? 0 : it.position._x+0.1;
            const z = it.position._z + 1 > widthGround ? 0 : it.position._z+0.1;
            it.position = new Vector3(x,0,z)
        })
        // objects.forEach((it, i) =>{
        //     it.position = it.position.add(new Vector3(Math.sin(ani)/100, 0,Math.cos(ani)/100));
        // })
        scene.render();
    });
    autoSize();
}



export {runBabylonExample}
import { tech } from "./techTree";

export interface ITechBuild{
    deps: string[];
    desc: string[];
    name: string;
    energy: number;
    cost: number;
    time: number;
    mtx:Array<Array<string>>;
    //UnitConstructor:IUnitConstructor;
}

export interface IUnitInfo{
    deps: string[];
   // desc: string[];
    name: string;
  //  energy: number;
    cost: number;
    time: number;

    spawn: string[],
    radius: number,
    speed: number,
    minRadius: number, 
    reloadingTime: number,
    //UnitConstructor:IUnitConstructor;
}



export class TechController{
    getAvailableBuilds(builds: Array<ITechBuild>):Array<ITechBuild> {
    if (!builds.length) {
      return tech.builds.filter(item => item.deps.includes('rootAccess'));
    }
    const nameBuild = Array.from(new Set(builds.map(item => item.desc[0])));

    return tech.builds.filter(item => item.deps.includes('rootAccess'))
      .concat(tech.builds.filter(item => item.deps.every(elem=>nameBuild.includes(elem))));
  }

  getAvailableUnits(builds: Array<ITechBuild>): Array<IUnitInfo>{
    const nameBuild = builds.map(item => item.desc[0]);
    return tech.units.filter(item=>item.deps.every(elem=>nameBuild.includes(elem)))
  }
}

export const techController = new TechController();

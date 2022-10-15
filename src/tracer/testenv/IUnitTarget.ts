import { Vector } from "../../common/vector";

interface IUnitTarget{
    pos: Vector;
    damage: (by: IUnitTarget)=>void;
}
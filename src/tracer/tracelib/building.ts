import { Vector } from "../../common/vector";

export const checkMap = (map: Array<Array<number>>, obj: Array<Array<number>>, { x, y }: Vector) => {
    /*
    map: массив из 96 строк и 96 столбцов, занятий 0 и 1. 1 - строить нельзя, 0 - можно
    obj: схема объекта
    [[0, 0, 0, 0]
     [0, 1, 1, 0]
     [1, 1, 1, 1]
     [1, 1, 1, 1]]
    */  
      const rowsInObj = obj.length;
      const columnsInObj = obj[0].length;
      if (y + rowsInObj > map.length) {
        throw 'There is no enough rows to place the object';
      };
      if (x + columnsInObj > map[0].length) {
        throw 'There is no enough columns to place the object';
      };
      const result: Array<Array<number>> = [];
      
    
      for (let rowIndex = 0; rowIndex < rowsInObj; rowIndex++) {
        result.push([]);
        for (let columnIndex = 0; columnIndex < columnsInObj; columnIndex++) {
          const cell = obj[rowIndex][columnIndex];
          if (cell === 0) {
            result[rowIndex].push(0);
            continue;
          }
          if (map[rowIndex + y][columnIndex + x] === 0) {
            result[rowIndex].push(0);
            continue;
          } else {
            result[rowIndex].push(1);
          }
        }
      }
      /*result - (если строительство возможно) массив вида: 
      [[0, 0, 0, 0]
       [0, 0, 0, 0]
       [0, 0, 0, 0]
       [0, 0, 0, 0]]
      */
      // console.log('checkMap: ',result);
      return result;
    }
    
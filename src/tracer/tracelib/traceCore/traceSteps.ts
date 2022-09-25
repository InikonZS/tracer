export const stepsOrthogonal = [
    {x: -1, y: 0}, 
    {x: 1, y: 0}, 
    {x: 0, y: 1}, 
    {x: 0, y: -1}
];

export const stepsDiagonal = [
    {x: -1, y: -1}, 
    {x: 1, y: 1}, 
    {x: -1, y: 1}, 
    {x: 1, y: -1}
];

export const steps = [...stepsOrthogonal, ...stepsDiagonal];
import {
  inclusionTransformation, exclusionTransformation
} from './transformations.js';

export default function transform(op, hb) {

  let firstIndependentIndex = hb.findIndex(oldOp => !isDependentOn(oldOp, op));

  if (firstIndependentIndex === -1) {
    return op;
  }

  const dependentOps = hb.slice(firstIndependentIndex).filter(oldOp => isDependentOn(oldOp, op));

  dependentOps.forEach(depOp => {
    const ind = hb.indexOf(depOp);
    for (let i = ind; i > firstIndependentIndex; i--) {
      const transposed = transpose(hb[i - 1], hb[i]);
      hb[i - 1] = transposed[0];
      hb[i] = transposed[1];
    }
    firstIndependentIndex++;
  });

  return hb.slice(firstIndependentIndex).reduce(
    (transformed, current) => inclusionTransformation(transformed, current), op);
}

function isDependentOn(op1, op2) {
  return op1.sv[op1.clientId] <= op2.sv[op1.clientId];
}

function transpose(op1, op2) {
  const transformed2 = exclusionTransformation(op2, op1);
  const transformed1 = inclusionTransformation(op1, transformed2);
  return [transformed2, transformed1];
}

function testIndependence(op1, op2) {
  return !(isDependentOn(op1, op2) || isDependentOn(op2, op1));
}

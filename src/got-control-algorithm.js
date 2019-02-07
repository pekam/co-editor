import {
  inclusionTransformation, exclusionTransformation,
  listInclusionTransformation
} from './transformations.js';

export default function transform(op, hb) {
  const firstIndependentIndex = hb.findIndex(oldOp => testIndependence(op, oldOp));

  if (firstIndependentIndex === -1) {
    return op;
  }

  const subList = hb.slice(firstIndependentIndex);
  const dependentOps = subList.filter(oldOp => isDependentOn(oldOp, op));

  if (dependentOps.length === 0) {
    return listInclusionTransformation(op, subList);
  }

  // TODO handle the dOPT puzzle case
  return op;
}


function testIndependence(op1, op2) {
  return !(isDependentOn(op1, op2) || isDependentOn(op2, op1));
}

function isDependentOn(op1, op2) {
  return op1.sv[op1.clientId] <= op2.sv[op1.clientId];
}

// GOTO algorithm helpers
function listTranspose(list) {
  const newList = [];
  for (var i = list.length - 1; i > 0; i--) {
    const transposed = transpose(list[i - 1], list[i]);
    newList[i - 1] = transposed[0];
    newList[i] = transposed[1];
  }
  return newList;
}

function transpose(op1, op2) {
  const transformed2 = exclusionTransformation(op2, op1);
  const transformed1 = inclusionTransformation(op1, transformed2);
  return [transformed2, transformed1];
}

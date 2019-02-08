import {
  inclusionTransformation, exclusionTransformation,
  listInclusionTransformation
} from './transformations.js';

export default function transform(op, hb) {
  const firstIndependentIndex = hb.findIndex(oldOp => testIndependence(op, oldOp));

  if (firstIndependentIndex === -1) {
    return op;
  }

  let subList = hb.slice(firstIndependentIndex);
  const dependentOps = subList.filter(oldOp => isDependentOn(oldOp, op));

  if (dependentOps.length === 0) {
    const result = listInclusionTransformation(op, subList);
    return result;
  }

  for (var i = 0; i < dependentOps.length; i++) {
    const ind = subList.findIndex(oldOp => isDependentOn(oldOp, op))
    listTranspose(subList, ind);
  }

  const l = hb.length;
  subList.forEach((oldOp, index) => {
    hb[firstIndependentIndex + index] = oldOp;
  });

  const result = listInclusionTransformation(
    op, subList.filter(oldOp => testIndependence(op, oldOp)));
  return result;
}


function testIndependence(op1, op2) {
  return !(isDependentOn(op1, op2) || isDependentOn(op2, op1));
}

function isDependentOn(op1, op2) {
  return op1.sv[op1.clientId] <= op2.sv[op1.clientId];
}

// GOTO algorithm helpers
function listTranspose(list, index) {
  // const newList = [];
  for (var i = index; i > 0; i--) {
    const transposed = transpose(list[i - 1], list[i]);
    list[i - 1] = transposed[0];
    list[i] = transposed[1];
  }
  // return newList;
}

function transpose(op1, op2) {
  const transformed2 = exclusionTransformation(op2, op1);
  const transformed1 = inclusionTransformation(op1, transformed2);
  return [transformed2, transformed1];
}

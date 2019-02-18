/**
 * Transforms the given operation to its execution form by using the
 * GOTO (General Operational Transformation Optimized) algorithm.
 * As a side effect modifies the history buffer.
 * 
 * @param {Object} op a causally ready operation, state vector timestamp stored in its property 'sv'
 * @param {Array} hb the history buffer
 * @param {Function} it the inclusion transformation function
 * @param {Function} et the exclusion transformation function
 * 
 * @return the execution form of op
 */
export default function transform(op, hb, it, et) {

  let firstIndependentIndex = hb.findIndex(oldOp => !isDependentOn(oldOp, op));

  if (firstIndependentIndex === -1) {
    return op;
  }

  const dependentOps = hb.slice(firstIndependentIndex).filter(oldOp => isDependentOn(oldOp, op));

  dependentOps.forEach(depOp => {
    const ind = hb.indexOf(depOp);
    for (let i = ind; i > firstIndependentIndex; i--) {
      const transposed = transpose(hb[i - 1], hb[i], it, et);
      hb[i - 1] = transposed[0];
      hb[i] = transposed[1];
    }
    firstIndependentIndex++;
  });

  return hb.slice(firstIndependentIndex).reduce(
    (transformed, current) => it(transformed, current), op);
}

function isDependentOn(op1, op2) {
  return op1.sv[op1.clientId] <= op2.sv[op1.clientId];
}

function transpose(op1, op2, it, et) {
  const transformed2 = et(op2, op1);
  const transformed1 = it(op1, transformed2);
  return [transformed2, transformed1];
}

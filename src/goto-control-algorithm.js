/**
 * Transforms the given operation to its execution form by using the
 * GOTO (General Operational Transformation Optimized) algorithm.
 * As a side effect modifies the log.
 * 
 * @param {Object} op a causally ready operation, state vector timestamp stored in its property 'stateVector'
 * @param {Array} log the log of executed operations (AKA history buffer)
 * @param {Function} it the inclusion transformation function
 * @param {Function} et the exclusion transformation function
 * 
 * @return the execution form of op
 */
export default function transform(op, log, it, et) {

  let firstIndependentIndex = log.findIndex(oldOp => !isDependentOn(oldOp, op));

  if (firstIndependentIndex === -1) {
    return op;
  }

  const dependentOps = log.slice(firstIndependentIndex).filter(oldOp => isDependentOn(oldOp, op));

  dependentOps.forEach(depOp => {
    const ind = log.indexOf(depOp);
    for (let i = ind; i > firstIndependentIndex; i--) {
      const transposed = transpose(log[i - 1], log[i], it, et);
      log[i - 1] = transposed[0];
      log[i] = transposed[1];
    }
    firstIndependentIndex++;
  });

  return log.slice(firstIndependentIndex).reduce(
    (transformed, current) => it(transformed, current), op);
}

function isDependentOn(op1, op2) {
  return op1.stateVector[op1.userId] <= op2.stateVector[op1.userId];
}

function transpose(op1, op2, it, et) {
  const transformed2 = et(op2, op1);
  const transformed1 = it(op1, transformed2);
  return [transformed2, transformed1];
}

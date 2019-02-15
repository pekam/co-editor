export function inclusionTransformation(op1, op2) {
  const copy = Object.assign({}, op1);
  if (op1.type === 'identity' || op2.type === 'identity') {
    return copy;
  }
  IT[`${op1.type}_${op2.type}`](copy, op2);
  return copy;
}

export function exclusionTransformation(op1, op2) {
  const copy = Object.assign({}, op1);
  if (op2.type === 'identity' || (op1.type === 'identity' && op2.type !== 'delete')) {
    return copy;
  }
  ET[`${op1.type}_${op2.type}`](copy, op2);
  return copy;
}

export function listInclusionTransformation(op, list) {
  return list.reduce((o, listOp) => inclusionTransformation(o, listOp), op);
}

export function listExclusionTransformation(op, list) {
  return list.reduce((o, listOp) => exclusionTransformation(o, listOp), op);
}

// Inclusion transformations
const IT = {
  insert_insert(op1, op2) {
    if (op1.index < op2.index) {
    } else if (op1.index === op2.index && op1.clientId > op2.clientId) {
    } else {
      op1.index++;
    }
  },

  insert_delete(op1, op2) {
    if (op1.index > op2.index) {
      op1.index--;
    }
  },

  delete_insert(op1, op2) {
    if (op1.index >= op2.index) {
      op1.index++;
    }
  },

  delete_delete(op1, op2) {
    if (op1.index > op2.index) {
      op1.index--;
    } else if (!(op2.disabledBy && op2.disabledBy.length) && op1.index === op2.index) {
      if (!op1.disabledBy) op1.disabledBy = [op2];
      else op1.disabledBy.push(op2);
    }
  }
}

// Exclusion transformations
const ET = {
  insert_insert(op1, op2) {
    if (op1.index > op2.index) {
      op1.index--;
    }
  },

  insert_delete(op1, op2) {
    if (op1.index > op2.index) {
      op1.index++;
    }
  },

  delete_insert(op1, op2) {
    if (op1.index >= op2.index) {
      op1.index--;
    }
  },

  delete_delete(op1, op2) {
    if (op1.index > op2.index) {
      op1.index++;
    }
    if (op1.disabledBy)
      op1.disabledBy = op1.disabledBy.filter(op => {
        const b = !opEquals(op, op2);
        return b;
      });
  },
}

function opEquals (op1, op2) {
  return op1.clientId === op2.clientId &&
    op1.sv[op1.clientId] === op2.sv[op2.clientId];
}

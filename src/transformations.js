export function inclusionTransformation(op1, op2) {
  const copy = Object.assign({}, op1);
  IT[`${op1.type}_${op2.type}`](copy, op2);
  return copy;
}

export function exclusionTransformation(op1, op2) {
  const copy = Object.assign({}, op1);
  ET[`${op1.type}_${op2.type}`](copy, op2);
  return copy;
}

// Inclusion transformations
const IT = {
  insert_insert(op1, op2) {
    if (op1.index < op2.index) {
    } else if (op1.index === op2.index && op1.userId > op2.userId) {
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
      op1.disabledBy = (op1.disabledBy || []).concat(op2);
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
      op1.disabledBy = op1.disabledBy.filter(op => !opEquals(op, op2));
  },
}

function opEquals(op1, op2) {
  return op1.userId === op2.userId &&
    op1.stateVector[op1.userId] === op2.stateVector[op2.userId];
}

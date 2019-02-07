/*
Note: The current implementation doesn't fully satisfy intention
preservation. It doesn't handle cases like when one operation
inserts into the range of a delete operation.
*/
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
    if (op1.index >= op2.index) {
      op1.index += op2.text.length;
    }
  },

  insert_delete(op1, op2) {
    if (op1.index > op2.index + op2.length) {
      op1.index -= op2.length;
    }
  },

  delete_insert(op1, op2) {
    if (op1.index > op2.index + op2.text.length) {
      op1.index += op2.text.length;
    }
  },

  delete_delete(op1, op2) {
    if (op1.index > op2.index + op2.length) {
      op1.index -= op2.length;
    }
  }
}

// Exclusion transformations
const ET = {
  insert_insert(op1, op2) {
    if (op1.index >= op2.index) {
      op1.index -= op2.text.length;
    }
  },

  insert_delete(op1, op2) {
    if (op1.index > op2.index + op2.length) {
      op1.index += op2.length;
    }
  },

  delete_insert(op1, op2) {
    if (op1.index > op2.index + op2.text.length) {
      op1.index -= op2.text.length;
    }
  },

  delete_delete(op1, op2) {
    if (op1.index > op2.index + op2.length) {
      op1.index += op2.length;
    }
  }
}

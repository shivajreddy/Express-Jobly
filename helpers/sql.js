const { BadRequestError } = require("../expressError");

/** Update SQL table when partial columns need to be updated
 * This is a "partial update" --- it's fine if data doesn't contain all the
 * fields; this only changes provided ones.
 *
 * @param {k1 : v1, k2 : v2, ...} dataToUpdate This req.body that is passed after qualifies relative json-schema
 * @param {k1 : v1, k2 : v2, ...} jsToSql Object with keys, In the model -> keys are the js names for columns, values are relative SQl column names
 * @returns
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };

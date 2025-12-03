const { Parser } = require('node-sql-parser');
const parser = new Parser();

function toMongoFilter(expr) {
  if (!expr) return {};
  if (expr.type === 'binary_expr') {
    const op = (expr.operator || '').toUpperCase();
    if (op === 'AND' || op === 'OR') {
      const l = toMongoFilter(expr.left);
      const r = toMongoFilter(expr.right);
      return op === 'AND' ? { $and: [l, r] } : { $or: [l, r] };
    }
    // left should be column
    const col = expr.left?.column || (expr.left?.expr?.column);
    let val = expr.right?.value !== undefined ? expr.right.value : expr.right;
    if (typeof val === 'string' && /^\d+$/.test(val)) val = Number(val);
    const map = {
      '=': val,
      '>': { $gt: val },
      '<': { $lt: val },
      '>=': { $gte: val },
      '<=': { $lte: val },
      '!=': { $ne: val },
      '<>': { $ne: val }
    };
    return { [col]: map[op] };
  }
  return {};
}

function extractTable(node) {
  if (node.table) return node.table.toLowerCase();
  if (Array.isArray(node.from) && node.from[0]?.table) return node.from[0].table.toLowerCase();
  return '';
}

function colName(c) { return c?.expr?.column || c?.column || c; }

function buildProjection(columns) {
  if (columns === '*' || columns === undefined) return undefined;
  const proj = {};
  for (const c of columns) {
    const as = c.as || colName(c);
    if (c.expr?.type === 'aggr_func') continue; // handled in group/proj
    const col = colName(c);
    if (col) proj[as] = `$${col}`;
  }
  return Object.keys(proj).length ? { $project: proj } : undefined;
}

function aggExpr(a) {
  const fn = (a.name || '').toUpperCase();
  const col = a.args?.expr?.column;
  if (fn === 'COUNT') {
    if (a.args?.expr?.type === 'star') return { $sum: 1 };
    return { $sum: { $cond: [{ $ifNull: [`$${col}`, false] }, 1, 0] } };
  }
  if (fn === 'SUM') return { $sum: `$${col}` };
  if (fn === 'AVG') return { $avg: `$${col}` };
  if (fn === 'MIN') return { $min: `$${col}` };
  if (fn === 'MAX') return { $max: `$${col}` };
  throw new Error(`Función agregada no soportada: ${fn}`);
}

function buildGroup(columns, groupby) {
  if (!groupby) return null;
  const id = {};
  const groupCols = Array.isArray(groupby) ? groupby : [groupby];
  groupCols.forEach(g => { id[g.column] = `$${g.column}`; });
  const group = { _id: id };
  // add aggregate fields requested in select
  if (Array.isArray(columns)) {
    for (const c of columns) {
      if (c.expr?.type === 'aggr_func') {
        const as = c.as || `${(c.expr.name || 'agg').toLowerCase()}_${c.expr.args?.expr?.column || 'all'}`;
        group[as] = aggExpr(c.expr);
      }
    }
  }
  const project = { $project: {} };
  // rebuild group-by columns as top-level fields
  for (const k of Object.keys(id)) project.$project[k] = `$_id.${k}`;
  // include agg fields
  for (const k of Object.keys(group)) {
    if (k === '_id') continue;
    project.$project[k] = `$${k}`;
  }
  return [{ $group: group }, project];
}

function buildSort(orderby) {
  if (!orderby) return undefined;
  const sort = {};
  for (const o of orderby) sort[o.expr.column] = o.type === 'DESC' ? -1 : 1;
  return { $sort: sort };
}

async function runSelect(mongoose, node) {
  // Support: single FROM with optional one JOIN ON equality; WHERE; GROUP BY; ORDER BY; LIMIT
  const from = node.from || [];
  if (!from.length) throw new Error('SELECT sin FROM');

  const main = from[0];
  const mainTable = main.table.toLowerCase();
  const coll = mongoose.connection.collection(mainTable);

  const pipeline = [];
  // WHERE on main before join if possible
  if (node.where && (!node.join || !node.join.length)) {
    pipeline.push({ $match: toMongoFilter(node.where) });
  }

  // JOIN: support one LEFT/INNER join with equality in ON
  const join = node.join && node.join[0];
  if (join) {
    const rightTable = join.table?.table?.toLowerCase?.() || join.table?.toLowerCase?.();
    const on = join.on;
    if (!(on && on.left?.column && on.right?.column)) throw new Error('JOIN ON no soportado (usa col = col)');
    const localField = on.left.column;
    const foreignField = on.right.column;
    pipeline.push({
      $lookup: {
        from: rightTable,
        localField,
        foreignField,
        as: '__join'
      }
    });
    if ((join.join === 'INNER JOIN') || (join.type && join.type.toUpperCase() === 'INNER')) {
      pipeline.push({ $unwind: '__join' });
    }
  }

  // WHERE after join (if present)
  if (node.where && pipeline.length && node.join && node.join.length) {
    pipeline.push({ $match: toMongoFilter(node.where) });
  }

  // GROUP BY
  if (node.groupby) {
    const grpStages = buildGroup(node.columns, node.groupby);
    if (grpStages) pipeline.push(...grpStages);
  } else {
    // Projection (non-aggregate)
    const proj = buildProjection(node.columns);
    if (proj) pipeline.push(proj);
  }

  // ORDER BY
  const sort = buildSort(node.orderby);
  if (sort) pipeline.push(sort);

  // LIMIT
  const limit = node.limit?.value ? Number(node.limit.value[0].value) : undefined;
  if (limit) pipeline.push({ $limit: limit });

  const docs = await coll.aggregate(pipeline).toArray();
  return docs;
}

async function runInsert(mongoose, node) {
  const table = extractTable(node);
  const coll = mongoose.connection.collection(table);
  const cols = node.columns.map(c => c.column);
  const vals = node.values[0].value.map(v => (v.value !== undefined ? v.value : v));
  const doc = {};
  cols.forEach((c, i) => doc[c] = vals[i]);
  if (doc.timestamp) doc.timestamp = new Date(doc.timestamp);
  const r = await coll.insertOne(doc);
  return { insertedId: r.insertedId };
}

async function runUpdate(mongoose, node) {
  const table = extractTable(node);
  const coll = mongoose.connection.collection(table);
  const filter = toMongoFilter(node.where);
  const set = {};
  node.set.forEach(s => { set[s.column] = s.value.value !== undefined ? s.value.value : s.value; });
  const r = await coll.updateMany(filter, { $set: set });
  return { matchedCount: r.matchedCount, modifiedCount: r.modifiedCount };
}

async function runDelete(mongoose, node) {
  const table = extractTable(node);
  const coll = mongoose.connection.collection(table);
  const filter = toMongoFilter(node.where);
  const r = await coll.deleteMany(filter);
  return { deletedCount: r.deletedCount };
}

async function runSQL(mongoose, sql) {
  const ast = parser.astify(sql);
  const node = Array.isArray(ast) ? ast[0] : ast;
  if (!node) throw new Error('SQL vacío');
  const type = node.type;
  if (type === 'select') return await runSelect(mongoose, node);
  if (type === 'insert') return await runInsert(mongoose, node);
  if (type === 'update') return await runUpdate(mongoose, node);
  if (type === 'delete') return await runDelete(mongoose, node);
  throw new Error(`Tipo SQL no soportado: ${type}`);
}

module.exports = { runSQL };

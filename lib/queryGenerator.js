const _ = require('lodash');
const Op = require('./op');
const { paramsType } = require('./utils/helper');

class QueryGenerator {
  constructor(params, options) {
    this.options = options;
    this.params = Object.assign({}, params);
    this.Op = new Op();
  }

  transferSqlFunc(method) {
    let sql = '';
    switch (method) {
      case 'select':
        sql += `${this.selectSql()}FROM ${this.tableSql()}${this.joinSql()}${this.whereSql()}${this.groupSql()}${this.havingSql()}${this.orderSql()}${this.limitSql()}${this.offsetSql()}`;
        break;
      case 'insert':
        sql += `INSERT INTO ${this.tableSql()}${this.insertSql()}`;
        break;
      case 'delete':
        sql
          += `DELETE FROM ${this.tableSql()}${this.whereSql()}${this.orderSql()}${this.limitSql()}`;
        break;
      case 'update':
        sql
          += `UPDATE ${this.tableSql()}${this.updateSql()}${this.whereSql()}${this.orderSql()}${this.limitSql()}`;
        break;
      default:
        break;
    }
    if (this.options.logging) console.info(sql);
    return sql;
  }

  tableSql(params = this.params.table) {
    const sql = `${params}`;
    return sql && `${sql} `;
  }

  updateSql(params = this.params.updateBody) {
    let sql = '';
    let paramsCount = Object.keys(params).length;
    for (const [key, value] of Object.entries(params)) {
      paramsCount -= 1;
      sql += `${key} = ${paramsType(value)}`;
      if (paramsCount !== 0) {
        sql += ' ,';
      }
      sql += ' ';
    }
    return sql && `SET ${sql}`;
  }

  insertSql(params = this.params.insertBody) {
    let sql = '';
    let keys = [];
    const values = [];

    // todo bulkCreate keys is first object's keys
    keys = Object.keys(params[0]);
    for (const v of params) {
      const tempValues = keys.map(key => paramsType(v[key]) || 'NULL');
      values.push(`(${tempValues.join(', ')})`);
    }
    sql += `(${keys}) 
    values 
    ${values.join(', ')}`;

    return sql && `${sql} `;
  }

  /**
     * select sql
     * @param {*} param
     */
  selectSql(param = this.params.select) {
    let sql = '';
    if (param.length > 0) {
      sql += `SELECT ${param.join(', ')}`;
    } else {
      sql += 'SELECT *';
    }
    return sql && `${sql} `;
  }

  /**
         * order sql
         * @param {*} param
         */
  orderSql(param = this.params.order) {
    let sql = '';
    if (param.length > 0) {
      sql += `ORDER BY ${param.join(', ')}`;
    }
    return sql && `${sql} `;
  }

  /**
         * group sql
         * @param {*} param
         */
  groupSql(param = this.params.group) {
    let sql = '';
    if (param.length > 0) {
      sql += `GROUP BY ${param.join(', ')}`;
    }
    return sql && `${sql} `;
  }

  /**
         * having sql
         * @param {*} param
         */
  havingSql(param = this.params.having) {
    let sql = '';
    if (param.length > 0) {
      sql += `HAVING ${param.join(', ')}`;
    }
    return sql && `${sql} `;
  }

  /**
         * offset sql
         * @param {*} params
         */
  offsetSql(param = this.params.offset) {
    let sql = '';
    if (param > 0) {
      sql += `OFFSET ${param}`;
    }
    return sql && `${sql} `;
  }

  /**
         * limit sql
         * @param {*} param
         */
  limitSql(param = this.params.limit) {
    let sql = '';
    if (param > 0) {
      sql += `LIMIT ${param}`;
    }
    return sql && `${sql} `;
  }

  /**
         * where sql
         * @param {*} params
         */
  whereSql(param = this.params.where) {
    let sql = '';
    const whereOp = (tempParam, conj = 'AND') => {
      if (tempParam[undefined]) { throw new Error('Where key can\'t equal undefined!'); }
      let tempSql = '';
      if (tempParam[this.Op.or]) tempSql += `(${whereOp(tempParam[this.Op.or], 'OR')})`;
      if (tempParam[this.Op.and]) tempSql += `(${whereOp(tempParam[this.Op.and], 'AND')})`;
      for (const [key, value] of Object.entries(tempParam)) {
        // add conj
        if (tempSql.length !== 0) tempSql += ` ${conj} `;
        if (_.isArray(value)) { // Op function
          if (value[0] === this.Op.pure) {
            tempSql += `${value[1]}`;
          } else if (value[0] === this.Op.flag) {
            tempSql += `${key} ${value[1]}`;
          } else {
            throw new Error('Where params cant input array!');
          }
        } else if (_.isObject(value)) {
          tempSql += (whereOp(value));
        } else if (_.isString(value)) { // string
          tempSql += (`${key} = '${_.escape(value)}'`);
        } else if (_.isNumber(value)) { // Number
          tempSql += (`${key} = ${_.escape(value)}`);
        } else {
          throw new Error('Where params must db.function() or String or Number!');
        }
      }// for
      return tempSql;
    };
    sql += whereOp(param);
    if (sql.length !== 0) sql = `WHERE ${sql}`;
    return sql && `${sql} `;
  }

  /**
         * join sql
         * @param {*} params
         */
  joinSql(params = this.params.join) {
    let sql = '';
    Object.values(params).map((join) => {
      sql += `${join.direction ? `${join.direction} ` : ''}JOIN ${join.table} ON ${join.on} `;
      return true;
    });
    return sql && `${sql}`;
  }
}

module.exports = QueryGenerator;
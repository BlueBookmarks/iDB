const [
  PackageData, DbNameVerify, ReturnMultiplexing, KeyRangeSplice
] = [
  Symbol('PackageData'), Symbol('DbNameVerify'), Symbol('ReturnMultiplexing'), Symbol('KeyRangeSplice')
]

export default {
  /* indexedDB 浏览器对象兼容处理 */
  // eslint-disable-next-line no-undef
  indexedDB: window.indexedDB || window.webkitindexedDB || window.msIndexedDB || window.mozIndexedDB,
  /**
   * IDBKeyRange
   * IDBKeyRange.only(value):只获取指定数据
   * IDBKeyRange.lowerBound(value,isOpen)：获取最小是value的数据，第二个参数用来指示是否排除value值本身 (value, ∞)
   * IDBKeyRange.upperBound(value,isOpen)：获取最大是value的数据，第二个参数用来指示是否排除value值本身 (∞, value)
   * IDBKeyRange.bound(value1,value2,isOpen1,isOpen2)：取最大最小区间，3，4参数指示是否排除value本身 (value1, value2)
   */
  IDBKeyRange: window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange,
  // indexedDb事务
  IDBTransaction: window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"},
  // db实例
  DBResult: null,
  /**
   * 私有化方法 调用传入回调
   * @param {Function} func 回调方法
   * @param {Number} status 0：失败  1: 成功  2：更新/创建
   * @param {Object} data 回调获取到的数据
   * @param {String} description 回调描述
   * @returns {Object} 封装后返回的数据
   */
  [PackageData] (func, data, status, description = "") {
    if (func && (typeof func === 'function')) {
      func({status, data, info: 'indexedDB', description})
    }
  },
  /**
   * 私有化方法 判断是否传入数据库名
   * @param {String} judge 判断依据
   * @param {String} name 需判断参数名
   * @returns {Boolean} true/false
   */
  [DbNameVerify] (judge, name) {
    if (!judge) {
      if (name == 'db') {
        console.error(`数据库实例未创建，请先连接/创建数据库`)
        return false
      }
      console.error(`找不到${name}，缺少对应值`)
      return false
    }
    return true
  },
  /**
   * 私有化方法 添加数据时重复回调整合
   * @param {Object} returnData 需要回调的值集合
   * @param {Function} complete 需要触发的回调函数
   */
  [ReturnMultiplexing] (returnData, complete) {
    /** 调用记录器，是否触发回调  */
    if (returnData.successfully + returnData.failed == returnData.count) {
      this[PackageData] (complete, returnData, 1, returnData.prompt)
    }
  },
  /**
   * IDBKeyRange 方法整合拼接
   * @param {*} param0
   * @param {Number} [param0.min] 最小值
   * @param {Number} [param0.max] 最大值
   * @param {Boolean} [param0.minOpen] 最小值是否包括
   * @param {Boolean} [param0.maxOpen] 最大值是否包括
   */
  [KeyRangeSplice] ({min, max, minOpen = false, maxOpen = false}) {
    if (min && max) {
      return this.IDBKeyRange.bound(min, max, minOpen, maxOpen)
    } else if (min) {
      return this.IDBKeyRange.lowerBound(min, minOpen)
    } else if (max) {
      return this.IDBKeyRange.upperBound(max, maxOpen)
    } else {
      console.error('未获取到对应的区间值')
      return false
    }
  },
  /**
   * indexedDB 打开和创建数据库操作
   * @param {Object} args
   * @param {String} [args.name] 数据库名
   * @param {Number} [args.version = 1] 数据库版本号，默认1
   * @param {Function} [args.success] 成功回调函数
   * @param {Function} [args.update] 更新回调函数
   * @param {Function} [args.fail] 失败回调函数
   * */
  openDB ({name, version = 1, success, update, fail} = {}) {
    if (!this[DbNameVerify](name, 'name')) return
    let self = this
    let request = self.indexedDB.open(name, version)
    // 打开失败
    request.onerror = function (event) {
      self[PackageData] (fail, event, 0, '数据库打开失败')
    }
    // 打开成功
    request.onsuccess = function (event) {
      self.DBResult = event.target.result
      self[PackageData] (success, event, 1, '数据库打开成功')
    }
    /* 1.指定的版本号，大于数据库的实际版本号，就会发生数据库升级事件
      2.新建数据库与打开数据库是同一个操作。如果指定的数据库不存在，就会新建 */
    request.onupgradeneeded = function (event) {
      self.DBResult = event.target.result
      self[PackageData] (update, event, 2, '数据库需要创建/数据库升级')
    }
  },
  /**
   * 删除数据库(删除数据库前要先关闭数据库 closeDB)
   * @param {Object} param0
   * @param {String} [param0.name] 数据库名
   * @param {Function} [param0.success] 数据库名
   * @param {Function} [param0.fail] 数据库名
   */
  deleteDB ({name, success, fail}) {
    if (!this[DbNameVerify](name, 'name')) return
    let self = this
    var deleteQuest = self.indexedDB.deleteDatabase(name)
    deleteQuest.onerror = function () {
      self[PackageData] (fail, null, 2, '数据库删除失败')
    }
    deleteQuest.onsuccess = function () {
      self[PackageData] (success, null, 1, '数据库删除成功')
    }
  },
  /**
   * 关闭数据库
   */
  closeDB () {
    let db = this.DBResult
    if (!this[DbNameVerify](this.DBResult, 'db')) return
    db.close()
    this.DBResult = null
    console.log('数据库已关闭')
  },
  /**
   * 添加/更新数据
   * @param {*} param0
   * @param {String} [param0.table] 数据库表名
   * @param {Object|Array} [param0.data] 需要添加的数据
   * @param {Function} [param0.complete] 添加完成后的回调
   */
  addDataDB ({table, data, complete}) {
    let db = this.DBResult
    if (!this[DbNameVerify](table, 'table') || !this[DbNameVerify](db, 'db')) return
    let request = db.transaction([table], 'readwrite').objectStore(table)
    // 返回数据组合
    let returnData = {
      successfully: 0,
      successfullyInfo: [],
      failed: 0,
      failedInfo: [],
      count: 0,
      prompt: '添加/更新数据完成'
    }
    // 计数器 记录需要触发多少次回调
    if (data && Array.isArray(data)) {
      returnData.count = data.length
    } else if (data && typeof data == 'object') {
      returnData.count = 1
      data = [data]
    } else {
      console.error('请传入正确的data值')
      return false
    }
    // 触发添加
    for (let item of data) {
      let callbackVal = request.put(item)
      // 添加数据成功
      callbackVal.onsuccess = (event) => {
        returnData.successfully += 1
        returnData.successfullyInfo.push(event)
        this[ReturnMultiplexing](returnData, complete)
      }
      // 添加数据失败
      callbackVal.onerror = (event) => {
        returnData.failed += 1
        returnData.failedInfo.push(event)
        this[ReturnMultiplexing](returnData, complete)
      }
    }
  },
  /**
   * 删除数据 (set 和 interval 只需要传一个，优先取interval值)
   * @param {*} param0
   * @param {String} [param0.table] 数据库表名
   * @param {Array|Number|String} [param0.set] 需要删除的key值 可使用数组
   * @param {Object} [param0.interval] 需要删除的区间值 eg:{min, max, minOpen, maxOpen} 具体可参考私有方法[KeyRangeSplice]
   * @param {Function} [param0.complete] 删除完成后的回调
   */
  deleteDataDB ({table, set, interval = null, complete}) {
    let db = this.DBResult
    if (!this[DbNameVerify](table, 'table') || !this[DbNameVerify](db, 'db')) return
    let request = db.transaction([table], 'readwrite').objectStore(table)
    // 返回数据组合
    let returnData = {
      successfully: 0,
      successfullyInfo: [],
      failed: 0,
      failedInfo: [],
      count: 0,
      prompt: '删除数据完成'
    }
    if (interval) {
      // IDBKeyRange 删除
      let deleteKeys = this[KeyRangeSplice](interval)
      if (!deleteKeys) return false
      // 调用删除
      returnData.count = 1
      let callbackVal = request.delete(deleteKeys)
      // 添加数据成功
      callbackVal.onsuccess = (event) => {
        returnData.successfully += 1
        returnData.successfullyInfo.push(event)
        this[ReturnMultiplexing](returnData, complete)
      }
      // 添加数据失败
      callbackVal.onerror = (event) => {
        returnData.failed += 1
        returnData.failedInfo.push(event)
        this[ReturnMultiplexing](returnData, complete)
      }
    } else {
      if (Array.isArray(set)) {
        // 数组重复删除
        returnData.count = set.length
      } else if (['number', 'string'].includes(typeof set)) {
        // 单个key值删除
        returnData.count = 1
        set = [set]
      } else {
        console.error('请传入正确的set值')
        return false
      }

      set.forEach(val => {
        let callbackVal = request.delete(val)
        // 添加数据成功
        callbackVal.onsuccess = (event) => {
          returnData.successfully += 1
          returnData.successfullyInfo.push(event)
          this[ReturnMultiplexing](returnData, complete)
        }
        // 添加数据失败
        callbackVal.onerror = (event) => {
          returnData.failed += 1
          returnData.failedInfo.push(event)
          this[ReturnMultiplexing](returnData, complete)
        }
      })
    }
  },
  /**
   * 查询key值
   * @param {*} param0
   * @param {String} [param0.table] 表名
   * @param {String|Number} [param0.key] key值
   * @param {Function} [param0.success] 成功回调
   * @param {Function} [param0.error] 失败回调
   */
  getKeyInfo ({table, key, success, error}) {
    let db = this.DBResult
    if (!this[DbNameVerify](table, 'table') || !this[DbNameVerify](db, 'db')) return
    let request = db.transaction(table).objectStore(table)
    let selectKey = request.get(key)
    selectKey.onerror = () => {
      this[PackageData] (error, null, 1, '查询失败')
    }

    selectKey.onsuccess = (res) => {
      if (res.target.result) {
        this[PackageData] (success, res.target.result, 1, '查询成功')
      } else {
        this[PackageData] (success, res.target.result, 1, '未查询到对应数据')
      }
    }
  },
  /**
   * 索引查询数据
   * @param {*} param0
   * @param {String} [param0.table] 表名
   * @param {String} [param0.index] 索引名
   * @param {String|Array|Number} [param0.value] 索引值
   * @param {Function} [param0.complete] 索引查询完成后的回调
   */
  retrieveIndex ({table, index, value, complete}) {
    let db = this.DBResult
    if (!this[DbNameVerify](table, 'table') || !this[DbNameVerify](db, 'db')) return
    let request = db.transaction(table).objectStore(table)
    let indexObj = request.index(index)
    // 返回数据组合
    let returnData = {
      successfully: 0,
      successfullyInfo: [],
      failed: 0,
      failedInfo: [],
      count: 0,
      prompt: '索引查询完成'
    }
    // 获取index下数组
    if (Array.isArray(value)) {
      returnData.count = value.length
    } else if (value) {
      returnData.count = 1
      value = [value]
    } else {
      console.error('请传入正确的value值')
      return false
    }

    value.forEach(item => {
      let request = indexObj.get(item)
      request.onsuccess = (res) => {
        let req = res.target.result
        if (req) {
          returnData.successfully += 1
          returnData.successfullyInfo.push(req)
          this[ReturnMultiplexing](returnData, complete)
        } else {
          returnData.failed += 1
          returnData.failedInfo.push({ info: '未获取到数据', getData: item })
          this[ReturnMultiplexing](returnData, complete)
        }
      }

      request.onerror = () => {
        returnData.failed += 1
        returnData.failedInfo.push({ info: '事务失败' })
        this[ReturnMultiplexing](returnData, complete)
      }
    })
  },

  /**
   * 查询所有数据
   * @param {*} param0
   * @param {String} [param0.table] 表名
   * @param {Boolean} [param0.pagination] 分页开关 默认关 false
   * @param {Number} [param0.page] 分页数 默认为0
   * @param {Number} [param0.count] 返回数据量 默认为10
   * @param {Function} [param0.success] 成功回调
   * @param {Function} [param0.error] 失败回调
   */
  queryAll ({table, pagination = false, page = 0, count = 10, success, error}) {
    let db = this.DBResult
    if (!this[DbNameVerify](table, 'table') || !this[DbNameVerify](db, 'db')) return
    let request = db.transaction(table).objectStore(table).openCursor()
    let requestAllData = []
    let [start, end, counter] = [page * count, (page + 1) * count, 0]

    request.onsuccess = (res) => {
      let cursorData = res.target.result
      if (cursorData) {
        if (pagination) {
          if (counter >= start && counter < end) {
            requestAllData.push(cursorData.value)
            if (counter == (end - 1)) {
              this[PackageData] (success, requestAllData, 1, '数据查询完成')
            } else {
              cursorData.continue()
            }
          } else if (counter < start) {
            counter++
            cursorData.continue()
          }
        } else {
          requestAllData.push(cursorData.value)
          cursorData.continue()
        }
      } else {
        this[PackageData] (success, requestAllData, 1, '数据查询完成')
      }
    }

    request.onerror = (err) => {
      this[PackageData] (error, err, 1, '事务失败')
    }
  },
  /**
   * 清空数据
   * @param {*} param0
   * @param {String} [param0.table] 表名
   * @param {Function} [param0.success] 成功回调
   * @param {Function} [param0.error] 失败回调
   */
  clearAll ({table, success, error}) {
    let db = this.DBResult
    if (!this[DbNameVerify](table, 'table') || !this[DbNameVerify](db, 'db')) return
    let store = db.transaction(table, 'readwrite').objectStore(table).clear()
    store.onsuccess = () => {
      this[PackageData] (success, null, 1, '数据已清空')
    }
    store.onerror = () => {
      this[PackageData] (error, null, 1, '事务失败')
    }
  }
}

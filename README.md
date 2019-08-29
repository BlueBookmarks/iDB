# 基于indexedDB的封装iDB

引入JS到需要的项目中即可使用

例： `import iDB from './iDB'`

所有针对表的操作，需要连接数据库

## 目录

[连接和创建数据库](#连接和创建数据库)

[删除数据库](#删除数据库)

[关闭数据库](#关闭数据库)

[添加/更新数据](#添加/更新数据)

[删除数据](#删除数据)

[根据key查询对应值](#根据key查询对应值)

[索引查询数据](#索引查询数据)

[查询所有数据](#查询所有数据)

[清除所有数据](#清除所有数据)

***

## 连接和创建数据库

`iDB.openDB({name, version = 1, success, update, fail})`

|参数名|类型|描述|
|-|-|-|
|name|String|数据库名|
|version|Number|数据库版本号，默认1|
|success|Function|数据库打开成功回调函数|
|update|Function|数据库升级回调函数|
|fail|Function|数据库打开失败回调函数|

触发update的2个场景：

1. 如果指定的版本号，大于数据库的实际版本号，就会发生数据库升级事件

2. 如果指定的数据库不存在，就会新建，这时版本从无到有，所以会触发这个事件

注意： 因为2个操作都是触发同一个回调，新建表时最好的写法是先判断这张表是否存在再创建 `db.objectStoreNames.contains('info')`

示例代码：

```javascript
let databaseCreate = () => {
  let self = this
  iDB.openDB({
    name: 'todo',
    success (res) {
      console.log(res.data.target.result)
    },
    update (res) {
      let db = res.data.target.result
      if (!db.objectStoreNames.contains('info')) {
        // 创建表 和 key
        let objectStore = db.createObjectStore('info', { keyPath: 'id' })
        // 创建索引
        objectStore.createIndex('date', 'date', { unique: true })
        objectStore.createIndex('content', 'content', { unique: false })
        objectStore.createIndex('status', 'status', { unique: false })
      }
    }
  })
}
```

***

## 删除数据库

`iDB.deleteDB ({name, success, fail})`

|参数名|类型|描述|
|-|-|-|
|name|String|数据库名|
|success|Function|数据库删除成功回调函数|
|fail|Function|数据库删除失败回调函数|

注意： 删除数据库前要先关闭数据库

示例代码：

```javascript
let databaseDelete = () => {
  iDB.deleteDB({
    name: 'todo',
    success (res) {
      console.log(res)
    },
    fail (err) {
      console.log(err)
    }
  })
}
```

***

## 关闭数据库

`iDB.closeDB ()`

示例代码：

```javascript
let databaseClose = () => {
  iDB.closeDB()
}
```

***

## 添加/更新数据

`iDB.addDataDB ({table, data, complete})`

|参数名|类型|描述|
|-|-|-|
|table|String|数据库表名|
|data|Object/Array|需要添加的数据|
|complete|Function|添加完成后的回调|

注意： 如果需要添加多条数据，data请用数组包裹

示例代码：

```javascript
// 添加
let databaseAdd = () => {
  let data = {
    id: 0,
    date: '2019-8-12 15:00:00',
    content: '测试数据',
    status: 0
  }
  iDB.addDataDB({
    table: 'info',
    data: data,
    complete (res) {
      console.log(res)
    }
  })
}

// 更新
let databasePut = () => {
  let data = [
    {
      id: 0,
      date: '2019-8-12 15:00:00',
      content: '测试数据123',
      status: 0
    },
    {
      id: 1,
      date: '2019-8-12 15:00:02',
      content: '测试数据111',
      status: 1
    }
  ]
  iDB.addDataDB({
    table: 'info',
    data: data,
    complete (res) {
      console.log(res)
    }
  })
}
```

***

## 删除数据

`iDB.deleteDataDB ({table, set, interval = null, complete})`

|参数名|类型|描述|
|-|-|-|
|table|String|数据库表名|
|set|Object/Array/String|需要删除的key值 可使用数组|
|interval|Object|需要删除的key区间值 默认为Null eg:{min, max, minOpen, maxOpen}|
|complete|Function|删除完成后的回调|

注意： interval是一个key的区间值

1. {min: 1} 表示 [1, ∞)
2. {min: 1, minOpen: true} 表示 (1, ∞)
3. {min: 1, minOpen: true, max: 5} 表示 (1, 5]
4. {min: 1, minOpen: true, max: 5, maxOpen: true} 表示 (1, 5)

参考链接 [IDBKeyRange 对象](https://wangdoc.com/javascript/bom/indexeddb.html#idbkeyrange-%E5%AF%B9%E8%B1%A1)

示例代码：

```javascript
// 删除key<=2的数据
let databaseDataDelete = () => {
  iDB.deleteDataDB({
    table: 'info',
    interval: {
      max: 2,
      maxOpen: false
    },
    complete (res) {
      console.log(res)
    }
  })
}
```

***

## 根据key查询对应值

`iDB.getKeyInfo ({table, key, success, error})`

|参数名|类型|描述|
|-|-|-|
|table|String|数据库表名|
|key|Number/String|查询的key值|
|success|Function|查询成功后的回调|
|error|Function|查询失败后的回调|

示例代码：

```javascript
let databaseSelectKey = () => {
  iDB.getKeyInfo({
    table: 'info',
    key: 1,
    success (res) {
      console.log(res)
    }
  })
}
```

***

## 索引查询数据

`iDB.retrieveIndex ({table, index, value, complete})`

|参数名|类型|描述|
|-|-|-|
|table|String|数据库表名|
|index|Number/String|索引名|
|value|String/Array/Number|索引值|
|complete|Function|索引查询完成后的回调|

注意： 索引值可以传数组

示例代码：

```javascript
let databaseGetIndex = () => {
  iDB.retrieveIndex({
    table: 'info',
    index: 'content',
    value: ['测试数据123', '测试数据111'],
    complete (res) {
      console.log(res)
    }
  })
}
```

***

## 查询所有数据

`iDB.queryAll({table, pagination = false, page = 0, count = 10, success, error})`

|参数名|类型|描述|
|-|-|-|
|table|String|数据库表名|
|pagination|Boolean|分页开关 默认关 false|
|page|Number|分页数 默认为0 （需要pagination： true）|
|count|Number|返回数据量 默认为10 （需要pagination： true）|
|success|Function|成功回调|
|error|Function|失败回调|

示例代码：

```javascript
// 查询所有
let databaseSelectAll = () => {
  iDB.queryAll({
    table: 'info',
    pagination: true,
    page: 1,
    count: 1,
    success (res) {
      console.log(res)
    }
  })
}
```

***

## 清除所有数据

`iDB.clearAll ({table, success, error})`

|参数名|类型|描述|
|-|-|-|
|table|String|数据库表名|
|success|Function|成功回调|
|error|Function|失败回调|

示例代码：

```javascript
let databaseClearAll = () => {
  iDB.clearAll({
    table: 'info',
    success (res) {
      console.log(res)
    }
  })
}
```

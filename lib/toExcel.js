const xlsx = require('xlsx');
const fs = require('fs');
const _path = require('path');
const glob = require('glob');
const { getLangMsgsMap } = require('./existMsgLang.js');

// 异步读取文件内容
const readContent = (file, existedLangMsgMap) => new Promise((resolve, reject) => {
        fs.readFile(file['url'], (err, data) => {
            if (err) {
                console.log('文件读取失败');
                reject(err);
            } else {
                const regx = /.*defineMessages\(((.|\n)*)\);/g;
                const jsonStr = regx.exec(data.toString());
                // 将字符串转换为js对象
                const json = eval("("+jsonStr[1]+")");
                const f = [];
                // 组装Excel数据结构
                for(i in json) {
                    const enMsg = existedLangMsgMap['en'][json[i]['id']];
                    const zhTwMsg = existedLangMsgMap['zh-TW'][json[i]['id']];
                    f.push({    
                            key: json[i]['id'],
                            中文: json[i]['defaultMessage'],
                            英文: enMsg ? enMsg : '',
                            繁体: zhTwMsg ? zhTwMsg : '',
                        }
                    );
                }
                f.path = file.dir;
                resolve(f);
            }
        });
    });

  const isAllEqual = array => {
        if(array.length > 0) {
           return !array.some(function(value,index){
             return value !== array[0];
           });   
        } else {
            return true;
        }
    }

const exportExcel = (src_dir, excel_name, lang_dir) => {
  /**
   * 根据路径模式匹配指定目录下的messages文件
   */
  const files = glob.sync(_path.join(src_dir, '**/messages'));
  const msgFiles = files.map(filepath => ({
      dir: filepath.slice(filepath.indexOf('src')),
      url:_path.join(filepath, 'index.js')
  }));
  console.log(msgFiles.length);

  const existedMap = getLangMsgsMap(lang_dir);

  /**
   * 将异步读取messages文件的Promise存到队列中
   */
  const dataArr = [];
  msgFiles.forEach(file => {
      dataArr.push(readContent(file, existedMap));
    });
  const dataList = Promise.all(dataArr);

  /**
   * 设置excel表头
   */
  const _headers = ['key', '中文', '英文', '繁体'];
  const headers = _headers.map((v, i) => Object.assign({}, {v: v, position: String.fromCharCode(65+i) + 2 }))
                      .reduce((prev, next) => Object.assign({}, prev, {[next.position]: {v: next.v}}), {});

  const formatData = data => data.map((v, i) => _headers.map((k, j) => Object.assign({}, {    v: v[k], position: String.fromCharCode(65+j) + (i+3) })))
  .reduce((prev, next) => prev.concat(next))
  .reduce((prev, next) => Object.assign({}, prev, {[next.position]: {v: next.v}}), {});

  const wb = {
      SheetNames: [],
      Sheets: {}
  };

  const title = [];
  dataList.then(result => {
      const moduleMap = {}; 
      const modulesArr = [];
      result.forEach((data, i) => {
          const modules = data.map(item => item.key.slice(0, item.key.indexOf('.')));
          const firstKey = data[0]['key'];
          const moduleName = firstKey.slice(0, firstKey.indexOf('.'));
          // 将同一根路径下的msg合并到同一个excel
          // 相同且不存在key
          if (isAllEqual(modules)) {
              if (!moduleMap[moduleName]) {
                  moduleMap[moduleName] = data;
              } else {
                  moduleMap[moduleName] = moduleMap[moduleName].concat(data)
              }
          } else {
              data.forEach(item => {
                  const module = item.key.slice(0, item.key.indexOf('.'));
                  if (!moduleMap[module]) {
                      moduleMap[module] = [];
                      moduleMap[module].push(item);
                  } else {
                      moduleMap[module].push(item);
                  }
              })
          }
      });
      const moduleKeysArr = Object.keys(moduleMap);
      moduleKeysArr.forEach(key => {
          moduleMap[key]['filename'] = key;
          modulesArr.push(moduleMap[key]);
      });
      return modulesArr;
  }).then(result => {
      result.forEach((data, i) => {
          title[0] = `模块: ${data.filename}`;
          // 获取模块文件名
          const fileName = data.filename;
          const _title = title.map((v, i) => Object.assign({}, {v: v, position:           String.fromCharCode(65+i) + 1 }))
          .reduce((prev, next) => Object.assign({}, prev, {[next.position]: {v: next.v}}), {});

          // 合并 headers 和 data
          const output = Object.assign({}, _title, headers, formatData(data));
          // 获取所有单元格的位置
          const outputPos = Object.keys(output);
          // 计算出范围
          const ref = outputPos[0] + ':' + outputPos[outputPos.length - 1];
          wb.SheetNames.push(fileName);
          wb.Sheets[fileName] = Object.assign({}, output, { '!ref': ref });
      });
      
      // 导出 Excel
      xlsx.writeFile(wb, `${excel_name}.xlsx`);
  });
};

module.exports = {
    exportExcel
};  
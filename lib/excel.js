const xlsx = require('xlsx');
const fs = require('fs');
const _path = require('path');
const glob = require('glob');
const { getLangMsgsMap } = require('./existMsg.js');

/**
 * 异步读取文件内容
 * @param {String} file 文件路径信息
 * @param {Object} existedLangMsgMap 已翻译过的messages
 */
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
              // f 存放每个messages文件中的excel所要求结构的数据
              const f = [];
              // 组装Excel数据结构
              for(i in json) {
                  // i : message key
                  const enMsg = existedLangMsgMap['en'][json[i]['id']];
                  const zhTwMsg = existedLangMsgMap['zh-TW'][json[i]['id']];
                  f.push({
                          key: json[i]['id'],
                          中文: json[i]['defaultMessage'],
                          英文: enMsg || '',
                          繁体: zhTwMsg || '',
                      }
                  );
              }
              f.path = file.dir;
              resolve(f);
          }
      });
  });

/**
 * 
 * @param {Array} array 是否完全相同
 */
const isAllEqual = array => {
    if(array.length > 0) {
        return !array.some(function(value,index){
            return value !== array[0];
        });   
    } else {
        return true;
    }
};

/**
 * 获取读取文件内容的Promise数组
 * @param {String} src_dir message源目录
 * @param {String} lang_dir 项目多语言目录
 */
const getAsyncReadList = (src_dir, lang_dir) => {
  const dataArr = [];
  const files = glob.sync(_path.join(src_dir, '**/messages'));
  const msgFiles = files.map(filepath => ({
      dir: filepath.slice(filepath.indexOf('src')),
      url:_path.join(filepath, 'index.js')
  }));
  const existedMap = getLangMsgsMap(lang_dir);
  console.log(msgFiles.length);
  msgFiles.forEach(file => {
      dataArr.push(readContent(file, existedMap));
    });
  return Promise.all(dataArr);
};

/**
 * 
 * @param {Array} filesData 按模块归类后的数据
 */
const classfyModuleData = filesData => {
  // 模块与对应的excel sheet数据的映射
  const moduleMap = {}; 
  const modulesArr = [];
  // data Array 每个message文件格式化为excel可以解析结构的数组
  filesData.forEach(data => {
    // 获取文件中message的模块
    const modules = data.map(item => item.key.slice(0, item.key.indexOf('.')));
    // 获取模块名
    // Global.kryComponent.reload  modules: Global
    const moduleName = modules[0];
    // 将同一根路径下的msg合并到同一个excel
    // 该文件下的message均属于相同的模块 
    if (isAllEqual(modules)) {
        //相同且不存在key
        if (!moduleMap[moduleName]) {
            moduleMap[moduleName] = data;
        } else {
            moduleMap[moduleName] = moduleMap[moduleName].concat(data)
        }
    } else {
        data.forEach(item => {
            const module = item.key.slice(0, item.key.indexOf('.'));
            if (!moduleMap[module]) {
                moduleMap[module] = [item];
                // moduleMap[module].push(item);
            } else {
                moduleMap[module].push(item);
            }
        })
    }
  });

  const moduleNames = Object.keys(moduleMap);
        moduleNames.forEach(key => {
          moduleMap[key].filename = key;
          modulesArr.push(moduleMap[key]);
        });
  return modulesArr;
};

/**
 * 
 * @param {Array} sheetsData 
 * @param {String} excel_name 
 */
const buildExcel = (sheetsData, excel_name) => {
  const title = [];
  const wb = {
    SheetNames: [],
    Sheets: {}
  };
  // 设置excel表头
  const _headers = ['key', '中文', '英文', '繁体'];
  const headers = _headers
                      .map((v, i) => Object.assign({}, {v: v, position: String.fromCharCode(65+i) + 2 }))
                      .reduce((prev, next) => Object.assign({}, prev, {[next.position]: {v: next.v}}), {});
  const formatData = data => data.map((v, i) => _headers.map((k, j) => Object.assign({}, { v: v[k], position: String.fromCharCode(65+j) + (i+3) })))
  .reduce((prev, next) => prev.concat(next))
  .reduce((prev, next) => Object.assign({}, prev, {[next.position]: {v: next.v}}), {});

  sheetsData.forEach(data => {
    const fileName = data.filename;
    title[0] = `模块: ${fileName}`;
    // 获取模块文件名
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
};

/**
 * 
 * @param {String} src_dir message源目录
 * @param {String} excel_name excel命名
 * @param {String} lang_dir 项目多语言目录
 */
const exportExcel = (src_dir, excel_name, lang_dir) => {
  const dataList = getAsyncReadList(src_dir, lang_dir);
        dataList.then(res => classfyModuleData(res))
                .then(res => {
                    buildExcel(res, excel_name);
                });
  };

module.exports = {
    exportExcel
};  
const { getAllSheetsJson } = require('./jsonResolver');
const langConfig = require('./lang.config.json');
const path  = require('path');
const fs = require('fs');

/**
 * 
 * @param {String} filename 文件写入操作完成时的回调函数
 */
const callback = filename => err => {
    if (err) {
        console.log(`写入文件${filename}失败`);
    } else {
        console.log(`写入文件${filename}成功`);
    }
};

/**
 * 
 * @param {String} filepath 文件写入路径
 * @param {String} filename 写入的文件命名
 * @param {Object} data 写入的文件内容
 */
const writeSingleFile = (filepath, filename, data) => {
    fs.writeFile(`${filepath}.json`,JSON.stringify(data), {
        flag:'w',
        encoding:'utf-8'
    }, callback(filename));
};

/**
 * 
 * @param {String} filename 写入的文件命名
 * @param {Object} sheet 将excel中单个sheet数据写入文件
 */
const writeBySheet = (distdir, filename, sheet) => {
    const langKeys = Object.keys(langConfig);
    langKeys.forEach(key => {
        // const dir = path.join(distdir, key);
        const writeDir = path.join(distdir, key, filename);
        writeSingleFile(writeDir, filename, sheet[key]);
    });
};

/**
 * 批量将excel中的每个sheet数据写入文件
 * @param {String} distdir 多语言存放目录
 * @param {String} src_excel_path 导入的excel路径
 */
const batchWriteFile = (distdir, src_excel_path) => {
    const sheetsJsons = getAllSheetsJson(src_excel_path);
    for(let sheet = 0, len = sheetsJsons.length; sheet < len ; sheet++){
        const filename = sheetsJsons[sheet].fileName;
        writeBySheet(distdir, filename, sheetsJsons[sheet]);
    }
};

/**
 * 语言文件目录不存在时，创建对应语言文件目录
 * @param {String} distdir 写入的多语言存放目录
 */
const mkdirNotExist = distdir => {
    const langKeys = Object.keys(langConfig);
    const mkdirNotExistList = langKeys.map(key => new Promise((resolve, reject) => {
        const dir = path.join(distdir, key);
        console.log(dir);
        fs.exists(dir, exists => {
            if (exists) {
                resolve(true);
            } else {
                fs.mkdir(dir, err => {
                    if (err) {
                        reject(err);
                        console.log(`dir ${key}创建目录失败`);
                    } else {
                        resolve(true);
                        console.log(`dir ${key}创建目录成功`);
                    }
                });
            }
        });
    }));

    return Promise.all(mkdirNotExistList);
};

/**
 * 
 * @param {String} distdir 写入的多语言存放目录
 * @param {String} src_excel_path 导入的excel路径
 */
const batchWrite = (distdir, src_excel_path) =>
    mkdirNotExist(distdir).then(res => {
        const isDirsExisted = res.reduce(((result, item) =>  result && item), true);
        if (isDirsExisted) {
            batchWriteFile(distdir, src_excel_path);
        } else {
            console.log(`Some dir is not existed`);
        }
    }).catch(e => {});

module.exports = {
    batchWrite
};  


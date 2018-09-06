const xlsx = require('xlsx');
const langConfig = require('./lang.config.json');
// 获取配置中的所有语言
const langKeys = Object.keys(langConfig);

/**
 * 
 * @param {Object} jsonSheet 存放excel单个sheet对象对应语言的msg信息
 * @param {String} msgKey 每条msg的唯一key值
 * @param {String} col excel对应的列标志符(A, B, C...)
 * @param {Object} worksheet excel单个sheet对象的数据
 * @param {String} key excel单个单元格的对应的key
 */
const getLocalizationJson = (jsonSheet, msgKey, col, worksheet, key) => {
    langKeys.forEach((langname, index) => {
        // 65 + index + 1
        // excel第一列是msg key, 第二列开始是语言类别
        if ( col.toLocaleUpperCase() === String.fromCharCode(65 + index + 1) ) {
            jsonSheet[langname][msgKey] = worksheet[key].v;
        }
    });
};

/**
 * 
 * @param {Object} worksheet excel单个sheet对象的数据
 */
const getSheetJsonData = (worksheet) => {
    const msgKey = worksheet[`A3`].v;
    const fileName = msgKey.slice(0, msgKey.indexOf('.'));
    const jsonSheet = {
        fileName   
    };
    const keys = Object.keys(worksheet);

    langKeys.forEach(langname => {
        jsonSheet[langname] = {};
    });

    keys
    // 过滤以 ! 开头的 key
    .filter(k => k[0] !== '!')
    // 遍历所有单元格
    .forEach(k => {
        const col = k.slice(0, 1);
        const row = k.slice(1);
        const msgKey = worksheet[`A${row}`].v;
        if (row > 2) {
            getLocalizationJson(jsonSheet, msgKey, col, worksheet, k);
        }
    });
    return jsonSheet;
};

/**
 * 
 * @param {Array} worksheets excel所有sheet对象的数据
 */
const getAllSheetsJson = src_excel_path => {
    const workbook = xlsx.readFile(src_excel_path);
    const worksheets = workbook.Sheets;
    const allSheetsJson = [];
    // 获取 Excel 中所有表名
    const sheetNames = workbook.SheetNames;
    for(sheetnames in worksheets) {
        // 根据表名，获取相应的表
        allSheetsJson.push(getSheetJsonData(worksheets[sheetnames]));
    }
    return allSheetsJson;
};

module.exports = {
    getAllSheetsJson
};
const glob = require('glob');
const fs = require('fs');
const path = require('path');
const langs = ['zh-TW', 'en'];

getLangMsgsMap = langdir => {
    const langMap = {};
    langs.forEach(lang => {
        /**
         * 获取对应语言目录
         */
        const langDir = path.join(langdir, `${lang}/*.json`);
        let templist = {};
        const langFileNames = glob.sync(langDir);
        langFileNames.forEach(filename => {
            // 单个文件的json
            const singleFileJson = JSON.parse(fs.readFileSync(filename, 'UTF-8'));
            templist = { ...templist, ...singleFileJson };
        });
        langMap[lang] = templist;
    });
    return langMap;
};

module.exports = {
    getLangMsgsMap
};
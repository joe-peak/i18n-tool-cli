#!/usr/bin/env node 
const program = require('commander');
const inquirer = require('inquirer');
const info = require('../package.json');
const { batchWrite } = require('../lib/writeFile');
const { exportExcel } = require('../lib/toExcel');

program.allowUnknownOption();
program.version(info.version);

program.version('0.0.1', '-v, --version')
    .command('write')
    .action(() => {
        inquirer.prompt([
        {
            type: 'input',
            name: 'src_excel_path',
            message: '输入excel路径:'
        },
        {
            type: 'input',
            name: 'distdir',
            message: '请输入项目多语言目录路径:'
        }]).then(({ distdir, src_excel_path }) => {
            batchWrite(distdir, src_excel_path);
        });
    });

program.command('export')
.action(() => {
    // lang_dir
    inquirer.prompt([
        {
          type: 'input',
          name: 'src_dir',
          message: '请输入需要导出messages到excel的根目录:'
        },
        {
          type: 'input',
          name: 'lang_dir',
          message: '请输入当前多语言存放根目录:'
        },
        {
            type: 'input',
            name: 'excel_name',
            message: '请输入excel文件名:'
        }
      ]).then(({ src_dir, excel_name, lang_dir }) => {
          exportExcel(src_dir, excel_name, lang_dir);
      });
});
program.parse(process.argv);

// const program = require('commander');
// program.version('1.0.0', '-v, --version')
// .command('init')
// .action(() => {
// console.log('hahha');
// });
// program.parse(process.argv);
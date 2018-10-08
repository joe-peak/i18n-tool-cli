#!/usr/bin/env node 
const program = require('commander');
const inquirer = require('inquirer');
const path = require('path');
const info = require('../package.json');
const { batchWrite } = require('../lib/write');
const { exportExcel } = require('../lib/excel');

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
            if (!src_excel_path) {
                throw new Error('Invalid path of source excel');
            }
            const dist_dir = distdir || path.join(process.cwd(), 'public/lang');
            batchWrite(dist_dir, src_excel_path);
        });
    });

program.command('export')
.action(() => {
    inquirer.prompt([
        {
          type: 'input',
          name: 'src_dir',
          message: '请输入需要导出message的入口目录路径:'
        },
        {
          type: 'input',
          name: 'lang_dir',
          message: '请输入当前多语言文件的存放目录:'
        },
        {
            type: 'input',
            name: 'excel_name',
            message: '请输入excel文件名:'
        }
      ]).then(({ src_dir = process.cwd(), excel_name, lang_dir }) => {
          const filename = excel_name || 'messages';
          const langdir = lang_dir || path.join(process.cwd(), 'public/lang');
          exportExcel(src_dir, filename, langdir);
      });
});
program.parse(process.argv);
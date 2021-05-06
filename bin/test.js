const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');
const readlineSync = require('readline-sync');
const fsPromise = fs.promises;
let SimpleGitOptions = {
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
};
const git = simpleGit(SimpleGitOptions);
// let tagName = readlineSync.question('please input the tag name?');
new Promise((resolve, reject) => {
    let tagName = readlineSync.question('please input the tag name?');
    console.log(tagName);
    resolve(tagName);
})
async function detechConfigFile(thePath) {
    let configFilePath = path.join(thePath, './mkflow.config.js');
    let result;
    try {
        await fsPromise.access(configFilePath);
        result = true;
    } catch (err) {
        result = false;
    }
    return result ? configFilePath : null;
}
detechConfigFile(process.cwd()).then(filePath => {
    let mkconfig = require(filePath);
    console.log(mkconfig);
});

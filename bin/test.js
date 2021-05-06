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
// git.push().then(e => {
//     console.log(e);
// }).catch(e => { console.log(e) });
// (async function () {
//     let resp;
//     resp = await git.remote(['update']);
//     console.log(resp);
//     resp = await git.status();
//     console.log(resp);
// })();
/* ******* */
// git.branch().then(e => { console.log(e) });
// git.checkout(['-b', 'testbranch2']).then(e => { console.log(e) });
// git.status().then(result => { console.log(result) });
// git.add('./')
//     .commit('commit test')
//     .push();
// git.merge({ from: 'master' }).then(e => { console.log(e) });
// git.merge(['master']).then(e => { console.log(e) });
// git.branch().then(e => { console.log(e) });
/* ******* */
const simpleGit = require('simple-git');
let SimpleGitOptions = {
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
};
const git = simpleGit(SimpleGitOptions);
git.push().then(e => {
    console.log(e);
})
// (async function () {
//     let resp;
//     resp = await git.remote(['update']);
//     console.log(resp);
//     resp = await git.status();
//     console.log(resp);
// })();
/* ******* */
console.log('test');
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
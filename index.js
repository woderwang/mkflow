#!/usr/bin/env node
const simpleGit = require('simple-git');
const { argv } = require('yargs');
console.log(argv);
let SimpleGitOptions = {
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
};
const git = simpleGit(SimpleGitOptions);
git.checkout(['-b', 'testbranch2']).then(e => { console.log(e) });
// git.status().then(result => { console.log(result) });
// git.add('./')
//     .commit('commit test')
//     .push();
// git.merge({ from: 'master' }).then(e => { console.log(e) });
// git.merge(['master']).then(e => { console.log(e) });
/* feature */
class feature {
    constructor(props) {

    }
    start = () => {

    }
    finish = () => {

    }
};
/* sit */
class sit {
    constructor(props) {

    }
    start = () => {

    }
    finish = () => {

    }
};

// class uat {
//     constructor(props) {

//     }
//     start = () => {

//     }
//     finish = () => {

//     }
// };

// class hotfix {
//     constructor(props) {

//     }
//     start = () => {

//     }
//     finish = () => {

//     }
// };
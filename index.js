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
// git.status().then(result => { console.log(result) });
// git.add('./')
//     .commit('commit test')
//     .push();
git.mergeFromTo('testbranch', 'master').then(e => { console.log(e) });

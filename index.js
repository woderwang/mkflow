#!/usr/bin/env node
const simpleGit = require('simple-git');
let SimpleGitOptions = {
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
};
const git = simpleGit(SimpleGitOptions);
git.status().then(result => { console.log(result) });

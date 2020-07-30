#!/usr/bin/env node
const simpleGit = require('simple-git');
const { argv } = require('yargs');
const colors = require('colors');
console.log(colors.bgGrey('********mkflow version:1.0********'))
// console.log(argv);
let SimpleGitOptions = {
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
};
const git = simpleGit(SimpleGitOptions);
const validFlowNames = ['feature', 'release', 'preprod', 'hotfix'];
const validActionNames = ['start', 'finish'];
/* demo block */
/* ******* */
// git.branch(['-l']).then(e => { console.log(e) });
// git.checkout(['-b', 'testbranch2']).then(e => { console.log(e) });
// git.status().then(result => { console.log(result) });
// git.add('./')
//     .commit('commit test')
//     .push();
// git.merge({ from: 'master' }).then(e => { console.log(e) });
// git.merge(['master']).then(e => { console.log(e) });
/* ******* */
/* demo block end */

process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Node NOT Exiting...");
});
class Feature {
    constructor(props) {

    }
    start = (flowBranchName) => {
        try {
            console.log('start feature');
            git.checkout(['-b', flowBranchName]).then(e => {
                console.log('result', e);
            }, (err) => {
                console.log(err.git);
            })
        } catch (error) {
            // console.log(error);
        }
    }
    finish = () => {

    }
    /* 罗列相关的flow分支 */
    listBranch = () => {
        let nameReg = new RegExp('^feature-');
        git.branch(['-l']).then(r => {
            const { all } = r;
            let branchs = [];
            all.forEach(name => {
                if (nameReg.test(name)) {
                    console.log(colors.blue(name));
                    branchs.push(name);
                }
            })
            if (branchs.length === 0) {
                console.log(colors.brightBlue('不存在feature相关的分支'));
            }
        })
    }
};
let featureFlow = new Feature();
// detectCommitStatus().then(r => {
//     console.log(colors.red(r));
// });


runAction();
function runAction() {
    const { _: actions } = argv;
    let flowName, actionName, flowBranchName, flowInstance;
    actions.forEach((v, i) => {
        if (i === 0) {
            //flow name
            flowName = validFlowNames.includes(v) ? v : flowName;
            switch (flowName) {
                case 'feature':
                    flowInstance = featureFlow;
                    break;
                case 'release':
                    break;
                default:
                    break;
            }
        } else if (i === 1) {
            //action name
            actionName = validActionNames.includes(v) ? v : actionName;
        } else if (i === 2) {
            flowBranchName = `${flowName}-${v}`;
        }
    });
    if (!flowInstance) return;
    /* 没有动作的flow执行list相关flow的分支 */
    if (flowName && !actionName) {
        flowInstance.listBranch();
    }
    if (flowName && actionName) {
        if (!flowBranchName) {
            console.log(colors.red('请定义分支名称'));
            return;
        }
        detectCommitStatus().then(r => {
            if (r) {
                switch (actionName) {
                    case 'start':
                        flowInstance.start(flowBranchName);
                        break;
                    case 'finish':
                        break;
                    default:
                        break;
                }
            }
        })

    }
}


/* 查看当前是否存在修改的内容没有提交的情况 */
function detectCommitStatus() {
    return git.status().then(result => {
        let detectResult = false;
        const { conflicted, created, deleted, modified, renamed, files } = result;
        if (conflicted.length > 0 || created.length > 0 || deleted.length > 0 || modified.length > 0 || renamed.length > 0) {
            detectResult = false;
            console.log(colors.yellow('********存在以下未提交的内容********'));
            files.forEach((v, i) => {
                console.log(colors.blue(`${v.working_dir}   ${v.path}`));
            })
        } else {
            detectResult = true;
        }
        return detectResult;
    });
}

/* feature */

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
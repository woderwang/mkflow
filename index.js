#!/usr/bin/env node
const simpleGit = require('simple-git');
const { argv } = require('yargs');
const colors = require('colors');

const starStick = '********';
console.log(colors.bgGrey(`${starStick}mkflow version:1.0${starStick}`));
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
// git.branch().then(e => { console.log(e) });
/* ******* */
/* demo block end */


class Feature {
    constructor(props) {

    }
    start = (flowBranchName) => {
        git.checkout(['-b', flowBranchName, 'develop']).then(e => {
            console.log(colors.green(`${flowBranchName} has created successful`));
        }, (err) => {
            if (err.stack) {
                let stackContent = JSON.stringify(err.stack);
                let atIndex = stackContent.indexOf('.');
                if (atIndex > -1) {
                    stackContent = stackContent.substring(1, atIndex);
                }
                console.log(colors.red(stackContent));
            }
        })
    }
    finish = async (flowBranchName) => {
        try {
            let isExist = await this.branchExist(flowBranchName);
            if (!isExist) {
                consoe.log(colors.yellow(`${flowBranchName} is not exist`));
                return;
            }
            let ckDevResult = await git.checkout(['develop']);
            let finishResut = await git.merge([flowBranchName]);
            let rmResult = await git.branch(['-d', flowBranchName]);//remove local branch
            console.log(colors.bgCyan(`local branch ${flowBranchName} has been deleted`));
            let remoteIsExist = await this.branchExist(`origin/${flowBranchName}`);
            if (remoteIsExist) {
                let rmRemoteBranchResult = await git.push(['origin', '--delete', flowBranchName]);
                console.log(colors.bgCyan(`remote branch ${flowBranchName} has been deleted`));
            }
        } catch (err) {
            if (err.git) {
                const { merges, result } = err.git;
                if (merges.length > 0) {
                    console.log(colors.red(result));
                    console.log(colors.yellow(`${starStick}合并存在冲突${starStick}`));
                    merges.forEach(v => {
                        console.log(colors.blue(v));
                    });
                }
            }
        }
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
    /* 判断branch是否存在 */
    branchExist = (branchName, isLocal = true) => {
        return git.branch([isLocal ? '-l' : '-r']).then(r => {
            const { all } = r;
            let result = false;
            all.forEach(name => {
                if (name === branchName) result = true;
            })
            return result;
        })
    }
    /* 移除branch */
    removeBranch = (branchName) => {
        return new Promise((resolve, reject) => {
            let result = {};
            this.branchExist(branchName).then(r => {
                if (!r) {
                    reject();
                } else {
                    git.branch(['-d', branchName + 'test']).then(e => {
                        console.log(e);
                    })
                }
            })
        });

    }
};
let featureFlow = new Feature();
// detectCommitStatus().then(r => {
//     console.log(colors.red(r));
// });

/* 主要代码执行 */
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
                        flowInstance.finish(flowBranchName);
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
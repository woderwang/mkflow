#!/usr/bin/env node
const simpleGit = require('simple-git');
const { argv } = require('yargs');
const path = require('path');
const fs = require('fs');
const colors = require('colors');
const pkgConfig = require('../package.json');
const validFlowNames = ['feature', 'release', 'preStable', 'hotfix'];
const validActionNames = ['start', 'finish'];
const starStick = '********';
const fsPromise = fs.promises;
const rtPath = process.cwd();
console.log(colors.bgGrey(`${starStick}mkflow version:${pkgConfig.version}${starStick}`));
let SimpleGitOptions = {
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
};
/* ANCHOR check config file is exists */

const git = simpleGit(SimpleGitOptions);
const mkflowSetting = {
    featurePrefix: 'feature-',
    releasePrefix: 'release-',
    hotfixPrefix: 'hotfix-',
    develop: {
        branch: 'develop',
    },
    preStable: {
        branch: 'uat',
    },
    stable: {
        branch: 'master',
    }
}


class Flow {
    constructor(props) {
        const { prefix, flowName, baseBranch, finishBranchs } = props;
        this.flowName = flowName;
        this.flowPrefix = prefix;
        this.baseBranch = baseBranch;
        this.finishBranchs = finishBranchs;
    }
    start(name) {
        if (['preStable'].includes(this.flowName)) {
            console.log(colors.yellow(`${this.flowName} without start`));
            return;
        }
        let flowBranchName = `${this.flowPrefix}${name}`;
        git.checkout(['-b', flowBranchName, this.baseBranch]).then(e => {
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
    async finish(name) {
        let flowBranchName = '', actionResp;
        if (['preStable'].includes(this.flowName)) {
            flowBranchName = mkflowSetting[this.flowName].branch;
        } else {
            flowBranchName = `${this.flowPrefix}${name}`;
        }
        try {
            /* 获取最新remote ref */
            await git.remote(['update']);
            /* step1:检查分支是否存在 */
            let isExist = await this.branchExist(flowBranchName);
            if (!isExist) {
                consoe.log(colors.yellow(`${flowBranchName} is not exist`));
                return;
            }
            /* step2:切换到finish的对象分支 */
            await asyncForEach(this.finishBranchs, async (targetBranch, index) => {
                /* 切换到目标分支 */
                await git.checkout([targetBranch]);
                console.log(colors.blue(`switch branch to ${targetBranch}`));
                /* 查看分支是否最新 */
                actionResp = await git.status();
                if (actionResp && actionResp.behind > 0) {
                    console.log(colors.yellow(`branch:${targetBranch} is out of date,use 'git pull' to fetch latest ref`));
                    return Promise.reject();
                }
                /* merge节点分支 */
                await git.merge([flowBranchName]);
                console.log(colors.green(`branch:${targetBranch} merge successful`));
                /* 目标分支的commit推送到remote */
                if ([mkflowSetting.preStable.branch, mkflowSetting.stable.branch, mkflowSetting.develop.branch].includes(targetBranch)) {
                    actionResp = await this.pushBranch(targetBranch);
                    if (actionResp === true) console.log(colors.green(`branch:${targetBranch} push to remote successful`));
                }
            })
            /* step3-1:preStable无需移除分支，因为长期存在 */
            if (['preStable'].includes(this.flowName)) return;
            /* step3-2:remove local branch*/
            await git.branch(['-d', flowBranchName]);
            console.log(colors.bgCyan(`local branch ${flowBranchName} has been deleted`));
            let remoteIsExist = await this.branchExist(`origin/${flowBranchName}`, false);
            if (remoteIsExist) {
                console.log(colors.yellow(`remote branch ${flowBranchName} is removing...`));
                /* step3-2:remove remote branch*/
                let rmRemoteBranchResult = await git.push(['origin', '--delete', flowBranchName]);
                console.log(colors.bgCyan(`remove remote branch ${flowBranchName} successful`));
            }
            // console.log(colors.yellow(`finish后目前不会提供自动push的操作，请手动执行push！`));
        } catch (err) {
            if (!err) return;
            if (err && err.git) {
                const { merges, result } = err.git;
                if (merges.length > 0) {
                    console.log(colors.red(result));
                    console.log(colors.yellow(`${starStick}合并存在冲突${starStick}`));
                    merges.forEach(v => {
                        console.log(colors.blue(v));
                    });
                } else {
                    console.log(err);
                }
            } else {
                console.log(err);
            }
        }
    }
    /* 罗列相关的flow分支 */
    listBranch(flowName) {
        if (!flowName) return;
        let nameReg = new RegExp(`^${flowName}-`);
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
                console.log(colors.brightBlue(`不存在${flowName}相关的分支`));
            }
        })
    }
    /* 判断branch是否存在 */
    branchExist(branchName, isLocal = true) {
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
    removeBranch(branchName) {
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
    pushBranch(branch, remote = 'origin') {
        return git.push([remote, branch]).then(e => {
            const { update } = e;
            /* update属性如果为空，标识没有任何更新，意味着push为出现了错误*/
            if (update && Object.keys(update).length > 0) {
                return true;
            }
        });
    }
};
async function runAction(flowInstances) {
    const { _: actions } = argv;
    let flowName, actionName, flowBranchName, flowInstance;
    if (actions.length === 0) { readme(); return };
    actions.forEach((v, i) => {
        if (i === 0) {
            //flow name
            flowName = validFlowNames.includes(v) ? v : flowName;
            switch (flowName) {
                case 'feature':
                    flowInstance = flowInstances['feature'];
                    break;
                case 'release':
                    flowInstance = flowInstances['release'];
                    break;
                case 'preStable':
                    flowInstance = flowInstances['preStable'];
                    break;
                case 'hotfix':
                    flowInstance = flowInstances['hotfix'];
                    break;
                default:
                    break;
            }
        } else if (i === 1) {
            //action name
            actionName = validActionNames.includes(v) ? v : actionName;
        } else if (i === 2) {
            flowBranchName = v;
        }
    });
    if (!flowInstance) return;
    /* 没有动作的flow执行list相关flow的分支 */
    if (['feature', 'hotfix', 'release'].includes(flowName)) {
        if (flowName && !actionName) {
            flowInstance.listBranch(flowName);
        }
        if (flowName && actionName) {
            if (!flowBranchName) {
                console.log(colors.red('请定流程名称'));
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
    } else {
        if (flowName && actionName) {
            detectCommitStatus().then(r => {
                if (r) {
                    switch (actionName) {
                        case 'start':
                            flowInstance.start(flowBranchName);
                            break;
                        case 'finish':
                            flowInstance.finish();
                            break;
                        default:
                            break;
                    }
                }
            })

        }
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

async function asyncForEach(array = [], callback) {
    if (!array) return;
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

function readme() {
    console.log(colors.yellow(`${starStick}maycur work flow${starStick}`));
    console.log(colors.blue('feature start <name>  :  创建开发分支'));
    console.log(colors.blue('feature finish <name> :  完成开发分支'));
    console.log(colors.blue('release start <name>  :  完成测试分支'));
    console.log(colors.blue('release finish <name> :  完成测试分支'));
    console.log(colors.blue('preStable finish      :  完成预生产分支,分支不删除'));
    console.log(colors.blue('hotfix start <name>   :  完成热修复分支'));
    console.log(colors.blue('hotfix finish <name>  :  完成热修复分支'));
}

async function detectConfigFile(thePath) {
    let configFilePath = path.join(thePath, './mkflow.config.js');
    let nodeVersion = Number(process.version.split('.')[0].replace('v', ''));
    let fileExist = false;
    try {
        await fsPromise.access(configFilePath);
        console.log(colors.blue('We detected the mkflow config file exists!'));
        fileExist = true;
    } catch (err) {
        fileExist = false;
    }
    if (nodeVersion < 10) {
        console.log(colors.yellow('Your Node version less than v10,it can not support mkflow-config'));
        return null;
    }
    return fileExist ? configFilePath : null;
}
/* ANCHOR execute main block */
(async function () {
    let configFilePath = await detectConfigFile(rtPath);
    if (configFilePath) {
        let mkconfig = require(configFilePath);
        if (mkconfig && mkconfig.developBranch) {
            let devBranchName = mkconfig.developBranch;
            mkflowSetting.develop.branch = devBranchName || 'develop';
        }
    }
    let flowConfig = {
        feature: {
            baseBranch: mkflowSetting.develop.branch,
            finishBranchs: [mkflowSetting.develop.branch],
        },
        release: {
            baseBranch: mkflowSetting.develop.branch,
            finishBranchs: [mkflowSetting.develop.branch, mkflowSetting.preStable.branch],
        },
        preStable: {
            finishBranchs: [mkflowSetting.develop.branch, mkflowSetting.stable.branch],
        },
        hotfix: {
            baseBranch: 'master',
            finishBranchs: [mkflowSetting.develop.branch, mkflowSetting.preStable.branch, mkflowSetting.stable.branch],
        }
    };
    let featureFlow = new Flow({ prefix: mkflowSetting.featurePrefix, flowName: 'feature', baseBranch: flowConfig['feature'].baseBranch, finishBranchs: flowConfig['feature'].finishBranchs });
    let releaseFlow = new Flow({ prefix: mkflowSetting.releasePrefix, flowName: 'release', baseBranch: flowConfig['release'].baseBranch, finishBranchs: flowConfig['release'].finishBranchs });
    let preStableFlow = new Flow({ flowName: 'preStable', baseBranch: flowConfig['preStable'].baseBranch, finishBranchs: flowConfig['preStable'].finishBranchs });
    let hotfixFlow = new Flow({ prefix: mkflowSetting.hotfixPrefix, flowName: 'hotfix', baseBranch: flowConfig['hotfix'].baseBranch, finishBranchs: flowConfig['hotfix'].finishBranchs });
    let flowInstances = {
        feature: featureFlow,
        preStable: preStableFlow,
        hotfix: hotfixFlow,
        release: releaseFlow,
    }
    /* 主要代码执行 */
    runAction(flowInstances);
})();

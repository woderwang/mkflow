#!/usr/bin/env node
const simpleGit = require('simple-git');
const { argv } = require('yargs');
const path = require('path');
const fs = require('fs');
const colors = require('colors');
const pkgConfig = require('../package.json');
const Flow = require('./lib/Flow');
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



async function runAction(flowInstances) {
    const { _: actions } = argv;
    let flowName, actionName, flowBranchName, flowInstance;
    if (actions.length === 0) { readme(); return }
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
            files.forEach((v) => {
                console.log(colors.blue(`${v.working_dir}   ${v.path}`));
            })
        } else {
            detectResult = true;
        }
        return detectResult;
    });
}



function readme() {
    console.log(colors.yellow(`${starStick}maycur work flow${starStick}`));
    console.log(colors.blue('feature start <name>  :  创建开发分支'));
    console.log(colors.blue('feature finish <name> :  完成开发分支'));
    console.log(colors.blue('release start <name>  :  完成测试分支'));
    console.log(colors.blue('release finish <name> :  完成测试分支'));
    console.log(colors.blue('preStable finish      :  完成预生产分支,分支不删除'));
    console.log(colors.blue('hotfix start <name>   :  创建热修复分支'));
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
    let featureFlow = new Flow({ mkflowSetting, prefix: mkflowSetting.featurePrefix, flowName: 'feature', baseBranch: flowConfig['feature'].baseBranch, finishBranchs: flowConfig['feature'].finishBranchs });
    let releaseFlow = new Flow({ mkflowSetting, prefix: mkflowSetting.releasePrefix, flowName: 'release', baseBranch: flowConfig['release'].baseBranch, finishBranchs: flowConfig['release'].finishBranchs });
    let preStableFlow = new Flow({ mkflowSetting, flowName: 'preStable', baseBranch: flowConfig['preStable'].baseBranch, finishBranchs: flowConfig['preStable'].finishBranchs });
    let hotfixFlow = new Flow({ mkflowSetting, prefix: mkflowSetting.hotfixPrefix, flowName: 'hotfix', baseBranch: flowConfig['hotfix'].baseBranch, finishBranchs: flowConfig['hotfix'].finishBranchs });
    let flowInstances = {
        feature: featureFlow,
        preStable: preStableFlow,
        hotfix: hotfixFlow,
        release: releaseFlow,
    }
    /* 主要代码执行 */
    runAction(flowInstances);
})();

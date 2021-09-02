const colors = require('colors');
const simpleGit = require('simple-git');
const starStick = '********';
let SimpleGitOptions = {
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
};
const git = simpleGit(SimpleGitOptions);
async function asyncForEach(array = [], callback) {
    if (!array) return;
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}
class Flow {
    constructor(props) {
        const { prefix, flowName, baseBranch, finishBranchs, mkflowSetting } = props;
        this.flowName = flowName;
        this.flowPrefix = prefix;
        this.baseBranch = baseBranch;
        this.finishBranchs = finishBranchs;
        this.mkflowSetting = mkflowSetting;
    }
    start(name) {
        if (['preStable'].includes(this.flowName)) {
            console.log(colors.yellow(`${this.flowName} without start`));
            return;
        }
        let flowBranchName = `${this.flowPrefix}${name}`;
        git.checkout(['-b', flowBranchName, this.baseBranch]).then(() => {
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
        const mkflowSetting = this.mkflowSetting;
        if (['preStable'].includes(this.flowName)) {
            flowBranchName = mkflowSetting['preStable'].branch;
        } else {
            flowBranchName = `${this.flowPrefix}${name}`;
        }
        try {
            /* 获取最新remote ref */
            await git.remote(['update']);
            /* step1:检查分支是否存在 */
            let isExist = await this.branchExist(flowBranchName);
            if (!isExist) {
                console.log(colors.yellow(`${flowBranchName} is not exist`));
                return;
            }
            /* step1-2:检查flowBranchName是否最新 */
            actionResp = await git.status();
            if (actionResp && actionResp.behind > 0) {
                console.log(colors.yellow(`branch:${flowBranchName} is out of date,use 'git pull' to fetch latest ref`));
                return;
            }
            /* step2:切换到finish的对象分支 */
            await asyncForEach(this.finishBranchs, async (targetBranch) => {
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
                await git.push(['origin', '--delete', flowBranchName]);
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
    pushBranch(branch, remote = 'origin') {
        return git.push([remote, branch]).then(e => {
            const { update } = e;
            /* update属性如果为空，标识没有任何更新，意味着push为出现了错误*/
            if (update && Object.keys(update).length > 0) {
                return true;
            }
        });
    }
}
module.exports = Flow;
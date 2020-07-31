### maycur workflow

根据公司特定的git workflow定制了代码版本的流程机制。操作风格延续git flow，增加了preStable的概念。

#### 主要的流程定义

feature: 开发分支，从统一的develop分支衍生，完成后合并会develop。
release: 预发布分支，从develop分支衍生，和feature的区别在于release是开发约定后，对特定develop分支的一个切片，release是一种早期的待发布状态
preStable: 预生产分支，从release分支衍生，较稳定的发布版本
hotfix: 热修复分支，从生产分支（一般为master）衍生，用于修复线上bug，hotfix finish后会合并到开发（develop）, 预生产（preStable）, 生产(master)三个分支

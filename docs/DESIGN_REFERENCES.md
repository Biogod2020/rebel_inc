# v0.2 设计参考与改造依据

查阅日期：2026-10-15。这里的「参考」是学习信息层级、取舍和反馈方式，不是复制界面、代码或素材，也不把商业作品的人气当作本作可玩性的证据。不存在一个能客观认证所有策略游戏界面「SOTA」的统一榜单。

## 更少的界面，更具体的世界

[ISLANDERS: New Shores / Coatsink](https://coatsink.com/games/islanders-new-shores) 的官方定位强调简洁的建造体验与鲜明地景。本作采用地图优先的布局：默认没有地区侧栏，常驻三个关键指标；进阶参数与完整工程目录按需出现，而不是将所有数据同时排列。

[Terra Nil / Devolver](https://www.devolverdigital.com/games/terra-nil) 将恢复生态作为空间变化来呈现。本作重新绘制连续地形、海岸、河流、山地、植被、聚落与道路；医疗、学校、安置设施的建设也在地图上有对应标记。并未实现 Terra Nil 的生态模型，地图改善不应被误读为同等的模拟精度。

## 局内选择应改变做事方式

[Against the Storm — Orders / 官方发行商 Wiki](https://wiki.hoodedhorse.com/Against_the_Storm/Orders) 与 [Cornerstones, Perks and Effects](https://wiki.hoodedhorse.com/Against_the_Storm/Cornerstones,_Perks_and_Effects) 提供了任务和局内构筑的设计参考。本作增加三选一委托与三选一授权：委托提供有限时间内的具体承诺，授权改变施工、运输、情报、收入、疏散或调解之间的协同。不照搬该作资源、任务或卡牌。

[Eremite 的 Favoring Update 设计说明](https://eremitegames.com/favoring-update/)（2023-02-16）讨论了缺乏持续后果的可反复切换选择。本作的开局路线因此互斥、带代价且局内不能切换。选民生意味着更贵的长期驻军；选机动意味着更贵的工程；选共治意味着更贵的联合军。

[Against the Storm 开发日志](https://eremitegames.com/author/eremite/) 在检索时包含 2026-07-08 的 OverHaulers 1.10 与 2026-09-24 的 Rebel Hideout 1.11。查阅这些当前更新，是为了确认该作仍重视运输、世界事件与跨局变化；本作不声称实现其多年迭代的内容规模。

## 后果先于更多按钮

[Frostpunk 2 官方商店页](https://store.steampowered.com/app/1601580/Frostpunk_2/) 的派系、议会与政策冲突提供了「不存在无代价最优政策」的参考。本作没有假装加入一个完整议会模拟，而是将取舍落到预算、兵力、时间、危险与承诺上：车队可能受阻、撤回损失预算，调解需要可控安全条件，提前救援会与当前军事开支竞争。

## 本次实际取舍

保留 TypeScript 与 Canvas 2D，以维持单文件离线交付和可测试模拟。没有为了截图增加联网图片或重型三维库；地形、SVG 图标与提示音全部自行编写。绘制效果是原创低多边形地图风格，不是现代大型游戏同级的三维地形。

将复杂度放在选择之间，而不是放在首屏：九种授权、四类外勤、六类委托只在相关时出现。军事、民生、补给和灾害旧规则保留，防止「减面板」变成删掉策略深度。

进一步工作应优先由真人试玩决定：首次三分钟能否理解目标；玩家是否主动改变路线；有没有一条路线显著压倒其他路线；地图信息是否仍需过多往返查看。自动脚本不能替代这些判断。

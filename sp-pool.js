// 本文件由 tools/build-sp-pool.mjs 从 src/data/sp-pool.js 生成，请勿手改；
// 修改卡池或抽取规则请编辑源文件后运行 npm run sp-pool。
(function () {
'use strict';
// SP 抽卡页与飞行棋惩罚格共用的卡池与抽取逻辑（唯一数据源）。
// public/sp-pool.js 由 tools/build-sp-pool.mjs 从本文件生成，请勿手改生成文件。
// 修改卡池或抽取规则请编辑本文件，然后运行 `npm run sp-pool`（dev/build 会自动运行）。

const SP_TOOLS = [
  ['马鞭', 1], ['皮带', 0.9], ['手掌', 1], ['发刷', 0.95], ['皮鞭', 0.7],
  ['小木拍', 0.9], ['大木拍', 0.8], ['皮拍', 0.9], ['藤条', 0.7], ['猫爪拍', 1],
  ['散鞭', 1], ['衣架', 1], ['数据线', 0.8], ['硅胶拍', 0.9], ['戒尺', 0.9],
]
const SP_TOOL_NAMES = SP_TOOLS.map(([name]) => name)
const SP_TOOL_COEFF = Object.fromEntries(SP_TOOLS)
const SP_POSES = ['膝上', '俯卧', '跪姿', '弯腰岔腿', '扶手', '尿布', '四足支撑', '趴桌', '跪趴', '支椅背', '弯腰握踝', '椅子分腿']

// 次数档位：min–max 为原始次数区间，floor 为乘工具系数后的保底。
const SP_DIFFICULTIES = {
  light: { min: 30, max: 50, floor: 30 },
  medium: { min: 50, max: 80, floor: 60 },
  heavy: { min: 80, max: 110, floor: 80 },
}
const SP_LIGHT_COUNT = SP_DIFFICULTIES.light

const SP_HISTORY_WINDOW = 6
const SP_REPEAT_DECAY = 0.2
const SP_BUTT_AREA_WEIGHT = 1 // 1 = 不单独压低屁股权重

function buildPunishmentAreas(pose, tool) {
  const legs = (pose !== '膝上' && tool !== '手掌') ? ['小腿肚', '大腿肚'] : []
  let areas = pose === '膝上'
    ? ['屁股']
    : ['屁股', '大腿根', '阴部',
      ...(pose === '椅子分腿' ? [] : ['臀缝']),
      ...(pose === '跪姿' ? ['手心', '小臂', '大臂'] : []),
      ...((pose === '跪姿' || pose === '椅子分腿') ? ['胸部', '脸'] : []),
      ...((pose === '俯卧' || pose === '尿布' || pose === '跪趴') ? ['脚心'] : []),
      ...legs]
  if (tool === '手掌') areas = areas.filter((area) => ['脸', '阴部', '屁股', '胸部'].includes(area))
  return areas.length ? areas : ['屁股']
}

function pickWeightedValue(pool, weightOf) {
  const total = pool.reduce((sum, value) => sum + weightOf(value), 0)
  let cursor = Math.random() * total
  for (const value of pool) {
    cursor -= weightOf(value)
    if (cursor <= 0) return value
  }
  return pool[pool.length - 1]
}

// 最近窗口内同一取值每出现一次，权重再乘 SP_REPEAT_DECAY。
function decayWeight(value, recentValues) {
  const repeats = recentValues.filter((previous) => previous === value).length
  return repeats ? SP_REPEAT_DECAY ** repeats : 1
}

// index：0 工具 / 1 姿势 / 2 基础次数 / 3 部位。
// history 每项含 { tool, pose, rawCount, area }，窗口取最近 SP_HISTORY_WINDOW 条。
function pickSpCardValue(pool, index, history = []) {
  if (!pool.length) return ''
  const recent = history.slice(0, SP_HISTORY_WINDOW)
  const field = ['tool', 'pose', 'rawCount', 'area'][index]
  const recentValues = recent.map((entry) => entry[field])
  let candidates = pool
  if ((index === 0 || index === 1) && recentValues.length) {
    const lastValue = recentValues[0]
    const filtered = pool.filter((value) => value !== lastValue)
    if (filtered.length) candidates = filtered
  }
  return pickWeightedValue(candidates, (value) => {
    let weight = decayWeight(value, recentValues)
    if (index === 3 && value === '屁股') weight *= SP_BUTT_AREA_WEIGHT
    return weight
  })
}

function countPool(range) {
  const pool = []
  for (let i = range.min; i <= range.max; i += 1) pool.push(i)
  return pool
}

function computePunishmentCount(rawCount, tool, floor) {
  const coeff = SP_TOOL_COEFF[tool] ?? 1
  return { coeff, count: Math.max(floor, Math.round(rawCount * coeff)) }
}

// 一次抽齐四项。countUniform 为 true 时基础次数在档位区间内纯均匀随机（飞行棋使用）。
function drawSpPunishment({ history = [], countSpec = SP_LIGHT_COUNT, countUniform = false } = {}) {
  const tool = pickSpCardValue(SP_TOOL_NAMES, 0, history)
  const pose = pickSpCardValue(SP_POSES, 1, history)
  const area = pickSpCardValue(buildPunishmentAreas(pose, tool), 3, history)
  const rawCount = countUniform
    ? countSpec.min + Math.floor(Math.random() * (countSpec.max - countSpec.min + 1))
    : pickSpCardValue(countPool(countSpec), 2, history)
  const { coeff, count } = computePunishmentCount(rawCount, tool, countSpec.floor)
  return {
    tool,
    pose,
    area,
    rawCount,
    coeff,
    count,
    summary: `${tool} · ${pose} · ${area} · ${count} 次`,
  }
}

function halfPunishmentCount(punishment) {
  return Math.max(1, Math.round(punishment.count / 2))
}

// SP「加罚」池（项目 + 时间），SP 页与飞行棋共用。
// 时间为各档基础区间整体 +20% 后四舍五入为整数分钟，在整数范围内均匀抽取。
const SP_EXTRA_PENALTY_ITEMS = [
  { name: '抱头罚跪', light: [8, 12], medium: [13, 17], heavy: [18, 25] },
  { name: '举臂罚跪', light: [5, 7], medium: [8, 10], heavy: [11, 15] },
  { name: '跪姿顶物', light: [5, 7], medium: [8, 10], heavy: [11, 15] },
  { name: '跪姿持鞭', light: [5, 7], medium: [8, 10], heavy: [11, 15] },
  { name: '分腿罚跪', light: [6, 9], medium: [10, 13], heavy: [14, 18] },
  { name: 'M开腿蹲', light: [2, 3], medium: [3.5, 4.5], heavy: [5, 7] },
  { name: '分腿面壁', light: [8, 12], medium: [13, 16], heavy: [17, 22] },
  { name: '扎马步', light: [2, 3], medium: [3.5, 4], heavy: [4.5, 6] },
  { name: '背手踮脚', light: [3, 4], medium: [5, 6], heavy: [7, 10] },
  { name: '扶墙撅臀', light: [5, 7], medium: [8, 10], heavy: [11, 15] },
  { name: '平举重物', light: [3, 4], medium: [5, 6], heavy: [7, 10] },
  { name: '顶鞭面壁', light: [5, 7], medium: [8, 10], heavy: [11, 15] },
]

function extraPenaltyTimeRange(item, difficultyKey = 'medium') {
  const range = item[difficultyKey] || item.medium
  return [Math.round(range[0] * 1.2), Math.round(range[1] * 1.2)]
}

function drawExtraPenalty({ difficultyKey = 'light' } = {}) {
  const item = SP_EXTRA_PENALTY_ITEMS[Math.floor(Math.random() * SP_EXTRA_PENALTY_ITEMS.length)]
  const [min, max] = extraPenaltyTimeRange(item, difficultyKey)
  const minutes = min + Math.floor(Math.random() * (max - min + 1))
  return { item: item.name, minutes, summary: `${item.name} ${minutes} 分钟` }
}

window.SP_POOL = { SP_TOOLS, SP_TOOL_NAMES, SP_TOOL_COEFF, SP_POSES, SP_DIFFICULTIES, SP_LIGHT_COUNT, SP_HISTORY_WINDOW, SP_REPEAT_DECAY, SP_BUTT_AREA_WEIGHT, buildPunishmentAreas, pickWeightedValue, decayWeight, pickSpCardValue, countPool, computePunishmentCount, drawSpPunishment, halfPunishmentCount, SP_EXTRA_PENALTY_ITEMS, extraPenaltyTimeRange, drawExtraPenalty };
})();

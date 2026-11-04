/* 由 spank/tools/build-site-data.mjs 从 spank/data/short-card.json 生成，请勿直接修改。 */
window.SHORT_CARD = {
  "id": "short-v1",
  "name": "简短版",
  "version": "1.2.0",
  "adult": true,
  "description": "10 个分类 / 104 项；性别含本人/偏好/属性三项单选；小瓶子共 3 档喜好，默认空瓶；可接受强度与衣着接受度为滑动档位；不设雷区",
  "total": 104,
  "inputTypes": {
    "single": [],
    "multi": [
      "渴求关系",
      "节奏",
      "快感来源",
      "实践配合"
    ],
    "bottle": [
      "工具",
      "部位",
      "姿势"
    ],
    "scale": [
      "可接受强度",
      "衣着接受度"
    ],
    "dual": [
      "性别"
    ]
  },
  "bottleLevels": [
    {
      "level": 0,
      "key": "empty",
      "label": "空瓶",
      "default": true
    },
    {
      "level": 1,
      "key": "acceptable",
      "label": "可接受"
    },
    {
      "level": 2,
      "key": "like",
      "label": "喜欢"
    },
    {
      "level": 3,
      "key": "favorite",
      "label": "最爱"
    }
  ],
  "bottlePreferenceLevels": 3,
  "defaultBottleLevel": 0,
  "interaction": {
    "bottleCycle": "空瓶 → 可接受 → 喜欢 → 最爱 → 空瓶",
    "longPress": false,
    "hardLimit": false
  },
  "stats": {
    "categories": 10,
    "items": 104,
    "byInput": {
      "single": 0,
      "multi": 24,
      "bottle": 64,
      "scale": 8,
      "dual": 8
    }
  },
  "categories": [
    {
      "id": "gender",
      "title": "性别",
      "input": "dual",
      "color": "from-blue-400 to-blue-500",
      "solid": "text-blue-500",
      "bgSolid": "bg-blue-500",
      "sources": [],
      "items": [
        {
          "id": "s-gender-1",
          "name": "男",
          "selected": false,
          "isNew": true,
          "group": "self",
          "groupLabel": "本人性别"
        },
        {
          "id": "s-gender-2",
          "name": "女",
          "selected": false,
          "isNew": true,
          "group": "self",
          "groupLabel": "本人性别"
        },
        {
          "id": "s-gender-3",
          "name": "男",
          "selected": false,
          "isNew": true,
          "group": "preference",
          "groupLabel": "偏好性别"
        },
        {
          "id": "s-gender-4",
          "name": "女",
          "selected": false,
          "isNew": true,
          "group": "preference",
          "groupLabel": "偏好性别"
        },
        {
          "id": "s-gender-7",
          "name": "双",
          "selected": false,
          "isNew": true,
          "group": "preference",
          "groupLabel": "偏好性别"
        },
        {
          "id": "s-gender-5",
          "name": "主",
          "selected": false,
          "isNew": true,
          "group": "role",
          "groupLabel": "本人属性"
        },
        {
          "id": "s-gender-6",
          "name": "贝",
          "selected": false,
          "isNew": true,
          "group": "role",
          "groupLabel": "本人属性"
        },
        {
          "id": "s-gender-8",
          "name": "双",
          "selected": false,
          "isNew": true,
          "group": "role",
          "groupLabel": "本人属性"
        }
      ]
    },
    {
      "id": "relation",
      "title": "渴求关系",
      "input": "multi",
      "color": "from-violet-400 to-violet-500",
      "solid": "text-violet-500",
      "bgSolid": "bg-violet-500",
      "sources": [
        "类型"
      ],
      "items": [
        {
          "id": "s-relation-1",
          "name": "纯实践",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-relation-2",
          "name": "短期体验",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-relation-3",
          "name": "管教",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-relation-4",
          "name": "长期唯一",
          "selected": false,
          "source": "柿子卡"
        }
      ]
    },
    {
      "id": "intensity",
      "title": "可接受强度",
      "input": "scale",
      "orientation": "horizontal",
      "defaultIndex": 0,
      "color": "from-red-400 to-red-500",
      "solid": "text-red-500",
      "bgSolid": "bg-red-500",
      "sources": [
        "程度"
      ],
      "items": [
        {
          "id": "s-intensity-1",
          "name": "轻度",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-intensity-2",
          "name": "中度",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-intensity-3",
          "name": "重度",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-intensity-4",
          "name": "极限",
          "selected": false,
          "isNew": true
        }
      ]
    },
    {
      "id": "tools",
      "title": "工具",
      "input": "bottle",
      "color": "from-amber-400 to-orange-500",
      "solid": "text-orange-500",
      "bgSolid": "bg-orange-500",
      "sources": [
        "工具"
      ],
      "items": [
        {
          "id": "s-tools-1",
          "name": "小红/小绿",
          "level": 0,
          "source": "柿子卡",
          "mergedFrom": [
            "小红",
            "小绿"
          ]
        },
        {
          "id": "s-tools-2",
          "name": "硅胶猫爪",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-3",
          "name": "皮带",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-4",
          "name": "皮拍",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-5",
          "name": "板子",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-6",
          "name": "戒尺",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-7",
          "name": "藤条",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-8",
          "name": "树脂棒",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-9",
          "name": "木棒",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-10",
          "name": "亚克力棍",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-11",
          "name": "亚克力板",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-12",
          "name": "亚克力尺",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-13",
          "name": "散鞭",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-14",
          "name": "皮鞭",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-15",
          "name": "硅胶鞭",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-16",
          "name": "绳鞭",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-17",
          "name": "数据线",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-18",
          "name": "热熔胶棒",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-19",
          "name": "巴掌",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-tools-20",
          "name": "橡胶类",
          "level": 0,
          "source": "芝芝卡"
        },
        {
          "id": "s-tools-21",
          "name": "马鞭",
          "level": 0,
          "source": "芝芝卡"
        },
        {
          "id": "s-tools-22",
          "name": "皮具",
          "level": 0,
          "source": "芝芝卡"
        },
        {
          "id": "s-tools-23",
          "name": "发刷",
          "level": 0,
          "source": "芝芝卡"
        },
        {
          "id": "s-tools-24",
          "name": "跳绳",
          "level": 0,
          "source": "芝芝卡"
        },
        {
          "id": "s-tools-25",
          "name": "长鞭",
          "level": 0,
          "source": "芝芝卡"
        },
        {
          "id": "s-tools-26",
          "name": "猫爪拍",
          "level": 0,
          "source": "圈中卡"
        },
        {
          "id": "s-tools-27",
          "name": "竹条",
          "level": 0,
          "source": "圈中卡"
        },
        {
          "id": "s-tools-28",
          "name": "衣架",
          "level": 0,
          "source": "圈中卡"
        },
        {
          "id": "s-tools-29",
          "name": "毛刷",
          "level": 0,
          "source": "圈中卡"
        },
        {
          "id": "s-tools-30",
          "name": "拖鞋",
          "level": 0,
          "source": "圈中卡"
        }
      ]
    },
    {
      "id": "parts",
      "title": "部位",
      "input": "bottle",
      "color": "from-rose-400 to-pink-500",
      "solid": "text-pink-500",
      "bgSolid": "bg-pink-500",
      "sources": [
        "部位"
      ],
      "items": [
        {
          "id": "s-parts-1",
          "name": "屁股",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-parts-2",
          "name": "小腿",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-parts-3",
          "name": "手心",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-parts-4",
          "name": "脚心",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-parts-5",
          "name": "脸部",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-parts-6",
          "name": "胸部",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-parts-7",
          "name": "私处",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-parts-8",
          "name": "臀缝",
          "level": 0,
          "source": "芝芝卡"
        },
        {
          "id": "s-parts-9",
          "name": "大腿后侧",
          "level": 0,
          "source": "芝芝卡"
        },
        {
          "id": "s-parts-10",
          "name": "大腿前侧",
          "level": 0,
          "source": "芝芝卡"
        },
        {
          "id": "s-parts-11",
          "name": "背部",
          "level": 0,
          "source": "芝芝卡"
        },
        {
          "id": "s-parts-12",
          "name": "大腿内侧",
          "level": 0,
          "source": "圈中卡"
        }
      ]
    },
    {
      "id": "postures",
      "title": "姿势",
      "input": "bottle",
      "color": "from-blue-400 to-blue-500",
      "solid": "text-blue-500",
      "bgSolid": "bg-blue-500",
      "sources": [
        "姿势"
      ],
      "items": [
        {
          "id": "s-postures-1",
          "name": "OTK",
          "level": 0,
          "source": "柿子卡",
          "mergedFrom": [
            "手撑地的OTK",
            "脚腾空的OTK",
            "上身在床上的OTK"
          ]
        },
        {
          "id": "s-postures-2",
          "name": "平趴",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-postures-3",
          "name": "垫枕头平趴",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-postures-4",
          "name": "趴床沿",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-postures-5",
          "name": "跪沙发撑靠背",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-postures-6",
          "name": "趴椅背 / 扶手",
          "level": 0,
          "source": "柿子卡",
          "mergedFrom": [
            "趴沙发扶手",
            "趴椅背"
          ]
        },
        {
          "id": "s-postures-7",
          "name": "撑床",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-postures-8",
          "name": "撑桌",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-postures-9",
          "name": "跪立",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-postures-10",
          "name": "跪趴",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-postures-11",
          "name": "跪撅",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-postures-12",
          "name": "趴桌",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-postures-13",
          "name": "站立",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-postures-14",
          "name": "弯腰",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-postures-15",
          "name": "撑墙",
          "level": 0,
          "source": "柿子卡",
          "mergedFrom": [
            "撑墙",
            "双手扶墙"
          ]
        },
        {
          "id": "s-postures-16",
          "name": "跪立抱",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-postures-17",
          "name": "站立抱",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-postures-18",
          "name": "反骑椅子",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-postures-19",
          "name": "面对面跨坐",
          "level": 0,
          "source": "柿子卡"
        },
        {
          "id": "s-postures-20",
          "name": "站立扶腿",
          "level": 0,
          "source": "芝芝卡"
        },
        {
          "id": "s-postures-21",
          "name": "尿布式",
          "level": 0,
          "source": "芝芝卡"
        },
        {
          "id": "s-postures-22",
          "name": "双手抓踝",
          "level": 0,
          "source": "圈中卡"
        }
      ]
    },
    {
      "id": "clothing",
      "title": "衣着接受度",
      "input": "scale",
      "orientation": "vertical",
      "defaultIndex": 0,
      "color": "from-orange-400 to-orange-500",
      "solid": "text-orange-500",
      "bgSolid": "bg-orange-500",
      "sources": [
        "暴露"
      ],
      "items": [
        {
          "id": "s-clothing-1",
          "name": "不脱",
          "selected": false,
          "isNew": true
        },
        {
          "id": "s-clothing-2",
          "name": "内衣",
          "selected": false,
          "isNew": true
        },
        {
          "id": "s-clothing-3",
          "name": "半裸",
          "selected": false,
          "isNew": true
        },
        {
          "id": "s-clothing-4",
          "name": "全裸",
          "selected": false,
          "isNew": true
        }
      ]
    },
    {
      "id": "rhythm",
      "title": "节奏",
      "input": "multi",
      "color": "from-cyan-400 to-cyan-500",
      "solid": "text-cyan-500",
      "bgSolid": "bg-cyan-500",
      "sources": [
        "节奏"
      ],
      "items": [
        {
          "id": "s-rhythm-1",
          "name": "飞行棋",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-rhythm-2",
          "name": "匀速打",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-rhythm-3",
          "name": "随机节奏",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-rhythm-4",
          "name": "轻而快",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-rhythm-5",
          "name": "重而慢",
          "selected": false,
          "source": "柿子卡"
        }
      ]
    },
    {
      "id": "pleasure",
      "title": "快感来源",
      "input": "multi",
      "color": "from-fuchsia-400 to-fuchsia-500",
      "solid": "text-fuchsia-500",
      "bgSolid": "bg-fuchsia-500",
      "sources": [
        "快感来源"
      ],
      "items": [
        {
          "id": "s-pleasure-2",
          "name": "实践后的酸痛",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-pleasure-3",
          "name": "哭泣",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-pleasure-4",
          "name": "追求伤痕",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-pleasure-5",
          "name": "抗刑的成就感",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-pleasure-6",
          "name": "纯粹的疼痛",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-pleasure-7",
          "name": "被关爱照顾",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-pleasure-8",
          "name": "被控制感",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-pleasure-9",
          "name": "情感关系",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-pleasure-10",
          "name": "被管教感",
          "selected": false,
          "source": "柿子卡"
        }
      ]
    },
    {
      "id": "cooperation",
      "title": "实践配合",
      "input": "multi",
      "color": "from-pink-400 to-pink-500",
      "solid": "text-pink-500",
      "bgSolid": "bg-pink-500",
      "sources": [
        "气氛"
      ],
      "items": [
        {
          "id": "s-cooperation-1",
          "name": "安静挨罚",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-cooperation-2",
          "name": "乖巧配合",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-cooperation-3",
          "name": "主动请罚",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-cooperation-4",
          "name": "Brat",
          "selected": false,
          "source": "柿子卡"
        },
        {
          "id": "s-cooperation-5",
          "name": "边打边聊",
          "selected": false,
          "isNew": true
        },
        {
          "id": "s-cooperation-6",
          "name": "猛烈挣扎",
          "selected": false,
          "isNew": true
        }
      ]
    }
  ]
};

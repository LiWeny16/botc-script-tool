#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
添加梼杌、悟道者、引路人、入殓师的英文相克关系
"""
import json

jinx_file = r'c:\Learning\sample\synchronous github\botc-script-tool\botc-script-generator-modern\src\data\jinxEn.json'

# 读取现有数据
with open(jinx_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 新增的相克关系
new_jinxes = [
    {
        "id": "taowu",
        "jinx": [
            {
                "id": "scarletwoman",
                "reason": "The Scarlet Woman is considered \"without ability\" for the Taowu's ability."
            },
            {
                "id": "eviltwin",
                "reason": "The Evil Twin is considered \"without ability\" for the Taowu's ability."
            },
            {
                "id": "mastermind",
                "reason": "The Mastermind is considered \"without ability\" for the Taowu's ability."
            },
            {
                "id": "organgrinder",
                "reason": "When the Taowu is executed, if the Organ Grinder has their ability, the Storyteller announces \"no one was executed.\""
            },
            {
                "id": "marionette",
                "reason": "The Taowu does not learn who the Marionette is. After the Taowu causes the Marionette to lose their ability, the Taowu learns which Marionette it was, but the Marionette still believes they are a good character."
            },
            {
                "id": "hatter",
                "reason": "If the Taowu changes to another character, Minions who lost their ability due to the Taowu die immediately."
            },
            {
                "id": "pithag",
                "reason": "If the Taowu changes to another character, Minions who lost their ability due to the Taowu die immediately."
            },
            {
                "id": "engineer",
                "reason": "If the Taowu changes to another character, Minions who lost their ability due to the Taowu die immediately."
            },
            {
                "id": "snakecharmer",
                "reason": "If the Taowu changes to another character, Minions who lost their ability due to the Taowu die immediately."
            },
            {
                "id": "barber",
                "reason": "If the Taowu changes to another character, Minions who lost their ability due to the Taowu die immediately."
            }
        ]
    },
    {
        "id": "wudaozhe",
        "jinx": [
            {
                "id": "villageidiot",
                "reason": "If there are fewer than 3 Village Idiots in play, the Wudaozhe can become a new Village Idiot. If this causes more than 1 Village Idiot to be in play, one Village Idiot is drunk."
            }
        ]
    },
    {
        "id": "yinluren",
        "jinx": [
            {
                "id": "chambermaid",
                "reason": "The Chambermaid learns if the Yinluren wakes tonight or not, even though the Chambermaid wakes first."
            },
            {
                "id": "mathematician",
                "reason": "The Yinluren learns if the Mathematician is affected or not, even though they wake before the Mathematician."
            }
        ]
    },
    {
        "id": "rulianshi",
        "jinx": [
            {
                "id": "scarletwoman",
                "reason": "When the Rulianshi nominates and executes the Demon and successfully becomes the evil Demon, the Scarlet Woman does not become the Demon."
            },
            {
                "id": "alhadikhia",
                "reason": "If there are two living Al-Hadikhias, the Rulianshi who became Al-Hadikhia turns back into the Rulianshi, but remains evil."
            },
            {
                "id": "lilmonsta",
                "reason": "If there are 5 or more players alive when the Rulianshi nominates and executes the player babysitting Lil' Monsta, the Rulianshi becomes the evil version of that character, and the original Rulianshi player must babysit Lil' Monsta tonight."
            },
            {
                "id": "lleech",
                "reason": "If there are 5 or more players alive when the Rulianshi nominates and executes the host and they die from this execution, the original Lleech dies tonight, and the Rulianshi becomes the evil Lleech but cannot attack tonight."
            }
        ]
    }
]

# 添加新的相克关系
data.extend(new_jinxes)

# 写回文件
with open(jinx_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print(f"成功添加 {len(new_jinxes)} 个角色的相克关系")
print(f"当前总数: {len(data)} 个角色")

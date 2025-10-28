#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
比对中文角色与英文 roles.json，使用中英文 ID 映射以避免重复。
输出文件: missing_characters_with_mapping.txt
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
ROLES_JSON = ROOT / 'src' / 'data' / 'roles.json'
CHARACTERS_TS = ROOT / 'src' / 'data' / 'characters.ts'
MAPPING_TS = ROOT / 'src' / 'data' / 'characterIdMapping.ts'
OUTPUT = ROOT / 'missing_characters_with_mapping.txt'


def load_roles_ids():
    with open(ROLES_JSON, 'r', encoding='utf-8') as f:
        roles = json.load(f)
    return set(r.get('id') for r in roles), roles


def parse_cn_to_en_map():
    text = MAPPING_TS.read_text(encoding='utf-8')
    # 匹配像:  'fortune_teller': 'fortuneteller',
    pattern = re.compile(r"['\"]([a-z0-9_\-]+)['\"]\s*:\s*['\"]([a-z0-9_\-]+)['\"]")
    mapping = {}
    # 仅解析 CN_TO_EN_ID_MAP 对象体内的映射以避免抓到 EN_TO_CN_ID_MAP 反向映射
    # 找到 CN_TO_EN_ID_MAP 的起始位置
    m = re.search(r"CN_TO_EN_ID_MAP\s*:\s*Record<.*?>\s*=\s*\{", text)
    if m:
        start = m.end()
        # 从 start 找到对应的结束 '};'
        rest = text[start:]
        end_match = re.search(r"\}\s*;", rest)
        block = rest[:end_match.start()] if end_match else rest
        for k, v in pattern.findall(block):
            mapping[k] = v
    else:
        # 兜底：尝试全局解析（保守）
        for k, v in pattern.findall(text):
            mapping[k] = v
    return mapping


def parse_characters():
    text = CHARACTERS_TS.read_text(encoding='utf-8')
    # 提取所有中文 id
    ids = re.findall(r'"([a-z0-9_\-]+)"\s*:\s*\{', text)
    # 去重并保持顺序
    seen = set()
    ordered = []
    for id_ in ids:
        if id_ not in seen:
            seen.add(id_)
            ordered.append(id_)
    # 准备字典存储 name & ability
    info = {}
    for cid in ordered:
        # 非贪婪匹配该角色对象体
        pat = re.compile(rf'"{re.escape(cid)}"\s*:\s*\{{(.*?)\}}\s*,', re.DOTALL)
        m = pat.search(text)
        block = m.group(1) if m else ''
        # 提取 name
        name_m = re.search(r'"name"\s*:\s*"([^"]+)"', block)
        ability_m = re.search(r'"ability"\s*:\s*"([\s\S]*?)"\s*(?:,|$)', block)
        name = name_m.group(1) if name_m else ''
        ability = ability_m.group(1) if ability_m else ''
        # 清理能力字符串里的换行和多余空格
        ability = re.sub(r"\s+", " ", ability).strip()
        info[cid] = {
            'name': name,
            'ability': ability,
            'raw_block': block
        }
    return ordered, info


def main():
    en_ids_set, roles_list = load_roles_ids()
    mapping = parse_cn_to_en_map()
    cn_ordered, cn_info = parse_characters()

    missing = []
    mapped_present = []

    for cn_id in cn_ordered:
        en_id = mapping.get(cn_id, cn_id)
        if en_id in en_ids_set:
            mapped_present.append((cn_id, en_id))
        else:
            missing.append((cn_id, en_id, cn_info.get(cn_id, {})))

    # 输出到文件
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write('中文有但英文 roles.json 中不存在（经映射后） 的角色列表\n')
        f.write('=\n')
        f.write(f'Total missing: {len(missing)}\n\n')
        for cn_id, en_id, info in missing:
            f.write(f'CN_ID: {cn_id}\n')
            f.write(f'MAPPED_EN_ID: {en_id}\n')
            f.write(f'Name (zh): {info.get("name","")}\n')
            f.write(f'Ability (zh): {info.get("ability","")}\n')
            f.write('-' * 40 + '\n')

        f.write('\n\n存在映射并已在 roles.json 中的条目（以供参考）\n')
        f.write('=\n')
        for cn_id, en_id in mapped_present:
            f.write(f'{cn_id} -> {en_id}\n')

    # 控制台打印简要结果
    print('Done. Results saved to:', OUTPUT)
    print('Missing count:', len(missing))
    if missing:
        print('\nSample missing:')
        for cn_id, en_id, info in missing[:10]:
            print(f'  {cn_id} -> {en_id} | {info.get("name","")}')

if __name__ == '__main__':
    main()

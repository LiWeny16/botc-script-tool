#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
提取缺失角色的完整信息并生成 JSON 条目，准备添加到 roles.json
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
CHARACTERS_TS = ROOT / 'src' / 'data' / 'characters.ts'
ROLES_JSON = ROOT / 'src' / 'data' / 'roles.json'
MISSING_TXT = ROOT / 'missing_characters_with_mapping.txt'
OUTPUT_JSON = ROOT / 'roles_to_add.json'

def parse_missing_ids():
    """从 missing_characters_with_mapping.txt 提取缺失的角色 ID"""
    text = MISSING_TXT.read_text(encoding='utf-8')
    pattern = re.compile(r'CN_ID:\s*(\S+)')
    return pattern.findall(text)

def extract_role_data(char_id, characters_content):
    """从 characters.ts 提取指定角色的完整数据"""
    # 匹配角色对象块
    pattern = rf'"{re.escape(char_id)}"\s*:\s*\{{(.*?)\n  \}}(?:,|\n)'
    match = re.search(pattern, characters_content, re.DOTALL)
    if not match:
        return None
    
    block = match.group(1)
    
    # 提取各个字段
    def extract_field(field_name, default=''):
        # 字符串字段
        m = re.search(rf'"{field_name}"\s*:\s*"((?:[^"\\]|\\.)*)"', block)
        if m:
            return m.group(1)
        # 数字字段
        m = re.search(rf'"{field_name}"\s*:\s*(\d+)', block)
        if m:
            return int(m.group(1))
        # 布尔字段
        m = re.search(rf'"{field_name}"\s*:\s*(true|false)', block)
        if m:
            return m.group(1) == 'true'
        # 数组字段
        m = re.search(rf'"{field_name}"\s*:\s*\[(.*?)\]', block, re.DOTALL)
        if m:
            array_content = m.group(1)
            items = re.findall(r'"([^"]*)"', array_content)
            return items
        return default
    
    role_data = {
        'id': char_id,
        'name': extract_field('name', char_id),
        'edition': extract_field('edition', 'custom'),
        'team': extract_field('team', 'townsfolk'),
        'firstNight': extract_field('firstNight', 0),
        'firstNightReminder': extract_field('firstNightReminder', ''),
        'otherNight': extract_field('otherNight', 0),
        'otherNightReminder': extract_field('otherNightReminder', ''),
        'reminders': extract_field('reminders', []),
        'setup': extract_field('setup', False),
        'ability': extract_field('ability', '')
    }
    
    # 提取可选字段
    reminders_global = extract_field('remindersGlobal', None)
    if reminders_global and reminders_global != []:
        role_data['remindersGlobal'] = reminders_global
    
    return role_data

def main():
    # 读取缺失的角色 ID
    missing_ids = parse_missing_ids()
    print(f'Found {len(missing_ids)} missing role IDs')
    
    # 读取 characters.ts
    characters_content = CHARACTERS_TS.read_text(encoding='utf-8')
    
    # 提取每个角色的数据
    roles_to_add = []
    for char_id in missing_ids:
        role_data = extract_role_data(char_id, characters_content)
        if role_data:
            roles_to_add.append(role_data)
            print(f'  Extracted: {char_id} ({role_data["name"]})')
        else:
            print(f'  WARNING: Could not extract data for {char_id}')
    
    # 保存到 JSON 文件
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(roles_to_add, f, ensure_ascii=False, indent=2)
    
    print(f'\nExtracted {len(roles_to_add)} roles')
    print(f'Saved to: {OUTPUT_JSON}')
    
    # 现在将这些角色添加到 roles.json
    with open(ROLES_JSON, 'r', encoding='utf-8') as f:
        existing_roles = json.load(f)
    
    print(f'\nExisting roles in roles.json: {len(existing_roles)}')
    
    # 合并
    combined = existing_roles + roles_to_add
    
    # 保存更新后的 roles.json
    with open(ROLES_JSON, 'w', encoding='utf-8') as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)
    
    print(f'Updated roles.json with {len(roles_to_add)} new roles')
    print(f'Total roles now: {len(combined)}')
    print('\n✓ Done! You can now translate the Chinese text in roles.json')

if __name__ == '__main__':
    main()

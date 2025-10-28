#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查 roles.json 中的重复、空对象等问题
"""

import json

def check_roles():
    filepath = r'c:\Learning\sample\synchronous github\botc-script-tool\botc-script-generator-modern\src\data\roles.json'
    
    print("正在加载 roles.json...")
    with open(filepath, 'r', encoding='utf-8') as f:
        roles = json.load(f)
    
    print(f"\n{'='*60}")
    print(f"总角色数: {len(roles)}")
    print(f"{'='*60}\n")
    
    # 检查空对象
    print("🔍 检查空对象和无ID对象:")
    print("-" * 60)
    empty_count = 0
    for i, role in enumerate(roles):
        if not role:
            print(f"  索引 {i}: 空对象 {role}")
            empty_count += 1
        elif not role.get('id'):
            print(f"  索引 {i}: 无ID - name={role.get('name', 'N/A')}, team={role.get('team', 'N/A')}")
            print(f"    完整数据: {role}")
            empty_count += 1
    
    print(f"\n空对象/无ID对象总数: {empty_count}")
    
    # 检查重复ID
    print(f"\n🔍 检查重复ID:")
    print("-" * 60)
    id_map = {}
    duplicates = []
    
    for i, role in enumerate(roles):
        role_id = role.get('id', '')
        if role_id:
            if role_id in id_map:
                duplicates.append({
                    'id': role_id,
                    'first_index': id_map[role_id],
                    'duplicate_index': i,
                    'first_name': roles[id_map[role_id]].get('name'),
                    'duplicate_name': role.get('name')
                })
                print(f"  重复ID: '{role_id}'")
                print(f"    首次出现: 索引 {id_map[role_id]} - {roles[id_map[role_id]].get('name', 'N/A')}")
                print(f"    重复出现: 索引 {i} - {role.get('name', 'N/A')}")
            else:
                id_map[role_id] = i
    
    print(f"\n重复ID总数: {len(duplicates)}")
    
    # 按team统计
    print(f"\n📊 按团队统计:")
    print("-" * 60)
    team_counts = {}
    for role in roles:
        team = role.get('team', 'unknown')
        team_counts[team] = team_counts.get(team, 0) + 1
    
    for team, count in sorted(team_counts.items()):
        print(f"  {team:15}: {count:3} 个")
    
    # 检查特定索引附近的角色
    print(f"\n🔍 检查索引 2533 附近的角色 (ganshiren 附近):")
    print("-" * 60)
    target_indices = range(2530, 2540)
    for i in target_indices:
        if i < len(roles):
            role = roles[i]
            print(f"  [{i:4}] id='{role.get('id', '<empty>'):20}' name='{role.get('name', 'N/A'):25}' team='{role.get('team', 'N/A')}'")
    
    print(f"\n{'='*60}")
    print("检查完成!")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    check_roles()

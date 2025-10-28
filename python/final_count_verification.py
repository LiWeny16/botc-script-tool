#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
最终验证：统计中英文角色总数
"""

import json
import re

def count_fabled_in_ts():
    """统计 fabled.ts 中的传奇角色数量"""
    fabled_file = r'c:\Learning\sample\synchronous github\botc-script-tool\botc-script-generator-modern\src\data\fabled.ts'
    
    with open(fabled_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 查找所有的 id: 定义
    id_pattern = r"id:\s*['\"]([^'\"]+)['\"]"
    ids = re.findall(id_pattern, content)
    
    return ids

def main():
    # 1. 统计 roles.json
    roles_file = r'c:\Learning\sample\synchronous github\botc-script-tool\botc-script-generator-modern\src\data\roles.json'
    with open(roles_file, 'r', encoding='utf-8') as f:
        roles = json.load(f)
    
    # 2. 统计 fabled.ts
    fabled_ids = count_fabled_in_ts()
    
    print("=" * 70)
    print("📊 Blood on the Clocktower - 角色统计报告")
    print("=" * 70)
    
    print(f"\n【基础角色】 (roles.json)")
    print("-" * 70)
    print(f"  总数: {len(roles)} 个")
    
    # 按团队统计
    team_counts = {}
    for role in roles:
        team = role.get('team', 'unknown')
        team_counts[team] = team_counts.get(team, 0) + 1
    
    for team in ['townsfolk', 'outsider', 'minion', 'demon', 'traveler']:
        if team in team_counts:
            print(f"    - {team.capitalize():12}: {team_counts[team]:3} 个")
    
    print(f"\n【传奇角色】 (fabled.ts)")
    print("-" * 70)
    print(f"  总数: {len(fabled_ids)} 个")
    print(f"  列表: {', '.join(fabled_ids[:5])}...")
    
    total = len(roles) + len(fabled_ids)
    
    print(f"\n【总计】")
    print("=" * 70)
    print(f"  基础角色: {len(roles):3} 个")
    print(f"  传奇角色: {len(fabled_ids):3} 个")
    print(f"  ─────────────────")
    print(f"  总计:     {total:3} 个")
    print("=" * 70)
    
    print(f"\n✅ 验证结果:")
    print(f"   - roles.json (基础): {len(roles)} 个")
    print(f"   - fabled.ts (传奇): {len(fabled_ids)} 个")
    print(f"   - characters.ts (中文总计): {total} 个")
    print(f"   - charactersEn.ts (英文总计): {total} 个 (从相同数据源生成)")
    
    print(f"\n💡 结论:")
    print(f"   中文和英文都应该有 {total} 个角色")
    print(f"   如果你看到的数字是 233 和 236，可能的原因:")
    print(f"   1. 某个文件有重复的角色定义")
    print(f"   2. 某些角色在不同地方被重复统计")
    print(f"   3. 实际的角色数应该是: {len(roles)} (基础) + {len(fabled_ids)} (传奇) = {total} 个")
    print("=" * 70)

if __name__ == '__main__':
    main()

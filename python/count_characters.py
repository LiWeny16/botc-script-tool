#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
统计 characters.ts 中实际有多少角色
"""

import re
import json

def count_characters_in_ts():
    # 读取 characters.ts
    cn_file = r'c:\Learning\sample\synchronous github\botc-script-tool\botc-script-generator-modern\src\data\characters.ts'
    
    print("正在分析 characters.ts...")
    with open(cn_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 查找所有的 id: 定义
    id_pattern = r"id:\s*['\"]([^'\"]+)['\"]"
    ids = re.findall(id_pattern, content)
    
    print(f"\n{'='*60}")
    print(f"在 characters.ts 中找到的 id 定义: {len(ids)} 个")
    print(f"{'='*60}\n")
    
    # 统计重复
    from collections import Counter
    id_counts = Counter(ids)
    
    duplicates = {id_val: count for id_val, count in id_counts.items() if count > 1}
    
    if duplicates:
        print(f"🔴 发现重复ID ({len(duplicates)} 个):")
        print("-" * 60)
        for id_val, count in sorted(duplicates.items()):
            print(f"  {id_val:30} 出现 {count} 次")
    else:
        print("✅ 没有发现重复ID")
    
    # 检查是否导入了 fabled
    if 'fabled' in content.lower():
        print(f"\n✅ characters.ts 导入了 fabled 角色")
        
        # 读取 fabled.ts
        fabled_file = r'c:\Learning\sample\synchronous github\botc-script-tool\botc-script-generator-modern\src\data\fabled.ts'
        try:
            with open(fabled_file, 'r', encoding='utf-8') as f:
                fabled_content = f.read()
            
            fabled_ids = re.findall(id_pattern, fabled_content)
            print(f"   在 fabled.ts 中找到: {len(fabled_ids)} 个传奇角色")
            print(f"   传奇角色列表: {', '.join(fabled_ids)}")
        except:
            print("   ⚠️  无法读取 fabled.ts")
    
    print(f"\n📊 预估总角色数:")
    print("-" * 60)
    print(f"  roles.json: 213 个")
    
    # 尝试估算传奇角色数
    if 'fabled' in content.lower():
        try:
            with open(r'c:\Learning\sample\synchronous github\botc-script-tool\botc-script-generator-modern\src\data\fabled.ts', 'r', encoding='utf-8') as f:
                fabled_content = f.read()
            fabled_ids = re.findall(id_pattern, fabled_content)
            print(f"  + fabled: {len(fabled_ids)} 个")
            print(f"  = 总计: {213 + len(fabled_ids)} 个")
        except:
            print(f"  + fabled: ? 个 (无法读取)")
            print(f"  = 总计: 213 + ? 个")

if __name__ == '__main__':
    count_characters_in_ts()

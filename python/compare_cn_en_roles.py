#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
对比中英文角色数据,找出差异
"""

import json
import sys

def load_json_file(filepath):
    """加载JSON文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return None

def normalize_id(id_str):
    """标准化ID - 移除特殊字符,统一格式"""
    if not id_str:
        return ""
    # 移除下划线和连字符,转小写
    return id_str.replace('_', '').replace('-', '').lower().strip()

def compare_roles(cn_roles, en_roles):
    """对比中英文角色数据"""
    print(f"\n{'='*60}")
    print(f"中文角色总数: {len(cn_roles)}")
    print(f"英文角色总数: {len(en_roles)}")
    print(f"差异: {len(en_roles) - len(cn_roles)} 个")
    print(f"{'='*60}\n")
    
    # 创建ID集合 - 使用标准化的ID
    cn_ids = {}  # normalized_id -> original_id
    en_ids = {}  # normalized_id -> original_id
    
    # 收集中文角色ID (包括空ID的情况)
    for i, role in enumerate(cn_roles):
        role_id = role.get('id', '')
        if not role_id:
            print(f"⚠️  中文角色索引 {i} 没有ID: {role.get('name', 'Unknown')}")
            cn_ids[f"empty_{i}"] = f"<empty at index {i}>"
        else:
            normalized = normalize_id(role_id)
            if normalized in cn_ids:
                print(f"⚠️  中文重复ID发现: '{role_id}' (标准化: '{normalized}')")
                print(f"   已存在: {cn_ids[normalized]}, 当前: {role_id}")
            cn_ids[normalized] = role_id
    
    # 收集英文角色ID (包括空ID的情况)
    for i, role in enumerate(en_roles):
        role_id = role.get('id', '')
        if not role_id:
            print(f"⚠️  英文角色索引 {i} 没有ID: {role.get('name', 'Unknown')}")
            en_ids[f"empty_{i}"] = f"<empty at index {i}>"
        else:
            normalized = normalize_id(role_id)
            if normalized in en_ids:
                print(f"⚠️  英文重复ID发现: '{role_id}' (标准化: '{normalized}')")
                print(f"   已存在: {en_ids[normalized]}, 当前: {role_id}")
            en_ids[normalized] = role_id
    
    cn_normalized_set = set(cn_ids.keys())
    en_normalized_set = set(en_ids.keys())
    
    # 找出只在英文中存在的角色
    only_in_en = en_normalized_set - cn_normalized_set
    # 找出只在中文中存在的角色
    only_in_cn = cn_normalized_set - en_normalized_set
    
    if only_in_en:
        print(f"\n🔴 只在英文中存在的角色 ({len(only_in_en)} 个):")
        print("-" * 60)
        for norm_id in sorted(only_in_en):
            orig_id = en_ids[norm_id]
            # 找到对应的角色信息
            role_info = next((r for r in en_roles if normalize_id(r.get('id', '')) == norm_id), None)
            if role_info:
                print(f"  • {orig_id:30} | {role_info.get('name', 'N/A'):30} | {role_info.get('team', 'N/A')}")
            else:
                print(f"  • {orig_id}")
    
    if only_in_cn:
        print(f"\n🔵 只在中文中存在的角色 ({len(only_in_cn)} 个):")
        print("-" * 60)
        for norm_id in sorted(only_in_cn):
            orig_id = cn_ids[norm_id]
            # 找到对应的角色信息
            role_info = next((r for r in cn_roles if normalize_id(r.get('id', '')) == norm_id), None)
            if role_info:
                print(f"  • {orig_id:30} | {role_info.get('name', 'N/A'):30} | {role_info.get('team', 'N/A')}")
            else:
                print(f"  • {orig_id}")
    
    # 检查是否有空对象
    print(f"\n🔍 检查空对象:")
    print("-" * 60)
    
    cn_empty_count = sum(1 for role in cn_roles if not role or not role.get('id'))
    en_empty_count = sum(1 for role in en_roles if not role or not role.get('id'))
    
    print(f"中文空对象/无ID对象数量: {cn_empty_count}")
    print(f"英文空对象/无ID对象数量: {en_empty_count}")
    
    if cn_empty_count > 0:
        print(f"\n中文空对象/无ID对象详情:")
        for i, role in enumerate(cn_roles):
            if not role or not role.get('id'):
                print(f"  索引 {i}: {role}")
    
    if en_empty_count > 0:
        print(f"\n英文空对象/无ID对象详情:")
        for i, role in enumerate(en_roles):
            if not role or not role.get('id'):
                print(f"  索引 {i}: {role}")
    
    print(f"\n{'='*60}")
    print(f"分析完成!")
    print(f"{'='*60}\n")
    
    return only_in_en, only_in_cn

def main():
    # 文件路径
    cn_file = r'c:\Learning\sample\synchronous github\botc-script-tool\botc-script-generator-modern\src\data\roles.json'
    en_file = r'c:\Learning\sample\synchronous github\botc-script-tool\botc-script-generator-modern\src\data\charactersEn.ts'
    
    print("正在加载中文角色数据...")
    cn_roles = load_json_file(cn_file)
    
    if cn_roles is None:
        print("❌ 无法加载中文角色数据")
        return
    
    print(f"✅ 中文角色数据加载成功: {len(cn_roles)} 个角色")
    
    # 对于英文文件,我们需要先读取并提取JSON部分
    print("\n正在加载英文角色数据...")
    try:
        with open(en_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # 尝试找到JSON数组
        # 查找 export const CHARACTERS_EN 后的数组
        import re
        
        # 尝试多种模式
        patterns = [
            r'export\s+const\s+CHARACTERS_EN\s*[:\=]\s*(\[[\s\S]*?\]);',
            r'CHARACTERS_EN\s*[:\=]\s*(\[[\s\S]*?\]);',
            r'=\s*(\[[\s\S]*?\]);',
        ]
        
        json_str = None
        for pattern in patterns:
            match = re.search(pattern, content)
            if match:
                json_str = match.group(1)
                break
        
        if not json_str:
            print("❌ 无法从英文文件中提取角色数据")
            print("文件内容预览:", content[:500])
            return
        
        # 清理TypeScript特有的语法
        json_str = re.sub(r'//.*?\n', '\n', json_str)  # 移除单行注释
        json_str = re.sub(r'/\*[\s\S]*?\*/', '', json_str)  # 移除多行注释
        
        en_roles = json.loads(json_str)
        print(f"✅ 英文角色数据加载成功: {len(en_roles)} 个角色")
        
    except Exception as e:
        print(f"❌ 加载英文角色数据时出错: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 执行对比
    compare_roles(cn_roles, en_roles)

if __name__ == '__main__':
    main()

import re
import json

def extract_character_names_from_ts():
    """从 characters.ts 文件中提取所有角色的中文名字"""
    
    # 读取 characters.ts 文件
    file_path = '../src/data/characters.ts'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 使用正则表达式提取所有的 name 字段
    # 匹配模式: "name": "中文名字"
    pattern = r'"name":\s*"([^"]+)"'
    matches = re.findall(pattern, content)
    
    # 去重并排序
    unique_names = sorted(set(matches))
    
    print(f"找到 {len(unique_names)} 个唯一的角色名字：\n")
    
    # 输出所有名字
    for name in unique_names:
        print(f"  '{name}': '',")
    
    # 保存到文件
    output_file = 'character_names.txt'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("所有角色名字列表（请补充拼音）：\n\n")
        for name in unique_names:
            f.write(f"  '{name}': '',\n")
    
    print(f"\n\n结果已保存到 {output_file}")
    print(f"\n总计: {len(unique_names)} 个角色")
    
    return unique_names

if __name__ == '__main__':
    names = extract_character_names_from_ts()

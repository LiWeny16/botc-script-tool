import os
import re
import json
import requests
from pathlib import Path
from urllib.parse import urlparse

# 团队类型映射到文件夹名称
TEAM_FOLDER_MAP = {
    'townsfolk': 'townsfolk',
    'outsider': 'outsider',
    'minion': 'minion',
    'demon': 'demon',
    'traveler': 'traveler',  # 旅行者放在traveler文件夹
    'fabled': 'fabled',
    'loric': 'Loric'
}

def parse_ts_file(file_path):
    """解析TypeScript文件中的角色数据"""
    print(f"正在解析文件: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    characters = []
    
    # 提取所有角色对象 - 使用更灵活的方法
    # 先找到所有的角色对象块
    object_pattern = r'"(\w+)":\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}'
    object_matches = re.findall(object_pattern, content, re.DOTALL)
    
    for char_id, obj_content in object_matches:
        # 在对象内容中查找image和team
        image_match = re.search(r'"image":\s*"([^"]+)"', obj_content)
        team_match = re.search(r'"team":\s*"([^"]+)"', obj_content)
        
        if image_match and team_match:
            characters.append({
                'id': char_id,
                'image': image_match.group(1),
                'team': team_match.group(1)
            })
    
    print(f"共找到 {len(characters)} 个角色")
    return characters

def parse_fabled_ts_file(file_path):
    """解析fabled.ts或loric.ts文件中的角色数据"""
    file_name = Path(file_path).name
    print(f"正在解析文件: {file_name}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    characters = []
    
    # 判断是fabled还是loric
    team_type = 'loric' if 'loric' in file_name.lower() else 'fabled'
    
    # 匹配数组格式中的角色对象
    # 先匹配 team 在前的情况
    pattern1 = rf'\{{\s*id:\s*[\'"](\w+)[\'"][^}}]*?team:\s*[\'"]{team_type}[\'"][^}}]*?image:\s*[\'"]([^"\']+)[\'"]'
    matches1 = re.findall(pattern1, content, re.DOTALL)
    for char_id, image_url in matches1:
        characters.append({
            'id': char_id,
            'image': image_url,
            'team': team_type
        })
    
    # 再匹配 image 在前的情况
    pattern2 = rf'\{{\s*id:\s*[\'"](\w+)[\'"][^}}]*?image:\s*[\'"]([^"\']+)[\'"][^}}]*?team:\s*[\'"]{team_type}[\'"]'
    matches2 = re.findall(pattern2, content, re.DOTALL)
    for char_id, image_url in matches2:
        # 避免重复添加
        if char_id not in [c['id'] for c in characters]:
            characters.append({
                'id': char_id,
                'image': image_url,
                'team': team_type
            })
    
    print(f"共找到 {len(characters)} 个{team_type}角色")
    return characters

def download_image(url, save_path):
    """下载图片"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        with open(save_path, 'wb') as f:
            f.write(response.content)
        
        return True
    except KeyboardInterrupt:
        print(f"  ⚠️ 用户中断")
        raise
    except Exception as e:
        print(f"  ❌ 下载失败: {str(e)[:50]}")
        return False

def main():
    # 文件路径配置
    script_dir = Path(__file__).parent.resolve()
    project_root = script_dir.parent
    ts_file = project_root / 'src' / 'data' / 'characters.ts'
    fabled_file = project_root / 'src' / 'data' / 'fabled.ts'
    loric_file = project_root / 'src' / 'data' / 'loric.ts'
    icons_dir = project_root / 'public' / 'imgs' / 'icons'
    
    print(f"脚本目录: {script_dir}")
    print(f"项目根目录: {project_root}")
    print(f"查找文件: {ts_file}")
    print(f"查找文件: {fabled_file}")
    print(f"查找文件: {loric_file}")
    
    if not ts_file.exists():
        print(f"错误: 找不到文件 {ts_file}")
        print(f"请确认项目结构是否正确")
        return
    
    # 解析角色数据
    characters = parse_ts_file(ts_file)
    
    # 解析fabled角色数据
    if fabled_file.exists():
        fabled_characters = parse_fabled_ts_file(fabled_file)
        characters.extend(fabled_characters)
    else:
        print(f"警告: 未找到fabled.ts文件")
    
    # 解析loric角色数据
    if loric_file.exists():
        loric_characters = parse_fabled_ts_file(loric_file)  # 使用相同的解析函数
        characters.extend(loric_characters)
    else:
        print(f"警告: 未找到loric.ts文件")
    
    if not characters:
        print("没有找到角色数据")
        return
    
    # 统计信息
    total_count = len(characters)
    downloaded_count = 0
    skipped_count = 0
    failed_count = 0
    
    print(f"\n开始下载图片到: {icons_dir}\n")
    
    # 遍历每个角色并下载图片
    try:
        for i, char in enumerate(characters, 1):
            char_id = char['id']
            image_url = char['image']
            team = char['team']
            
            # 确定保存文件夹
            folder_name = TEAM_FOLDER_MAP.get(team, 'townsfolk')
            target_dir = icons_dir / folder_name
            
            # 创建文件夹(如果不存在)
            target_dir.mkdir(parents=True, exist_ok=True)
            
            # 确定文件名(使用角色ID + .png)
            filename = f"{char_id}.png"
            save_path = target_dir / filename
            
            # 检查文件是否已存在
            if save_path.exists():
                print(f"⏭️  [{i}/{total_count}] 跳过 [{team}] {char_id} - 文件已存在")
                skipped_count += 1
                continue
            
            # 下载图片
            print(f"⬇️  [{i}/{total_count}] 下载 [{team}] {char_id}")
            print(f"  URL: {image_url}")
            print(f"  保存到: {save_path}")
            
            if download_image(image_url, save_path):
                print(f"  ✅ 下载成功")
                downloaded_count += 1
            else:
                failed_count += 1
            
            print()
    except KeyboardInterrupt:
        print("\n\n⚠️  下载被用户中断")
        print(f"已下载: {downloaded_count}, 跳过: {skipped_count}, 失败: {failed_count}")
    
    # 打印统计信息
    print("=" * 60)
    print(f"下载完成!")
    print(f"总角色数: {total_count}")
    print(f"成功下载: {downloaded_count}")
    print(f"跳过(已存在): {skipped_count}")
    print(f"下载失败: {failed_count}")
    print("=" * 60)

if __name__ == '__main__':
    main()

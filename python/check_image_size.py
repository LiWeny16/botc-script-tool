import os
from pathlib import Path

def get_folder_size(folder_path):
    """计算文件夹的总大小"""
    total_size = 0
    file_count = 0
    
    for dirpath, dirnames, filenames in os.walk(folder_path):
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            if os.path.isfile(filepath):
                total_size += os.path.getsize(filepath)
                file_count += 1
    
    return total_size, file_count

def format_size(size_bytes):
    """格式化文件大小"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    icons_dir = project_root / 'public' / 'imgs' / 'icons'
    
    if not icons_dir.exists():
        print(f"错误: 找不到目录 {icons_dir}")
        return
    
    print("=" * 60)
    print("图片文件统计")
    print("=" * 60)
    
    # 统计各个子文件夹
    subdirs = ['townsfolk', 'outsider', 'minion', 'demon', 'traveler', 'fabled', 'Loric']
    
    total_all_size = 0
    total_all_files = 0
    
    for subdir in subdirs:
        subdir_path = icons_dir / subdir
        if subdir_path.exists():
            size, count = get_folder_size(subdir_path)
            total_all_size += size
            total_all_files += count
            print(f"{subdir:15s}: {count:4d} 个文件, {format_size(size):>12s}")
    
    # 统计根目录下的文件
    root_files = [f for f in icons_dir.iterdir() if f.is_file()]
    if root_files:
        root_size = sum(f.stat().st_size for f in root_files)
        total_all_size += root_size
        total_all_files += len(root_files)
        print(f"{'根目录':15s}: {len(root_files):4d} 个文件, {format_size(root_size):>12s}")
    
    print("=" * 60)
    print(f"{'总计':15s}: {total_all_files:4d} 个文件, {format_size(total_all_size):>12s}")
    print("=" * 60)
    
    # 评估是否适合上传到GitHub
    print("\nGitHub上传评估:")
    if total_all_size < 50 * 1024 * 1024:  # 50MB
        print("✅ 文件大小较小，完全适合上传到GitHub")
    elif total_all_size < 500 * 1024 * 1024:  # 500MB
        print("⚠️  文件大小中等，可以上传但建议考虑优化")
    else:
        print("❌ 文件过大，建议使用Git LFS或其他存储方案")
    
    print(f"\n建议:")
    print(f"1. 如果总大小 > 100MB，考虑使用 Git LFS")
    print(f"2. 如果图片较多，可以考虑压缩优化")
    print(f"3. 或者使用CDN托管图片，代码仓库只保留引用")

if __name__ == '__main__':
    main()

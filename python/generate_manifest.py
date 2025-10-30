import json
import hashlib
from pathlib import Path
from typing import Dict, Any, List, Union


ROOT = Path(__file__).resolve().parents[1]
JSON_ROOT = ROOT / 'public' / 'scripts' / 'json'
MANIFEST_PATH = JSON_ROOT / 'manifest.json'


def slugify(text: str) -> str:
    slug = ''.join(ch.lower() if ch.isalnum() else '-' for ch in text)
    while '--' in slug:
        slug = slug.replace('--', '-')
    return slug.strip('-') or hashlib.md5(text.encode('utf-8')).hexdigest()[:8]


def detect_category(dir_path: Path) -> str:
    name = dir_path.name.lower()
    if name == 'official':
        return 'official'
    if name == 'official_mix':
        return 'official_mix'
    return 'custom'


def read_json_safely(p: Path) -> Union[Dict[str, Any], List[Any]]:
    try:
        with p.open('r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}


def extract_meta(data: Union[Dict[str, Any], List[Any]]) -> Dict[str, Any]:
    """从 JSON 数据提取 _meta 信息，兼容数组格式与对象格式。
    - 对象：直接 data.get('_meta', {})
    - 数组：查找第一个 id == '_meta' 的对象
    """
    if isinstance(data, dict):
        return data.get('_meta', {}) or {}
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict) and item.get('id') == '_meta':
                return item
    return {}


def collect_entries() -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []

    if not JSON_ROOT.exists():
        return entries

    # 遍历一级子目录（official / official_mix / custom）
    for sub in sorted(JSON_ROOT.iterdir()):
        if not sub.is_dir():
            continue
        category = detect_category(sub)

        for jf in sorted(sub.rglob('*.json')):
            data = read_json_safely(jf)
            meta = extract_meta(data)

            name = meta.get('name') or jf.stem
            # 英文名支持多种命名：name_en / title_en / nameEn / titleEn
            name_en = (
                meta.get('name_en')
                or meta.get('title_en')
                or meta.get('nameEn')
                or meta.get('titleEn')
                or ''
            )
            # 官方目录默认作者为 Official，其它为 未知
            author = meta.get('author') or meta.get('authors') or ('Official' if category == 'official' else '未知')
            description = meta.get('description') or ''
            logo = meta.get('logo') or meta.get('icon') or ''

            # 生成稳定 id
            base_id = f"{category}:{name}:{jf.name}"
            id_ = slugify(base_id)

            # 生成可被前端直接 fetch 的路径（以 public 为根）
            # 需要确保路径形如 /scripts/json/.../file.json
            public_rel = jf.relative_to(ROOT / 'public')  # scripts/json/.../file.json
            json_url = '/' + str(public_rel).replace('\\', '/')

            entries.append({
                'id': id_,
                'name': name,
                'nameEn': name_en,
                'author': author,
                'description': description,
                'category': category,
                'logo': logo,
                'jsonUrl': json_url,
                'file': jf.name,
                'dir': str(jf.parent.relative_to(JSON_ROOT)).replace('\\', '/'),
            })

    return entries


def write_manifest(entries: List[Dict[str, Any]]):
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        'generatedAt': __import__('datetime').datetime.utcnow().isoformat() + 'Z',
        'version': 1,
        'scripts': entries,
    }
    with MANIFEST_PATH.open('w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def main():
    entries = collect_entries()
    write_manifest(entries)
    print(f"Generated {len(entries)} entries -> {MANIFEST_PATH}")


if __name__ == '__main__':
    main()



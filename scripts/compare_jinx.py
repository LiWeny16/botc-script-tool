import json
import sys

# Load files
with open(r'c:\Learning\sample\synchronous-github\botc-script-tool\botc-script-generator-modern\src\data\sources\jinxZh.json', 'r', encoding='utf-8') as f:
    jinxZh = json.load(f)

with open(r'c:\Learning\sample\synchronous-github\botc-script-tool\botc-script-generator-modern\src\data\sources\jinxEn.json', 'r', encoding='utf-8') as f:
    jinxEn = json.load(f)

with open(r'c:\Learning\sample\synchronous-github\botc-script-tool\botc-script-generator-modern\src\data\sources\roles.json', 'r', encoding='utf-8') as f:
    roles = json.load(f)

# Build name lookup: id -> English name
name_map = {}
for r in roles:
    name_map[r['id']] = r.get('name', r['id'])

def normalize_id(id_str):
    """Normalize character ID to match English file conventions"""
    mapping = {
        'fang_gu': 'fanggu',
        'scarlet_woman': 'scarletwoman',
        'al-hadikhia': 'alhadikhia',
        'lil_monsta': 'lilmonsta',
        'poppy_grower': 'poppygrower',
        'pit-hag': 'pithag',
        'evil_twin': 'eviltwin',
        'bounty_hunter': 'bountyhunter',
        'cult_leader': 'cultleader',
        'village_idiot': 'villageidiot',
        'snake_charmer': 'snakecharmer',
        'lord_of_typhon': 'lordoftyphon',
        'organ_grinder': 'organgrinder',
        'plague_doctor': 'plaguedoctor',
        # Alternate pinyin spellings
        'dayangren': 'dagengren',
    }
    return mapping.get(id_str, id_str)

# Build English jinx lookup: (owner, target) -> reason
en_jinx = {}
for entry in jinxEn:
    owner = entry['id']
    for j in entry['jinx']:
        target = j['id']
        en_jinx[(owner, target)] = j['reason']

def find_en_match(zh_owner, zh_target):
    """Find English jinx entry for a given Chinese owner->target pair, checking both directions"""
    norm_owner = normalize_id(zh_owner)
    norm_target = normalize_id(zh_target)

    # Try forward
    key = (norm_owner, norm_target)
    if key in en_jinx:
        return en_jinx[key]

    # Try reverse
    key_rev = (norm_target, norm_owner)
    if key_rev in en_jinx:
        return en_jinx[key_rev]

    return None

def get_en_name(char_id):
    """Get English character name from roles.json"""
    norm = normalize_id(char_id)
    if norm in name_map:
        return name_map[norm]
    if char_id in name_map:
        return name_map[char_id]
    return char_id

updates = []
creates = []

for entry in jinxZh:
    owner_id = entry['id']
    owner_en_name = get_en_name(owner_id)

    for j in entry['jinx']:
        target_id = j['id']
        target_en_name = get_en_name(target_id)

        has_reason_legacy = 'reasonLegacy' in j
        en_text = find_en_match(owner_id, target_id)

        if has_reason_legacy:
            if en_text:
                updates.append({
                    'ownerId': owner_id,
                    'targetId': target_id,
                    'ownerEn': owner_en_name,
                    'targetEn': target_en_name,
                    'oldEn': en_text,
                    'newCn': j['reason'],
                    'oldCn': j['reasonLegacy']
                })
            else:
                creates.append({
                    'ownerId': owner_id,
                    'targetId': target_id,
                    'ownerEn': owner_en_name,
                    'targetEn': target_en_name,
                    'newCn': j['reason']
                })
        elif not en_text:
            creates.append({
                'ownerId': owner_id,
                'targetId': target_id,
                'ownerEn': owner_en_name,
                'targetEn': target_en_name,
                'newCn': j['reason']
            })

print('UPDATE count:', len(updates))
print('CREATE count:', len(creates))
print()

print('=== UPDATES ===')
for u in updates:
    print(f"  {u['ownerId']} -> {u['targetId']} ({u['ownerEn']} -> {u['targetEn']})")
    print(f"    OLD EN: {u['oldEn'][:150]}")
    print(f"    NEW CN: {u['newCn'][:150]}")
    print(f"    OLD CN: {u['oldCn'][:150]}")
    print()

print('=== CREATES ===')
for c in creates:
    print(f"  {c['ownerId']} -> {c['targetId']} ({c['ownerEn']} -> {c['targetEn']})")
    print(f"    NEW CN: {c['newCn'][:150]}")
    print()

result = {'update': updates, 'create': creates}
with open(r'c:\Learning\sample\synchronous-github\botc-script-tool\botc-script-generator-modern\jinx_diff_result.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f'Total updates: {len(updates)}, Total creates: {len(creates)}')
print('Saved to jinx_diff_result.json')

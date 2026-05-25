export const cn = {
  'secondPage.addComponent': '添加组件',
  'secondPage.title': '第二页标题',
  'secondPage.playerTable1': '玩家配置表（标准）',
  'secondPage.playerTable2': '玩家配置表（6-9人）',
  'playerTable.playerCount': '玩家数量',
  'playerTable.townsfolk': '镇民',
  'playerTable.outsider': '外来者',
  'playerTable.minion': '爪牙',
  'playerTable.demon': '恶魔',
} as const;

export const en = {
  'secondPage.addComponent': 'Add Component',
  'secondPage.title': 'Second Page Title',
  'secondPage.playerTable1': 'Player Configuration (Standard)',
  'secondPage.playerTable2': 'Player Configuration (6-9 Players)',
  'playerTable.playerCount': 'Player Count',
  'playerTable.townsfolk': 'Townsfolk',
  'playerTable.outsider': 'Outsider',
  'playerTable.minion': 'Minion',
  'playerTable.demon': 'Demon',
} as const;

export const es: Partial<Record<keyof typeof cn, string>> = {
  'secondPage.addComponent': 'Añadir componente',
  'secondPage.title': 'Título de la segunda página',
  'secondPage.playerTable1': 'Tabla de configuración de jugadores (estándar)',
  'secondPage.playerTable2': 'Tabla de configuración de jugadores (6-9 jugadores)',
  'playerTable.playerCount': 'Jugadores',
  'playerTable.townsfolk': 'Aldeanos',
  'playerTable.outsider': 'Forasteros',
  'playerTable.minion': 'Esbirros',
  'playerTable.demon': 'Demonios',
};

import {
  searchCharacters,
  getCharacterDetail,
  addCharacter,
  removeCharacter,
  replaceCharacter,
  updateCharacter,
  reorderCharacters,
} from './characterTools';

import {
  getConfig,
  setConfig,
  getUiConfig,
  setUiConfig,
  setTheme,
  resetUiConfig,
  searchKnowledgeTool,
  getKnowledgeTopicTool,
} from './configTools';

import {
  getScriptSummary,
  getScriptJson,
  updateTitleInfo,
  addSpecialRule,
  editSpecialRule,
  removeSpecialRule,
  manageSecondPage,
  getNightOrder,
  updateNightOrder,
  importJson,
  exportJson,
} from './scriptTools';

import {
  getJinxInfo,
  addCustomJinx,
  removeCustomJinx,
  updateJinx,
  listJinx,
} from './jinxTools';

export const ALL_TOOLS = {
  // A: Character CRUD
  search_characters: searchCharacters,
  get_character_detail: getCharacterDetail,
  add_character: addCharacter,
  remove_character: removeCharacter,
  replace_character: replaceCharacter,
  update_character: updateCharacter,
  // A2: Script metadata
  get_script_summary: getScriptSummary,
  get_script_json: getScriptJson,
  update_title_info: updateTitleInfo,
  // B: Config & UI
  get_config: getConfig,
  set_config: setConfig,
  get_ui_config: getUiConfig,
  set_ui_config: setUiConfig,
  set_theme: setTheme,
  reset_ui_config: resetUiConfig,
  // C: Knowledge Base
  search_knowledge: searchKnowledgeTool,
  get_knowledge_topic: getKnowledgeTopicTool,
  // D: Night Order
  get_night_order: getNightOrder,
  update_night_order: updateNightOrder,
  // E: Jinx Management
  get_jinx_info: getJinxInfo,
  list_jinx: listJinx,
  add_custom_jinx: addCustomJinx,
  remove_custom_jinx: removeCustomJinx,
  update_jinx: updateJinx,
  // F: Special Rules
  add_special_rule: addSpecialRule,
  edit_special_rule: editSpecialRule,
  remove_special_rule: removeSpecialRule,
  // G: Second Page & Reorder
  manage_second_page: manageSecondPage,
  reorder_characters: reorderCharacters,
  // H: Import/Export
  import_json: importJson,
  export_json: exportJson,
};

export type AgentToolName = keyof typeof ALL_TOOLS;

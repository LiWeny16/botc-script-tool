export const DEFAULT_SPECIAL_RULE_TITLE_SIZE = '1.5rem';
export const DEFAULT_SPECIAL_RULE_CONTENT_SIZE = '1.15rem';
export const SPECIAL_RULE_TYPOGRAPHY_VERSION = 3;

interface SpecialRuleTypography {
  specialRuleTitleFontSize: string;
  specialRuleContentFontSize: string;
  specialRuleTypographyVersion: number;
}

export function upgradeSpecialRuleTypography(config: Partial<SpecialRuleTypography>): SpecialRuleTypography {
  const version = config.specialRuleTypographyVersion || 0;
  const usesOldTitleDefault = (version === 0 && config.specialRuleTitleFontSize === '1rem')
    || (version === 1 && config.specialRuleTitleFontSize === '1.25rem');
  const usesOldContentDefault = (version === 0 && config.specialRuleContentFontSize === '0.85rem')
    || (version > 0 && version < SPECIAL_RULE_TYPOGRAPHY_VERSION && config.specialRuleContentFontSize === '1.05rem');
  return {
    specialRuleTitleFontSize: usesOldTitleDefault ? DEFAULT_SPECIAL_RULE_TITLE_SIZE
      : config.specialRuleTitleFontSize ?? DEFAULT_SPECIAL_RULE_TITLE_SIZE,
    specialRuleContentFontSize: usesOldContentDefault ? DEFAULT_SPECIAL_RULE_CONTENT_SIZE
      : config.specialRuleContentFontSize ?? DEFAULT_SPECIAL_RULE_CONTENT_SIZE,
    specialRuleTypographyVersion: SPECIAL_RULE_TYPOGRAPHY_VERSION,
  };
}

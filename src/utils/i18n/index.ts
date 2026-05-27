import type { Language } from '../languages';

import { cn as cnCommon, en as enCommon, es as esCommon } from './common';
import { cn as cnApp, en as enApp, es as esApp } from './app';
import { cn as cnInput, en as enInput, es as esInput } from './input';
import { cn as cnScript, en as enScript, es as esScript } from './script';
import { cn as cnRepo, en as enRepo, es as esRepo } from './repo';
import { cn as cnAbout, en as enAbout, es as esAbout } from './about';
import { cn as cnCharacter, en as enCharacter, es as esCharacter } from './character';
import { cn as cnUi, en as enUi, es as esUi } from './ui';
import { cn as cnSecondPage, en as enSecondPage, es as esSecondPage } from './secondPage';
import { cn as cnImageGen, en as enImageGen, es as esImageGen } from './imageGen';
import { cn as cnCloud, en as enCloud, es as esCloud } from './cloud';

const cn = {
  ...cnCommon,
  ...cnApp,
  ...cnInput,
  ...cnScript,
  ...cnRepo,
  ...cnAbout,
  ...cnCharacter,
  ...cnUi,
  ...cnSecondPage,
  ...cnImageGen,
  ...cnCloud,
} as const;

const en = {
  ...enCommon,
  ...enApp,
  ...enInput,
  ...enScript,
  ...enRepo,
  ...enAbout,
  ...enCharacter,
  ...enUi,
  ...enSecondPage,
  ...enImageGen,
  ...enCloud,
} as const;

const es = {
  ...esCommon,
  ...esApp,
  ...esInput,
  ...esScript,
  ...esRepo,
  ...esAbout,
  ...esCharacter,
  ...esUi,
  ...esSecondPage,
  ...esImageGen,
  ...esCloud,
} as const;

export type TranslationKey = keyof typeof cn;

export const translations: Record<Language, Partial<Record<TranslationKey, string>>> = {
  cn,
  en,
  es,
};

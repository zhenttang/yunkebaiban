import { notify } from '@yunke/component';
import { DebugLogger } from '@yunke/debug';
import {
  getOrCreateI18n,
  i18nCompletenesses,
  type Language,
  SUPPORTED_LANGUAGES,
} from '@yunke/i18n';
import { effect, Entity, fromPromise, LiveData } from '@toeverything/infra';
import { catchError, EMPTY, exhaustMap } from 'rxjs';

import type { GlobalCache } from '../../storage';

export type LanguageInfo = {
  key: Language;
  name: string;
  originalName: string;
  completeness: number;
};

const logger = new DebugLogger('i18n');

function mapLanguageInfo(language: Language = 'en'): LanguageInfo {
  const languageInfo = SUPPORTED_LANGUAGES[language];

  return {
    key: language,
    name: languageInfo.name,
    originalName: languageInfo.originalName,
    completeness: i18nCompletenesses[language],
  };
}

export class I18n extends Entity {
  private readonly i18n = getOrCreateI18n();

  get i18next() {
    return this.i18n;
  }

  readonly currentLanguageKey$ = LiveData.from(
    this.cache.watch<Language>('i18n_lng'),
    undefined
  );

  readonly currentLanguage$ = this.currentLanguageKey$
    .distinctUntilChanged()
    .map(mapLanguageInfo);

  readonly languageList: Array<LanguageInfo> =
    // @ts-expect-error same key indexing
    Object.keys(SUPPORTED_LANGUAGES).map(mapLanguageInfo);

  constructor(private readonly cache: GlobalCache) {
    super();
    this.i18n.on('languageChanged', (language: Language) => {
      document.documentElement.lang = language;
      this.cache.set('i18n_lng', language);
    });
  }

  init() {
    this.changeLanguage(this.currentLanguageKey$.value ?? 'en');
  }

  changeLanguage = effect(
    exhaustMap((language: string) =>
      fromPromise(() => this.i18n.changeLanguage(language)).pipe(
        catchError(error => {
          notify({
            theme: 'error',
            title: '更改语言失败',
            message: 'Error occurs when loading language files',
          });

          logger.error('更改语言失败', error);

          return EMPTY;
        })
      )
    )
  );
}

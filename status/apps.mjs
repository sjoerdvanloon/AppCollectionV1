// Apps and building blocks shown on /status and in the weekly report.
// hosting: 'vercel' (live commit from /version.json, else the GitHub Production deployment),
//          'sites' (ChatGPT Sites: only /version.json can tell what is live).
export const OWNER = 'sjoerdvanloon';

export const apps = [
  { name: 'Sjoerds Projecten', repo: 'AppCollectionV1', url: 'https://appcollectionv1.vercel.app', hosting: 'vercel' },
  { name: 'MiniPaint', repo: 'MiniPaintV1', url: 'https://minipaint-workshop.sjoerdvanloon83.chatgpt.site', hosting: 'sites' },
  { name: 'Spellenkast', repo: 'sjoerds-spellenkast', url: 'https://sjoerds-spellenkast.sjoerdvanloon83.chatgpt.site', hosting: 'sites' },
  { name: 'ArtAtlas', repo: 'ArtAtlasV1', url: 'https://sjoerds-kunstatlas.sjoerdvanloon83.chatgpt.site', hosting: 'sites' },
  { name: 'Arkham Horror 1987', repo: 'ArkhamHorror1987', url: 'https://arkhamhorror1987.vercel.app', hosting: 'vercel' },
  { name: 'Arkham Horror 2005', repo: 'ArkhamHorror2005', url: 'https://arkhamhorror2005.vercel.app', hosting: 'vercel' },
  { name: 'Lost Cities Roll & Write', repo: 'lost-cities-roll-write', url: 'https://lost-cities-roll-write.vercel.app', hosting: 'vercel' },
  { name: 'Expeditions Automa', repo: 'AutomaV1', url: 'https://automav1.vercel.app', hosting: 'vercel' },
  { name: 'Eldritch Horror', repo: 'eldritch-horror-thematic-builder', url: 'https://eldritch-horror-thematic-builder.vercel.app', hosting: 'vercel' },
  { name: 'AI Model Explorer', repo: 'ai-model-explorer', url: 'https://ai-model-explorer-ten.vercel.app', hosting: 'vercel' },
  { name: 'ErrorLog', repo: 'ErrorLogV1', url: 'https://errorlogv1-six.vercel.app', hosting: 'vercel' },
  { name: 'FeedbackKit', repo: 'FeedbackKitV1', url: 'https://feedbackkit.sjoerdvanloon83.chatgpt.site', hosting: 'sites' }
];

// Libraries are released as git tags; "unreleased" means commits on main since the newest tag.
export const libraries = [
  { name: 'HealthKit', repo: 'HealthKitV1' },
  { name: 'SjoerdUi', repo: 'SjoerdUiV1' },
  { name: 'SignInKit', repo: 'SignInKitV1' },
  { name: 'EventLog', repo: 'EventLogV1' },
  { name: 'StorageKit', repo: 'StorageKitV1' },
  { name: 'MediaKit', repo: 'MediaKitV1' },
  { name: 'SharingIsCaring', repo: 'SharingIsCaringV1' },
  { name: 'PerfDash', repo: 'PerfDashV1' },
  { name: 'AppReg', repo: 'AppRegV1' },
  { name: 'ArkhamHorrorCore', repo: 'ArkhamHorrorCore' },
  { name: 'Gaming Together Matters', repo: 'GamingTogetherMattersV1' }
];

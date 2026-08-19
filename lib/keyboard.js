import { t } from 'lib/i18n'

export const MAIN_MENU = [
  [{ text: 'ثبت آگهي جديد', callback_data: 'new_ad' }],
  [{ text: 'نمايش آگهي ها', callback_data: 'list_ads' }],
  [{ text: 'نرخ ارز و طلا', callback_data: 'rates' }],
  [{ text: 'کسب و کارهاي محلي', callback_data: 'businesses' }],
  [{ text: 'رويدادهاي محلي', callback_data: 'events' }],
  [{ text: 'راهنما', callback_data: 'help' }],
  [{ text: 'زبان: فارسي / کوردي', callback_data: 'toggle_lang' }],
]

export const AD_TYPES = [
  [
    { text: 'فروش', callback_data: 'type_sell' },
    { text: 'معاوضه', callback_data: 'type_swap' },
    { text: 'رايگان', callback_data: 'type_free' },
  ],
]

export const AD_CATEGORIES = [
  [
    { text: 'خودرو', callback_data: 'cat_car' },
    { text: 'ملک', callback_data: 'cat_house' },
  ],
  [
    { text: 'کالا و لوازم', callback_data: 'cat_goods' },
    { text: 'غذا', callback_data: 'cat_food' },
  ],
  [
    { text: '🍲 غذای خانگی', callback_data: 'cat_homefood' },
    { text: 'لباس و پوشاک', callback_data: 'cat_clothes' },
  ],
  [
    { text: 'لوازم خانگي', callback_data: 'cat_home' },
    { text: 'دست دوم', callback_data: 'cat_used' },
  ],
  [
    { text: 'موبايل و کامپيوتر', callback_data: 'cat_tech' },
    { text: 'کشاورزي و دام', callback_data: 'cat_agri' },
  ],
  [
    { text: 'ساير اجناس', callback_data: 'cat_other' },
    { text: 'خدمات', callback_data: 'cat_services' },
  ],
  [
    { text: 'گمشده و پیداشده', callback_data: 'cat_lostfound' },
    { text: 'نوبت خالی', callback_data: 'cat_slot' },
  ],
  [{ text: 'شغل', callback_data: 'cat_job' }],
  [{ text: 'بازگشت', callback_data: 'back_main' }],
]

export const TYPE_NAMES = {
  type_sell: 'فروش',
  type_swap: 'معاوضه',
  type_free: 'رايگان',
}

export const CATEGORY_NAMES = {
  cat_car: 'خودرو',
  cat_house: 'ملک',
  cat_goods: 'کالا و لوازم',
  cat_food: 'غذا',
  cat_homefood: 'غذای خانگی',
  cat_clothes: 'لباس و پوشاک',
  cat_home: 'لوازم خانگي',
  cat_used: 'دست دوم',
  cat_tech: 'موبايل و کامپيوتر',
  cat_agri: 'کشاورزي و دام',
  cat_other: 'ساير اجناس',
  cat_services: 'خدمات',
  cat_lostfound: 'گمشده و پیداشده',
  cat_slot: 'نوبت خالی',
  cat_job: 'شغل',
}

export function mainMenuKeyboard(lang = 'fa') {
  const items = [
    [{ text: t(lang, 'new_ad'), callback_data: 'new_ad' }],
    [{ text: t(lang, 'swap_food'), callback_data: 'swap_food' }],
    [{ text: t(lang, 'apply_job'), callback_data: 'apply_job_menu' }],
    [{ text: t(lang, 'apply_rest_food'), callback_data: 'apply_rest_food_menu' }],
    [{ text: t(lang, 'apply_workforce'), callback_data: 'apply_workforce_menu' }],
    [{ text: t(lang, 'lost_found'), callback_data: 'lost_found_menu' }],
    [{ text: t(lang, 'slot'), callback_data: 'slot_menu' }],
    [{ text: '🍲 دیدن غذاهای معاوضه', callback_data: 'list_homefood' }],
    [{ text: t(lang, 'list_ads'), callback_data: 'list_ads' }],
    [{ text: t(lang, 'rates'), callback_data: 'rates' }],
    [{ text: t(lang, 'news'), callback_data: 'news' }],
    [{ text: t(lang, 'news_world'), callback_data: 'news_world' }],
    [{ text: t(lang, 'businesses'), callback_data: 'businesses' }],
    [{ text: t(lang, 'register_biz'), callback_data: 'register_biz' }],
    [{ text: t(lang, 'events'), callback_data: 'events' }],
    [{ text: t(lang, 'help'), callback_data: 'help' }],
    [{ text: t(lang, 'lang_btn'), callback_data: 'toggle_lang' }],
  ]
  return { inline_keyboard: items }
}

export function categoryKeyboard() {
  return {
    inline_keyboard: [
      ...AD_CATEGORIES,
      [{ text: '🏠 منوی اصلی', callback_data: 'back_main' }, { text: '🔙 بازگشت', callback_data: 'back_main' }],
    ],
  }
}

export function typeKeyboard() {
  return {
    inline_keyboard: [
      ...AD_TYPES,
      [{ text: '🏠 منوی اصلی', callback_data: 'back_main' }, { text: '🔙 بازگشت', callback_data: 'back_main' }],
    ],
  }
}

export function backKeyboard() {
  return { inline_keyboard: [[{ text: 'بازگشت', callback_data: 'back_main' }]] }
}

export function navKeyboard(backCallback = 'back_main') {
  return {
    inline_keyboard: [
      [
        { text: '🏠 منوی اصلی', callback_data: 'back_main' },
        { text: '🔙 بازگشت', callback_data: backCallback },
      ],
    ],
  }
}
import { api } from 'lib/botapi'
import { mainMenuKeyboard, categoryKeyboard, typeKeyboard, backKeyboard, CATEGORY_NAMES, TYPE_NAMES } from 'lib/keyboard'
import { upsertUser, isAdmin, getSession, setSession, clearSession, getLang, setLang } from 'lib/session'
import {
  listAdsByCategory,
  listBusinesses,
  listMyBusinesses,
  formatAd,
  formatContact,
  contactKeyboard,
  formatBusiness,
  formatBusinessFull,
  getRates,
  getAdById,
  getBusinessById,
  hasPaidAccess,
  createPayment,
  getPaymentById,
  updateRate,
  listEvents,
  formatEvent,
} from 'lib/store'
import { validateRefCode } from 'lib/payment'
import { REVEAL_PRICE, CARD_NUMBER, CARD_HOLDER, CARD_BANK } from 'lib/config'
import { getRatesForUser, fetchOnlineRates, formatPrice } from 'lib/rates'
import { listNews } from 'lib/news'
import { getLangName } from 'lib/i18n'
import { banner, DIV, DIV_SOFT, RATE_ICONS, footer } from 'lib/style'

function payText(purpose) {
  return (
    `${banner('پرداخت امن', '💳')}\n\n` +
    `🔐 <b>${purpose}</b>\n\n` +
    `مبلغ: <b>${REVEAL_PRICE.toLocaleString('fa-IR')} تومان</b>\n` +
    `${DIV}\n` +
    `🏦 بانک: <b>${CARD_BANK}</b>\n` +
    `💳 شماره کارت: <code>${CARD_NUMBER}</code>\n` +
    `👤 به نام: <b>${CARD_HOLDER}</b>\n` +
    `${DIV}\n\n` +
    'بعد از پرداخت، <b>کد پيگيري ۱۰ رقمي</b> (که با ۵۴ شروع مي‌شود) را همين‌جا ارسال کنيد.\n\n' +
    `🔒 پرداخت شما تاييد خودکار مي‌شود`
  )
}

function payKeyboard() {
  return { inline_keyboard: [[{ text: 'بازگشت', callback_data: 'cancel_pay' }]] }
}

async function sendCategoryAds(tgId, category) {
  const ads = await listAdsByCategory(category)
  if (ads.length === 0) {
    await api.sendMessage({ chat_id: tgId, text: 'آگهي اي در اين دسته ثبت نشده است.' })
    return
  }
  for (const ad of ads) {
    const isOwner = ad.user_id === tgId
    const isFreeContact = ad.type === 'گمشده' || ad.type === 'پیداشده'
    const canSee = isOwner || isFreeContact || (await hasPaidAccess(tgId, ad.id))
    const buttonText = canSee
      ? '📞 نمايش شماره تماس'
      : `نمايش شماره تماس (${REVEAL_PRICE.toLocaleString('fa-IR')} تومان)`
    await api.sendMessage({
      chat_id: tgId,
      text: formatAd(ad),
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: buttonText, callback_data: `reveal_${ad.id}` }]],
      },
    })
  }
}

export default async function (update) {
  const cq = update.callback_query
  if (!cq) return

  const tgId = cq.from.id
  const name = cq.from.first_name || 'کاربر'
  const data = cq.data

  await upsertUser(tgId, name)
  await api.answerCallbackQuery({ callback_query_id: cq.id })

  if (data === 'toggle_lang') {
    const cur = await getLang(tgId)
    const next = cur === 'fa' ? 'ku' : 'fa'
    await setLang(tgId, next)
    await api.sendMessage({
      chat_id: tgId,
      text: `زبان: ${getLangName(next)} / زمان: ${getLangName(next)}\nمنوي اصلي:`,
      reply_markup: mainMenuKeyboard(next),
    })
    return
  }

    if (data === 'back_main') {
    await clearSession(tgId)
    const lang = await getLang(tgId)
    await api.sendMessage({
      chat_id: tgId,
      text: `${banner('منوي اصلي', '💎')}\n\nلطفا انتخاب کنيد:`,
      reply_markup: mainMenuKeyboard(lang),
      parse_mode: 'HTML',
    })
    return
  }

  if (data === 'cancel_pay') {
    await clearSession(tgId)
    await api.sendMessage({
      chat_id: tgId,
      text: 'پرداخت لغو شد.',
      reply_markup: backKeyboard(),
    })
    return
  }

  if (data === 'new_ad') {
    await setSession(tgId, 'ad_type', {})
    await api.sendMessage({
      chat_id: tgId,
      text: 'نوع معامله را انتخاب کنيد:',
      reply_markup: typeKeyboard(),
    })
    return
  }

  if (data === 'swap_food') {
    await setSession(tgId, 'ad_description', {
      type: 'معاوضه',
      category: 'غذای خانگی',
      title: 'معاوضه رایگان غذای همسایه',
      price: 'رایگان',
    })
    await api.sendMessage({
      chat_id: tgId,
      text: '🍲 <b>معاوضه رایگان غذای همسایه</b>\n\n' +
        'خود غذا کاملاً <b>رایگان</b> است؛ فقط کمیسیون سایت پرداخت می‌شود.\n' +
        'برای مشاهده شماره تماس طرف مقابل: ۱۵,۰۰۰ تومان\n\n' +
        'نام غذا و توضیحات را بنویسید\n' +
        '(مثلا: آش رشته، قورمه سبزی، کلوچه محلی...)',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '🍲 دیدن غذاهای معاوضه', callback_data: 'list_homefood' }]],
      },
    })
    return
  }

  if (data === 'list_homefood') {
    await sendCategoryAds(tgId, 'غذای خانگی')
    return
  }

  if (data === 'apply_job_menu') {
    await api.sendMessage({
      chat_id: tgId,
      text: '💼 <b>درخواست استخدام</b>\n\nانتخاب کنيد:',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ ثبت درخواست استخدام', callback_data: 'apply_job' }],
          [{ text: '📋 دیدن درخواست‌های دیگران', callback_data: 'list_job_requests' }],
        ],
      },
    })
    return
  }

  if (data === 'apply_job') {
    await setSession(tgId, 'job_field', { type: 'درخواست', category: 'شغل' })
    await api.sendMessage({
      chat_id: tgId,
      text: '💼 <b>ثبت درخواست استخدام</b>\n\n' +
        'چه کاری می‌توانید انجام دهید؟\n' +
        '(مثلا: راننده وانت، نقاش ساختمان، نظافت‌چی، آشپز...)',
      parse_mode: 'HTML',
    })
    return
  }

  if (data === 'list_job_requests') {
    await sendCategoryAds(tgId, 'شغل')
    return
  }

  if (data === 'apply_rest_food_menu') {
    await api.sendMessage({
      chat_id: tgId,
      text: '🍽 <b>غذای اضافه رستوران</b>\n\nانتخاب کنيد:',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ ثبت غذای اضافه رستوران', callback_data: 'apply_rest_food' }],
          [{ text: '📋 دیدن غذاهای رستوران‌ها', callback_data: 'list_rest_food' }],
        ],
      },
    })
    return
  }

  if (data === 'apply_rest_food') {
    await setSession(tgId, 'rest_field', { type: 'فروش', category: 'غذا' })
    await api.sendMessage({
      chat_id: tgId,
      text: '🍽 <b>ثبت غذای اضافه رستوران</b>\n\n' +
        'نام رستوران و غذایی که اضافه دارد را بنویسید\n' +
        '(مثلا: رستوران سعادت — قورمه سبزی)',
      parse_mode: 'HTML',
    })
    return
  }

  if (data === 'list_rest_food') {
    await sendCategoryAds(tgId, 'غذا')
    return
  }

  if (data === 'apply_workforce_menu') {
    await api.sendMessage({
      chat_id: tgId,
      text: '👷 <b>درخواست نیروی کار</b>\n\nانتخاب کنيد:',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ ثبت آگهی نیاز به نیرو', callback_data: 'apply_workforce' }],
          [{ text: '📋 دیدن آگهی‌های نیروی کار', callback_data: 'list_workforce' }],
        ],
      },
    })
    return
  }

  if (data === 'apply_workforce') {
    await setSession(tgId, 'workforce_field', { type: 'درخواست نیرو', category: 'شغل' })
    await api.sendMessage({
      chat_id: tgId,
      text: '👷 <b>ثبت آگهی نیاز به نیرو</b>\n\n' +
        'چه نیرویی لازم دارید؟\n' +
        '(مثلا: راننده وانت، نقاش ساختمان، آشپز، نظافت‌چی...)',
      parse_mode: 'HTML',
    })
    return
  }

  if (data === 'list_workforce') {
    await sendCategoryAds(tgId, 'شغل')
    return
  }

  if (data === 'lost_found_menu') {
    await api.sendMessage({
      chat_id: tgId,
      text: '🔍 <b>گمشده و پیداشده</b>\n\nانتخاب کنيد:',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔴 ثبت آگهی گمشده', callback_data: 'lost_item' }],
          [{ text: '🟢 ثبت آگهی پیداشده', callback_data: 'found_item' }],
          [{ text: '📋 دیدن آگهی‌ها', callback_data: 'list_lost_found' }],
        ],
      },
    })
    return
  }

  if (data === 'lost_item') {
    await setSession(tgId, 'lost_field', { type: 'گمشده', category: 'گمشده و پیداشده' })
    await api.sendMessage({
      chat_id: tgId,
      text: '🔴 <b>ثبت آگهی گمشده</b>\n\n' +
        'چه چیزی گم کرده‌اید؟\n' +
        '(مثلا: گوشی سامسونگ، کیف پول، گربه...)',
      parse_mode: 'HTML',
    })
    return
  }

  if (data === 'found_item') {
    await setSession(tgId, 'found_field', { type: 'پیداشده', category: 'گمشده و پیداشده' })
    await api.sendMessage({
      chat_id: tgId,
      text: '🟢 <b>ثبت آگهی پیداشده</b>\n\n' +
        'چه چیزی پیدا کرده‌اید؟\n' +
        '(مثلا: گوشی سامسونگ، پول نقد، دسته کلید...)',
      parse_mode: 'HTML',
    })
    return
  }

  if (data === 'list_lost_found') {
    await sendCategoryAds(tgId, 'گمشده و پیداشده')
    return
  }

  if (data === 'slot_menu') {
    await api.sendMessage({
      chat_id: tgId,
      text: '🗓 <b>نوبت خالی</b>\n\n' +
        'سالن‌های ورزشی، چمن مصنوعی، استخرها، آرایشگاه‌ها، مطب پزشکان و...\n\nانتخاب کنيد:',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ ثبت نوبت خالی', callback_data: 'register_slot' }],
          [{ text: '📋 دیدن نوبت‌های خالی', callback_data: 'list_slots' }],
        ],
      },
    })
    return
  }

  if (data === 'register_slot') {
    await setSession(tgId, 'slot_field', { type: 'نوبت', category: 'نوبت خالی' })
    await api.sendMessage({
      chat_id: tgId,
      text: '🗓 <b>ثبت نوبت خالی</b>\n\n' +
        'کدام مکان یا خدمت؟\n' +
        '(مثلا: سالن ورزشی آرش، چمن مصنوعی، استخر، آرایشگاه، مطب دکتر...)',
      parse_mode: 'HTML',
    })
    return
  }

  if (data === 'list_slots') {
    await sendCategoryAds(tgId, 'نوبت خالی')
    return
  }

  if (data.startsWith('type_')) {
    const session = await getSession(tgId)
    if (!session || session.state !== 'ad_type') return
    await setSession(tgId, 'ad_category', { type: TYPE_NAMES[data] })
    await api.sendMessage({
      chat_id: tgId,
      text: 'دسته آگهي را انتخاب کنيد:',
      reply_markup: categoryKeyboard(),
    })
    return
  }

  if (data.startsWith('cat_')) {
    const session = await getSession(tgId)
    if (!session) return

    if (session.state === 'ad_category') {
      await setSession(tgId, 'ad_title', { ...session.data, category: CATEGORY_NAMES[data] })
      await api.sendMessage({ chat_id: tgId, text: 'عنوان آگهي را وارد کنيد:' })
      return
    }

    if (session.state === 'list_category') {
      await sendCategoryAds(tgId, CATEGORY_NAMES[data])
      return
    }
  }

  if (data === 'list_ads') {
    await setSession(tgId, 'list_category', {})
    await api.sendMessage({
      chat_id: tgId,
      text: 'دسته آگهي ها را انتخاب کنيد:',
      reply_markup: categoryKeyboard(),
    })
    return
  }

  if (data === 'rates') {
    const { rates, source } = await getRatesForUser()
    if (rates.length === 0) {
      await api.sendMessage({
        chat_id: tgId,
        text: 'هنوز نرخي ثبت نشده است.',
        reply_markup: {
          inline_keyboard: [[{ text: 'به روز رساني', callback_data: 'refresh_rates' }]],
        },
      })
      return
    }
    const lines = rates.map((r) => `${RATE_ICONS[r.code] || '💰'} <b>${r.name}:</b> ${formatPrice(r.value)} ${r.unit || 'تومان'}`)
    const note =
      source === 'online'
        ? '🟢 <b>به روز رساني خودکار</b>'
        : source === 'cached'
          ? '🟡 آخرين به روز رساني'
          : '⚪️ منبع آنلاين در دسترس نبود'
    await api.sendMessage({
      chat_id: tgId,
      text:
        `${banner('نرخ ارز و طلا', '💹')}\n\n` +
        `${lines.join('\n')}\n\n${note}\n\n` +
        `🔔 براي هشدار نرخ: <code>/alert usd 180000</code>`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔄 به روز رساني', callback_data: 'refresh_rates' }],
          [{ text: 'بازگشت', callback_data: 'back_main' }],
        ],
      },
    })
    return
  }

  if (data === 'refresh_rates') {
    const online = await fetchOnlineRates()
    if (online && online.length) {
      for (const r of online) await updateRate(r.code, r.name, r.value, r.unit)
      const rates = await getRates()
      const lines = rates.map((r) => `${RATE_ICONS[r.code] || '💰'} <b>${r.name}:</b> ${formatPrice(r.value)} ${r.unit || 'تومان'}`)
      await api.sendMessage({
        chat_id: tgId,
        text: `${banner('نرخ به روز شد', '✅')}\n\n${lines.join('\n')}`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 به روز رساني دوباره', callback_data: 'refresh_rates' }],
            [{ text: 'بازگشت', callback_data: 'back_main' }],
          ],
        },
      })
    } else {
      const rates = await getRates()
      const lines = rates.map((r) => `${RATE_ICONS[r.code] || '💰'} <b>${r.name}:</b> ${formatPrice(r.value)} ${r.unit || 'تومان'}`)
      await api.sendMessage({
        chat_id: tgId,
        text: `⚪️ منبع آنلاين در دسترس نبود. نرخ قبلي:\n\n${lines.join('\n')}`,
        parse_mode: 'HTML',
      })
    }
    return
  }

  if (data === 'businesses') {
    const businesses = await listBusinesses()
    if (businesses.length === 0) {
      await api.sendMessage({ chat_id: tgId, text: 'هنوز کسب و کاري ثبت نشده است.' })
      return
    }
    for (const b of businesses) {
      const isOwner = b.owner_id === tgId || (await isAdmin(tgId))
      const canSee = isOwner || (await hasPaidAccess(tgId, b.id, 'biz'))
      const row1 = [{ text: '⭐ امتياز بده', callback_data: `rate_biz_${b.id}` }]
      const row2 = canSee
        ? [{ text: '📞 تماس و تلگرام', callback_data: `reveal_biz_${b.id}` }]
        : [{ text: `🔓 نمايش شماره تماس (${REVEAL_PRICE.toLocaleString('fa-IR')} تومان)`, callback_data: `reveal_biz_${b.id}` }]
      const row3 = b.is_featured ? [] : [{ text: `👑 ويژه شدن (${REVEAL_PRICE.toLocaleString('fa-IR')} تومان)`, callback_data: `promote_biz_${b.id}` }]
      const rows = [row1, row2]
      if (row3.length) rows.push(row3)
      rows.push([{ text: 'بازگشت', callback_data: 'back_main' }])
      await api.sendMessage({
        chat_id: tgId,
        text: `${banner('کسب و کار', '🏪')}\n\n${canSee ? formatBusinessFull(b) : formatBusiness(b)}`,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: rows },
      })
    }
    return
  }

  if (data === 'register_biz') {
    const mine = await listMyBusinesses(tgId)
    if (mine.length) {
      const lines = mine.map((b) => {
        const status = b.status === 'pending' ? 'در انتظار تاييد' : b.status === 'rejected' ? 'رد شده' : 'فعال'
        return `- ${b.name} (${status})`
      })
      await api.sendMessage({ chat_id: tgId, text: `کسب و کارهاي شما:\n${lines.join('\n')}` })
      return
    }
    await setSession(tgId, 'reg_name', {})
    await api.sendMessage({ chat_id: tgId, text: 'نام کسب و کار را وارد کنيد:' })
    return
  }

  if (data === 'events') {
    const events = await listEvents()
    if (events.length === 0) {
      await api.sendMessage({ chat_id: tgId, text: 'هنوز رويدادي ثبت نشده است.' })
      return
    }
    const text = events.map((e) => formatEvent(e)).join(`\n\n${DIV}\n\n`)
      await api.sendMessage({
        chat_id: tgId,
        text: `${banner('رويدادهاي محلي', '🎊')}\n\n${text}\n\n${footer()}`,
        parse_mode: 'HTML',
        reply_markup: backKeyboard(),
      })
      return
    }

  if (data === 'news' || data === 'news_world') {
    const isWorld = data === 'news_world'
    const news = await listNews(isWorld ? 'world' : 'city', 10)
    if (news.length === 0) {
      await api.sendMessage({
        chat_id: tgId,
        text: 'هنوز خبري ثبت نشده است. چند لحظه ديگر دوباره امتحان کنيد.',
      })
      return
    }
    const lines = news.map((n, i) => {
      const firstLine = n.text.split('\n')[0] || 'خبر'
      const title = firstLine.length > 70 ? firstLine.slice(0, 70) + '...' : firstLine
      const body = n.text.split('\n').slice(1).join('\n').trim()
      const bodyShort = body.length > 150 ? body.slice(0, 150) + '...' : body
      return (
        `${i + 1}. 📰 <b>${title.replace(/[<>&]/g, '')}</b>\n` +
        (bodyShort ? `${bodyShort.replace(/[<>&]/g, '')}\n` : '') +
        `🔗 <a href="${n.url}">مشاهده در کانال</a>`
      )
    })
    await api.sendMessage({
      chat_id: tgId,
      text: `${banner(isWorld ? 'اخبار ايران و جهان' : 'اخبار شهر', isWorld ? '🌍' : '📰')}\n\n${lines.join(`\n\n${DIV_SOFT}\n\n`)}\n\n${footer()}`,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: backKeyboard(),
    })
    return
  }

  if (data.startsWith('rate_biz_')) {
    const bizId = Number(data.slice(9))
    const b = await getBusinessById(bizId)
    if (!b) {
      await api.sendMessage({ chat_id: tgId, text: 'کسب و کار پيدا نشد.' })
      return
    }
    const stars = [1, 2, 3, 4, 5].map((n) => ({ text: '⭐'.repeat(n), callback_data: `rate_star_${bizId}_${n}` }))
    await api.sendMessage({
      chat_id: tgId,
      text: `به «${b.name}» چند ستاره مي‌دهيد؟`,
      reply_markup: {
        inline_keyboard: [stars, [{ text: 'بازگشت', callback_data: 'businesses' }]],
      },
    })
    return
  }

  if (data.startsWith('rate_star_')) {
    const parts = data.split('_')
    const bizId = Number(parts[2])
    const stars = Number(parts[3])
    const b = await getBusinessById(bizId)
    if (!b) {
      await api.sendMessage({ chat_id: tgId, text: 'کسب و کار پيدا نشد.' })
      return
    }
    await setSession(tgId, 'rate_comment', { bizId, stars })
    await api.sendMessage({
      chat_id: tgId,
      text: 'اگر نظر کوتاهي داريد بنويسيد (اختياري). اگر نداريد /skip را بزنيد:',
    })
    return
  }

  if (data.startsWith('promote_biz_')) {
    const bizId = Number(data.slice(12))
    const b = await getBusinessById(bizId)
    if (!b) {
      await api.sendMessage({ chat_id: tgId, text: 'کسب و کار پيدا نشد.' })
      return
    }
    if (b.is_featured) {
      await api.sendMessage({ chat_id: tgId, text: 'اين کسب و کار در حال حاضر ويژه است.' })
      return
    }
    await setSession(tgId, 'pay_ref_promo', { bizId })
    await api.sendMessage({
      chat_id: tgId,
      text: payText(`ويژه شدن «${b.name}» به مدت ۳۰ روز`),
      parse_mode: 'HTML',
      reply_markup: payKeyboard(),
    })
    return
  }

  if (data.startsWith('reveal_biz_')) {
    const bizId = Number(data.slice(11))
    const b = await getBusinessById(bizId)
    if (!b || b.status !== 'active') {
      await api.sendMessage({ chat_id: tgId, text: 'کسب و کار پيدا نشد.' })
      return
    }

    if (await hasPaidAccess(tgId, bizId, 'biz')) {
      await api.sendMessage({ chat_id: tgId, text: formatBusinessFull(b), reply_markup: contactKeyboard(b) })
      return
    }

    await setSession(tgId, 'pay_ref_biz', { bizId })
    await api.sendMessage({
      chat_id: tgId,
      text: payText(`دسترسي به شماره تماس «${b.name}»`),
      parse_mode: 'HTML',
      reply_markup: payKeyboard(),
    })
    return
  }

  if (data === 'help') {
    await api.sendMessage({
      chat_id: tgId,
      text: 'راهنماي سوپر اپ پيرانشهر:\n' +
        '/start - نمايش منوي اصلي\n' +
        'براي ثبت آگهي: منوي اصلي > ثبت آگهي جديد\n' +
        'براي ديدن آگهي ها: منوي اصلي > نمايش آگهي ها\n' +
        'نرخ ارز و طلا: منوي اصلي > نرخ ارز و طلا\n' +
        'ثبت کسب و کار: منوي اصلي > ثبت کسب و کار من\n' +
        'هشدار نرخ: /alert usd 180000',
    })
    return
  }

  if (data.startsWith('reveal_')) {
    const adId = Number(data.slice(7))
    const ad = await getAdById(adId)
    if (!ad || ad.status !== 'active') {
      await api.sendMessage({ chat_id: tgId, text: 'اين آگهي موجود نيست.' })
      return
    }

    if (ad.user_id === tgId) {
      await api.sendMessage({ chat_id: tgId, text: formatContact(ad), reply_markup: contactKeyboard(ad) })
      return
    }

    if (ad.type === 'گمشده' || ad.type === 'پیداشده') {
      await api.sendMessage({ chat_id: tgId, text: formatContact(ad), reply_markup: contactKeyboard(ad) })
      return
    }

    if (await hasPaidAccess(tgId, adId, 'ad')) {
      await api.sendMessage({ chat_id: tgId, text: formatContact(ad), reply_markup: contactKeyboard(ad) })
      return
    }

    await setSession(tgId, 'pay_ref', { adId })
    await api.sendMessage({
      chat_id: tgId,
      text: payText(`دسترسي به شماره تماس آگهي «${ad.title}»`),
      parse_mode: 'HTML',
      reply_markup: payKeyboard(),
    })
    return
  }

  if (data.startsWith('confirm_')) {
    const paymentId = Number(data.slice(8))
    const payment = await getPaymentById(paymentId)
    if (!payment) {
      await api.sendMessage({ chat_id: tgId, text: 'پرداخت پيدا نشد.' })
      return
    }
    await api.sendMessage({ chat_id: tgId, text: 'اين روش پرداخت حذف شده است. از منوي جديد استفاده کنيد.' })
    return
  }

  await api.sendMessage({ chat_id: tgId, text: 'دستور نامشخص.' })
}
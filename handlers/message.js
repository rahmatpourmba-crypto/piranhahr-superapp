import { api } from 'lib/botapi'
import { mainMenuKeyboard, navKeyboard } from 'lib/keyboard'
import { upsertUser, isAdmin, getSession, setSession, clearSession, getLang } from 'lib/session'
import {
  updateRate,
  createAd,
  addBusiness,
  setFeatured,
  setBusinessStatus,
  setBusinessFeatured,
  getAdById,
  getBusinessById,
  listBusinesses,
  listMyBusinesses,
  createPayment,
  formatContact,
  formatBusinessFull,
  contactKeyboard,
  hasPaidAccess,
  addEvent,
  addAlert,
  addRating,
  getRates,
} from 'lib/store'
import { validateRefCode } from 'lib/payment'
import { REVEAL_PRICE } from 'lib/config'
import { banner, DIV, footer } from 'lib/style'

const DISCLAIMER =
  '⚖️ <b>سلب مسئوليت:</b> مديريت و مالکيت ربات هيچ مسئوليتي در قبال موارد ناقص، آلوده، کالاي خراب يا بدعهدي معامله‌کنندگان و مبادله‌کنندگان غذا و کالا ندارد؛ همه موارد به عهده طرفين معامله است.'

const WELCOME =
  `${banner('سوپر اپليکيشن پيرانشهر', '💎')}\n\n` +
  '✨ شهر شما، در يک اپليکيشن\n\n' +
  '🛍 <b>آگهي رايگان</b> بگذار\n' +
  '💰 <b>نرخ لحظه‌اي</b> ارز و طلا\n' +
  '🏪 <b>کسب‌وکارهاي</b> محلي شهر\n' +
  '🎉 از <b>رويدادهاي</b> شهر باخبر شو\n' +
  '🔔 <b>هشدار نرخ</b> بگير\n\n' +
  `${DISCLAIMER}\n\n` +
  `از منوي زير انتخاب کنيد:\n\n${footer()}`

const HELP =
  `${banner('راهنما', '📘')}\n\n` +
  '📌 <b>ثبت آگهي:</b> منوي اصلي > ثبت آگهي جديد\n' +
  '📋 <b>ديدن آگهي‌ها:</b> منوي اصلي > نمايش آگهي‌ها\n' +
  '💹 <b>نرخ ارز و طلا:</b> منوي اصلي > نرخ ارز و طلا\n' +
  '🏪 <b>ثبت کسب‌وکار:</b> منوي اصلي > ثبت کسب و کار من\n' +
  '🎊 <b>رويدادها:</b> منوي اصلي > رويدادهاي محلي\n\n' +
  `${DIV}\n` +
  '🔔 <b>هشدار نرخ:</b>\n' +
  '<code>/alert usd 180000</code> - وقتي دلار به ۱۸۰,۰۰۰ تومان برسد\n' +
  '<code>/alert ons 4500 above</code> - وقتي انس طلا از ۴۵۰۰ دلار بيشتر شود\n\n' +
  `${DIV}\n` +
  '👑 <b>دستورات مدير:</b>\n' +
  '<code>/setrate USD دلار 85000</code> - نرخ دستي\n' +
  '<code>/addbiz نام|دسته|توضيحات|تلفن|آيدي تلگرام|آدرس</code>\n' +
  '<code>/approvebiz &lt;id&gt;</code> - تاييد کسب‌وکار\n' +
  '<code>/rejectbiz &lt;id&gt;</code> - رد کسب‌وکار\n' +
  '<code>/addevent عنوان|زمان|مکان|توضيحات</code> - رويداد\n' +
  '<code>/featured &lt;آيدي آگهي&gt; &lt;روز&gt;</code> - ويژه کردن\n\n' +
  `${DISCLAIMER}\n\n` +
  footer()

const ALERT_CODES = ['usd', 'eur', 'try', 'iqd', 'gold18', 'gold24', 'mesghal', 'coin', 'silver', 'ons', 'silver_ons']

export default async function (update) {
  const msg = update.message
  if (!msg || !msg.text) return

  const tgId = msg.from.id
  const text = msg.text.trim()
  const name = msg.from.first_name || 'کاربر'

  await upsertUser(tgId, name)

  if (text === '/start') {
    await api.sendMessage({
      chat_id: tgId,
      text: WELCOME,
      reply_markup: mainMenuKeyboard(),
      parse_mode: 'HTML',
    })
    return
  }

  if (text === '/help') {
    await api.sendMessage({ chat_id: tgId, text: HELP, parse_mode: 'HTML' })
    return
  }

  if (text.startsWith('/setrate')) {
    if (!(await isAdmin(tgId))) return
    const parts = text.split(/\s+/)
    if (parts.length < 4) {
      await api.sendMessage({ chat_id: tgId, text: 'فرمت: /setrate USD دلار 85000' })
      return
    }
    await updateRate(parts[1], parts[2], parts.slice(3).join(' '))
    await api.sendMessage({ chat_id: tgId, text: 'نرخ ثبت شد.' })
    return
  }

  if (text.startsWith('/addbiz')) {
    if (!(await isAdmin(tgId))) return
    const parts = text.slice(8).split('|').map((p) => p.trim())
    if (parts.length < 3) {
      await api.sendMessage({
        chat_id: tgId,
        text: 'فرمت: /addbiz نام|دسته|توضيحات|تلفن|آيدي تلگرام|آدرس',
      })
      return
    }
    await addBusiness({
      name: parts[0],
      category: parts[1],
      description: parts[2] || '',
      phone: parts[3] || '',
      tgUsername: parts[4] || '',
      address: parts[5] || '',
      isFeatured: false,
      status: 'active',
    })
    await api.sendMessage({ chat_id: tgId, text: 'کسب و کار اضافه شد.' })
    return
  }

  if (text.startsWith('/featured')) {
    if (!(await isAdmin(tgId))) return
    const parts = text.split(/\s+/)
    if (parts.length < 3) {
      await api.sendMessage({ chat_id: tgId, text: 'فرمت: /featured <آيدي آگهي> <تعداد روز>' })
      return
    }
    await setFeatured(Number(parts[1]), Number(parts[2]))
    await api.sendMessage({ chat_id: tgId, text: 'آگهي ويژه شد.' })
    return
  }

  if (text.startsWith('/approvebiz')) {
    if (!(await isAdmin(tgId))) return
    const id = Number(text.split(/\s+/)[1])
    const b = await getBusinessById(id)
    if (!b) {
      await api.sendMessage({ chat_id: tgId, text: 'کسب و کار پيدا نشد.' })
      return
    }
    await setBusinessStatus(id, 'active')
    await api.sendMessage({ chat_id: tgId, text: `کسب و کار «${b.name}» تاييد شد.` })
    if (b.owner_id) {
      await api.sendMessage({
        chat_id: b.owner_id,
        text: `کسب و کار شما «${b.name}» تاييد شد و در ليست نمايش داده مي‌شود.`,
      })
    }
    return
  }

  if (text.startsWith('/rejectbiz')) {
    if (!(await isAdmin(tgId))) return
    const id = Number(text.split(/\s+/)[1])
    const b = await getBusinessById(id)
    if (!b) {
      await api.sendMessage({ chat_id: tgId, text: 'کسب و کار پيدا نشد.' })
      return
    }
    await setBusinessStatus(id, 'rejected')
    await api.sendMessage({ chat_id: tgId, text: `کسب و کار «${b.name}» رد شد.` })
    return
  }

  if (text.startsWith('/addevent')) {
    if (!(await isAdmin(tgId))) return
    const parts = text.slice(9).split('|').map((p) => p.trim())
    if (parts.length < 2) {
      await api.sendMessage({ chat_id: tgId, text: 'فرمت: /addevent عنوان|زمان|مکان|توضيحات' })
      return
    }
    await addEvent({
      title: parts[0],
      dateText: parts[1] || '',
      location: parts[2] || '',
      description: parts[3] || '',
    })
    await api.sendMessage({ chat_id: tgId, text: 'رويداد اضافه شد.' })
    return
  }

  if (text.startsWith('/alert')) {
    const parts = text.split(/\s+/)
    const code = parts[1] ? parts[1].toLowerCase() : ''
    const threshold = parts[2] ? Number(parts[2].replace(/[,،]/g, '')) : NaN
    const direction = parts[3] && parts[3].toLowerCase() === 'above' ? 'above' : 'below'
    if (!ALERT_CODES.includes(code) || Number.isNaN(threshold) || threshold <= 0) {
      await api.sendMessage({
        chat_id: tgId,
        text:
          'فرمت: /alert <کد نرخ> <عدد> [below|above]\n' +
          'کدها: usd, eur, try, iqd, gold18, gold24, mesghal, coin, silver, ons, silver_ons\n' +
          'مثال: /alert usd 180000\n' +
          'مثال: /alert ons 4500 above',
      })
      return
    }
    await addAlert(tgId, code, threshold, direction)
    await api.sendMessage({
      chat_id: tgId,
      text: `هشدار ثبت شد: ${code} ${direction === 'above' ? 'بيشتر از' : 'کمتر از'} ${threshold.toLocaleString('fa-IR')}\nوقتي به اين مقدار برسد خبر مي‌دهم.`,
    })
    return
  }

  const session = await getSession(tgId)

  if (session && (session.state === 'pay_ref' || session.state === 'pay_ref_biz' || session.state === 'pay_ref_promo')) {
    if (session.state === 'pay_ref') {
      const ad = await getAdById(session.data.adId)
      if (!ad || ad.status !== 'active') {
        await clearSession(tgId)
        await api.sendMessage({ chat_id: tgId, text: 'اين آگهي موجود نيست.' })
        return
      }

      if (await hasPaidAccess(tgId, ad.id, 'ad')) {
        await clearSession(tgId)
        await api.sendMessage({ chat_id: tgId, text: formatContact(ad), reply_markup: contactKeyboard(ad) })
        return
      }

      if (!validateRefCode(text)) {
        await api.sendMessage({
          chat_id: tgId,
          text: 'کد پيگيري نامعتبر است. کد ۱۰ رقمي که با ۵۴ شروع مي‌شود را دوباره ارسال کنيد.',
        })
        return
      }

      await createPayment(tgId, ad.id, REVEAL_PRICE, text, 'ad')
      await clearSession(tgId)
      await api.sendMessage({
        chat_id: tgId,
        text: `${banner('پرداخت تاييد شد', '✅')}\n\n${formatContact(ad)}`,
        parse_mode: 'HTML',
        reply_markup: contactKeyboard(ad),
      })
      return
    }

    if (session.state === 'pay_ref_biz') {
      const b = await getBusinessById(session.data.bizId)
      if (!b) {
        await clearSession(tgId)
        await api.sendMessage({ chat_id: tgId, text: 'اين کسب و کار موجود نيست.' })
        return
      }

      if (await hasPaidAccess(tgId, b.id, 'biz')) {
        await clearSession(tgId)
        await api.sendMessage({ chat_id: tgId, text: formatBusinessFull(b), reply_markup: contactKeyboard(b) })
        return
      }

      if (!validateRefCode(text)) {
        await api.sendMessage({
          chat_id: tgId,
          text: 'کد پيگيري نامعتبر است. کد ۱۰ رقمي که با ۵۴ شروع مي‌شود را دوباره ارسال کنيد.',
        })
        return
      }

      await createPayment(tgId, b.id, REVEAL_PRICE, text, 'biz')
      await clearSession(tgId)
      await api.sendMessage({
        chat_id: tgId,
        text: `${banner('پرداخت تاييد شد', '✅')}\n\n${formatBusinessFull(b)}`,
        parse_mode: 'HTML',
        reply_markup: contactKeyboard(b),
      })
      return
    }

    if (session.state === 'pay_ref_promo') {
      const b = await getBusinessById(session.data.bizId)
      if (!b) {
        await clearSession(tgId)
        await api.sendMessage({ chat_id: tgId, text: 'اين کسب و کار موجود نيست.' })
        return
      }

      if (!validateRefCode(text)) {
        await api.sendMessage({
          chat_id: tgId,
          text: 'کد پيگيري نامعتبر است. کد ۱۰ رقمي که با ۵۴ شروع مي‌شود را دوباره ارسال کنيد.',
        })
        return
      }

      await createPayment(tgId, b.id, REVEAL_PRICE, text, 'promo')
      await setBusinessFeatured(b.id, 30)
      await clearSession(tgId)
      await api.sendMessage({
        chat_id: tgId,
        text:
          `${banner('پرداخت تاييد شد', '✅')}\n\n` +
          `👑 کسب و کار «<b>${b.name}</b>» به مدت ۳۰ روز <b>ويژه</b> شد و بالاي ليست نمايش داده مي‌شود.`,
        parse_mode: 'HTML',
      })
      return
    }
  }

  if (session && session.state === 'rate_comment') {
    const comment = text === '/skip' ? '' : text
    const { bizId, stars } = session.data
    const b = await getBusinessById(bizId)
    if (!b) {
      await clearSession(tgId)
      await api.sendMessage({ chat_id: tgId, text: 'کسب و کار پيدا نشد.' })
      return
    }
    await addRating(bizId, tgId, stars, comment)
    await clearSession(tgId)
    await api.sendMessage({
      chat_id: tgId,
      text: `${banner('امتياز شما ثبت شد', '🌟')}\n\nممنون از «<b>${b.name}</b>»!`,
      parse_mode: 'HTML',
    })
    return
  }

  if (session && session.state === 'reg_name') {
    const data = { name: text }
    await setSession(tgId, 'reg_category', data)
    await api.sendMessage({ chat_id: tgId, text: 'دسته کسب و کار را وارد کنيد (مثلا: رستوران، فروشگاه، خدمات):' })
    return
  }

  if (session && session.state === 'reg_category') {
    const data = { ...session.data, category: text }
    await setSession(tgId, 'reg_description', data)
    await api.sendMessage({ chat_id: tgId, text: 'توضيحات کوتاه بنويسيد:' })
    return
  }

  if (session && session.state === 'reg_description') {
    const data = { ...session.data, description: text }
    await setSession(tgId, 'reg_phone', data)
    await api.sendMessage({ chat_id: tgId, text: 'شماره تماس را وارد کنيد:' })
    return
  }

  if (session && session.state === 'reg_phone') {
    const data = { ...session.data, phone: text }
    await setSession(tgId, 'reg_tg', data)
    await api.sendMessage({
      chat_id: tgId,
      text: 'آيدي تلگرام را وارد کنيد (اختياري). اگر نداريد /skip را بزنيد:',
    })
    return
  }

  if (session && session.state === 'reg_tg') {
    const data = { ...session.data }
    if (text !== '/skip') data.tgUsername = text.replace('@', '').trim()
    await setSession(tgId, 'reg_address', data)
    await api.sendMessage({ chat_id: tgId, text: 'آدرس را وارد کنيد:' })
    return
  }

  if (session && session.state === 'reg_address') {
    const data = { ...session.data, address: text }
    await addBusiness({ ...data, ownerId: tgId, status: 'pending', isFeatured: false })
    await clearSession(tgId)
    await api.sendMessage({
      chat_id: tgId,
      text: 'کسب و کار شما ثبت شد و در انتظار تاييد مدير است. به محض تاييد خبر مي‌دهيم.',
    })
    return
  }

  if (!session || !session.state) {
    await api.sendMessage({
      chat_id: tgId,
      text: 'از منوي زير استفاده کنيد:',
      reply_markup: mainMenuKeyboard(),
    })
    return
  }

  await handleAdFlow(tgId, session, text)
}

async function handleAdFlow(tgId, session, text) {
  const step = session.state
  const data = session.data || {}
  const nav = navKeyboard('step_back')

  if (step === 'slot_field') {
    data.title = `نوبت خالی: ${text}`
    data._back = 'slot_field'
    await setSession(tgId, 'ad_price', data)
    await api.sendMessage({ chat_id: tgId, text: 'هزينه نوبت يا ساعت را وارد کنيد (يا: توافقي):', reply_markup: nav })
    return
  }

  if (step === 'lost_field' || step === 'found_field') {
    data.title = `${step === 'lost_field' ? 'گمشده' : 'پیداشده'}: ${text}`
    data._back = step
    await setSession(tgId, 'ad_price', data)
    await api.sendMessage({
      chat_id: tgId,
      text: step === 'lost_field' ? 'پاداش تعیین‌شده را وارد کنيد (يا: رايگان):' : 'قيمت را وارد کنيد (يا: رايگان):',
      reply_markup: nav,
    })
    return
  }

  if (step === 'workforce_field') {
    data.title = `درخواست نیروی کار: ${text}`
    data._back = 'workforce_field'
    await setSession(tgId, 'ad_price', data)
    await api.sendMessage({ chat_id: tgId, text: 'دستمزد پيشنهادي را وارد کنيد (يا: توافقي):', reply_markup: nav })
    return
  }

  if (step === 'rest_field') {
    data.title = `غذای اضافه و تخفیف‌دار: ${text}`
    data._back = 'rest_field'
    await setSession(tgId, 'ad_price', data)
    await api.sendMessage({ chat_id: tgId, text: 'قيمت با تخفيف را وارد کنيد (يا: توافقي):', reply_markup: nav })
    return
  }

  if (step === 'job_field') {
    data.title = `درخواست استخدام: ${text}`
    data._back = 'job_field'
    await setSession(tgId, 'ad_price', data)
    await api.sendMessage({ chat_id: tgId, text: 'دستمزد مورد انتظار را وارد کنيد (يا: توافقي):', reply_markup: nav })
    return
  }

  if (step === 'ad_title') {
    data.title = text
    data._back = 'ad_title'
    await setSession(tgId, 'ad_price', data)
    await api.sendMessage({
      chat_id: tgId,
      text: data.type === 'درخواست' ? 'دستمزد مورد انتظار را وارد کنيد (يا: توافقي):' : 'قيمت را وارد کنيد (يا: رايگان):',
      reply_markup: nav,
    })
    return
  }

  if (step === 'ad_price') {
    data.price = text
    data._back = 'ad_price'
    await setSession(tgId, 'ad_description', data)
    await api.sendMessage({ chat_id: tgId, text: 'توضيحات را وارد کنيد:', reply_markup: nav })
    return
  }

  if (step === 'ad_description') {
    data.description = text
    data._back = 'ad_description'
    await setSession(tgId, 'ad_contact', data)
    await api.sendMessage({ chat_id: tgId, text: 'شماره تماس يا راه ارتباطي را وارد کنيد:', reply_markup: nav })
    return
  }

  if (step === 'ad_contact') {
    data.contact = text
    data._back = 'ad_contact'
    await setSession(tgId, 'ad_tg', data)
    await api.sendMessage({
      chat_id: tgId,
      text: 'آيدي تلگرام خود را وارد کنيد (اختياري - براي دکمه تلگرام). اگر نداريد /skip را بزنيد:',
      reply_markup: nav,
    })
    return
  }

  if (step === 'ad_tg') {
    if (text !== '/skip') {
      data.tgUsername = text.replace('@', '').trim()
    }
    await createAd(tgId, data)
    await clearSession(tgId)
    await api.sendMessage({
      chat_id: tgId,
      text: `${banner('آگهي شما ثبت شد', '🎉')}\n\nاز منوي زير انتخاب کنيد:`,
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboard(),
    })
    return
  }

  await api.sendMessage({ chat_id: tgId, text: 'دستور نامشخص.', reply_markup: nav })
}
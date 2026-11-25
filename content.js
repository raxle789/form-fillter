/**
 * content.js — runs in the page (isolated world).
 * Injected on demand by popup.js, then called via chrome.scripting.executeScript.
 *
 * Exposes: window.__FORM_FILLER__ = { scan, fill, clear }
 */
(() => {
  const SIGNAL = '#E8A33D';
  const STYLE_ID = '__ff_style';

  /* ------------------------------------------------------------------ *
   * 1. Sample data
   * ------------------------------------------------------------------ */

  const DATA = {
    id: {
      first: ['Adit', 'Bagus', 'Citra', 'Dewi', 'Eka', 'Fajar', 'Gita', 'Hendra',
        'Indah', 'Joko', 'Kirana', 'Lestari', 'Mega', 'Nanda', 'Putri', 'Rangga',
        'Sari', 'Tono', 'Wulan', 'Yudha'],
      last: ['Pratama', 'Wijaya', 'Saputra', 'Hidayat', 'Nugroho', 'Kusuma',
        'Maulana', 'Santoso', 'Permana', 'Anggraini', 'Setiawan', 'Halim'],
      street: ['Jl. Merdeka', 'Jl. Sudirman', 'Jl. Diponegoro', 'Jl. Gatot Subroto',
        'Jl. Ahmad Yani', 'Jl. Cendrawasih', 'Jl. Melati', 'Jl. Pahlawan'],
      city: ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Semarang', 'Medan',
        'Makassar', 'Denpasar', 'Malang', 'Bogor'],
      province: ['DKI Jakarta', 'Jawa Barat', 'Jawa Timur', 'Jawa Tengah',
        'DI Yogyakarta', 'Bali', 'Sumatera Utara', 'Sulawesi Selatan'],
      country: 'Indonesia',
      company: ['PT Sinar Abadi', 'CV Karya Mandiri', 'PT Nusantara Digital',
        'PT Cipta Solusi', 'CV Bumi Persada', 'PT Anugerah Teknologi'],
      job: ['Frontend Developer', 'Product Manager', 'QA Engineer', 'UI Designer',
        'Data Analyst', 'Backend Developer', 'Staf Administrasi'],
      words: ['contoh', 'data', 'uji', 'coba', 'catatan', 'ringkas', 'lorem',
        'ipsum', 'dummy', 'sementara', 'halaman', 'formulir'],
    },
    en: {
      first: ['Alex', 'Bella', 'Chris', 'Dana', 'Evan', 'Fiona', 'Gary', 'Hana',
        'Ivan', 'Julia', 'Kevin', 'Laura', 'Marcus', 'Nina', 'Oscar', 'Paula'],
      last: ['Anderson', 'Brooks', 'Carter', 'Dawson', 'Ellis', 'Foster',
        'Griffin', 'Hayes', 'Ingram', 'Jenkins', 'Keller', 'Lawson'],
      street: ['12 Maple Street', '48 Oak Avenue', '7 Birch Lane', '215 Pine Road',
        '90 Cedar Court', '33 Willow Drive'],
      city: ['Springfield', 'Riverton', 'Fairview', 'Lakewood', 'Ashford',
        'Bridgeport', 'Kingsley'],
      province: ['California', 'Texas', 'Oregon', 'Colorado', 'Vermont', 'Ohio'],
      country: 'United States',
      company: ['Northwind Labs', 'Acme Systems', 'Bluepeak Studio',
        'Ridgeline Corp', 'Overtone Digital'],
      job: ['Frontend Developer', 'Product Manager', 'QA Engineer', 'UI Designer',
        'Data Analyst', 'Backend Developer'],
      words: ['sample', 'placeholder', 'testing', 'draft', 'note', 'lorem',
        'ipsum', 'dummy', 'temporary', 'form', 'value'],
    },
  };

  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const num = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const digits = (n) => Array.from({ length: n }, () => num(0, 9)).join('');
  const pad = (n) => String(n).padStart(2, '0');
  const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');

  /** One persona per run, so name / email / username stay consistent. */
  function makePersona(locale) {
    const d = DATA[locale] || DATA.id;
    const first = rand(d.first);
    const last = rand(d.last);
    const n = num(1, 99);
    return {
      d,
      first,
      last,
      full: `${first} ${last}`,
      username: `${slug(first)}_${slug(last)}${n}`,
      // example.com is reserved for documentation — it can never reach a real inbox.
      email: `${slug(first)}.${slug(last)}${n}@example.com`,
      phone: locale === 'en' ? `+1 555 ${digits(4)}` : `08${num(11, 89)}${digits(8)}`,
      street: `${rand(d.street)} No. ${num(1, 120)}`,
      city: rand(d.city),
      province: rand(d.province),
      company: rand(d.company),
      job: rand(d.job),
    };
  }

  function sentence(d, min = 6, max = 14) {
    const w = Array.from({ length: num(min, max) }, () => rand(d.words));
    const s = w.join(' ');
    return s.charAt(0).toUpperCase() + s.slice(1) + '.';
  }

  const GEN = {
    firstName: (p) => p.first,
    lastName: (p) => p.last,
    fullName: (p) => p.full,
    username: (p) => p.username,
    email: (p) => p.email,
    password: () => `Test${digits(4)}!aB`,
    phone: (p) => p.phone,
    company: (p) => p.company,
    jobTitle: (p) => p.job,
    street: (p) => p.street,
    street2: () => `Unit ${num(1, 40)}`,
    city: (p) => p.city,
    province: (p) => p.province,
    country: (p) => p.d.country,
    postalCode: () => digits(5),
    url: (p) => `https://${slug(p.company)}.example.com`,
    age: () => String(num(18, 65)),
    number: (p, el) => {
      const min = el && el.min !== '' ? Number(el.min) : 1;
      const max = el && el.max !== '' ? Number(el.max) : (/proportion|percent|persen|%/i.test(signals(el)) ? 100 : 999);
      return String(num(Math.max(min, 1), Math.max(min + 1, max)));
    },
    quantity: () => String(num(1, 20)),
    price: () => String(num(10, 500) * 1000),
    digits: (p, el) => digits(el.maxLength > 0 ? Math.min(el.maxLength, 16) : 16),
    ccNumber: () => '4111111111111111', // public Visa test number
    ccExp: () => `${pad(num(1, 12))}/${String(new Date().getFullYear() + 2).slice(2)}`,
    ccCsc: () => digits(3),
    word: (p) => rand(p.d.words),
    title: (p) => {
      const words = Array.from({ length: num(3, 6) }, () => rand(p.d.words));
      const s = words.join(' ');
      return s.charAt(0).toUpperCase() + s.slice(1);
    },
    message: (p) => `${sentence(p.d)} ${sentence(p.d)}`,
    color: () => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'),
    date: () => {
      const t = new Date();
      t.setDate(t.getDate() - num(1, 3000));
      return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
    },
    month: () => `${new Date().getFullYear()}-${pad(num(1, 12))}`,
    week: () => `${new Date().getFullYear()}-W${pad(num(1, 52))}`,
    time: () => `${pad(num(8, 20))}:${pad(num(0, 59))}`,
    datetime: (p, el) => `${GEN.date()}T${GEN.time()}`,
    range: (p, el) => {
      const min = Number(el.min || 0);
      const max = Number(el.max || 100);
      return String(Math.round((min + max) / 2));
    },
  };

  /* ------------------------------------------------------------------ *
   * 2. Field type detection
   * ------------------------------------------------------------------ */

  // autocomplete is the most reliable signal when the page bothers to set it.
  const AC_MAP = {
    email: 'email',
    username: 'username',
    'new-password': 'password',
    'current-password': 'password',
    'given-name': 'firstName',
    'additional-name': 'firstName',
    'family-name': 'lastName',
    name: 'fullName',
    nickname: 'username',
    tel: 'phone',
    'tel-national': 'phone',
    organization: 'company',
    'organization-title': 'jobTitle',
    'street-address': 'street',
    'address-line1': 'street',
    'address-line2': 'street2',
    'address-level2': 'city',
    'address-level1': 'province',
    'postal-code': 'postalCode',
    'country-name': 'country',
    url: 'url',
    bday: 'date',
    'cc-number': 'ccNumber',
    'cc-name': 'fullName',
    'cc-exp': 'ccExp',
    'cc-csc': 'ccCsc',
  };

  // Ordered — first match wins, so put the specific patterns above the vague ones.
  const RULES = [
    ['email', /e-?mail|surel/],
    ['password', /password|passwd|sandi/],
    ['firstName', /first.?name|given.?name|nama.?depan|\bfname\b/],
    ['lastName', /last.?name|family.?name|surname|nama.?belakang|\blname\b/],
    ['username', /user.?name|nickname|handle|akun/],
    ['fullName', /full.?name|nama.?lengkap|\bname\b|\bnama\b/],
    ['phone', /phone|mobile|\btel\b|whatsapp|\bhp\b|telepon|nomor.?hp|kontak/],
    ['company', /company|organi[sz]ation|perusahaan|instansi/],
    ['jobTitle', /job.?title|position|jabatan|occupation|pekerjaan/],
    ['postalCode', /post(al)?.?code|\bzip\b|kode.?pos/],
    ['city', /\bcity\b|\btown\b|\bkota\b|kabupaten/],
    ['province', /\bstate\b|province|provinsi|\bregion\b/],
    ['country', /country|negara/],
    ['street', /address.?line|street|\balamat\b|\baddress\b/],
    ['url', /website|\burl\b|\blink\b|homepage|situs/],
    ['age', /\bage\b|\bumur\b|\busia\b/],
    ['digits', /\bnik\b|npwp|\bktp\b|\bnis\b|account.?number|no.?rekening|nomor.?induk/],
    ['number', /proportion|proporsi|persentase|percent|percentage|%/],
    ['price', /price|harga|nominal|salary|gaji|biaya|tarif|ongkos/],
    ['quantity', /\bqty\b|quantity|kuantitas|stock|stok|jumlah/],
    ['title', /title|judul|subject|topik|subjek/],
    ['message', /message|comment|description|\bnote\b|\bbio\b|pesan|keterangan|deskripsi|catatan|alasan|chronology|kronologi|detail|issue|masalah|kendala/],
  ];

  const BY_INPUT_TYPE = {
    email: 'email',
    tel: 'phone',
    url: 'url',
    password: 'password',
    date: 'date',
    month: 'month',
    week: 'week',
    time: 'time',
    'datetime-local': 'datetime',
    color: 'color',
    range: 'range',
    checkbox: 'checkbox',
    radio: 'radio',
    file: 'file',
  };

  /** Everything the page tells us about a field, lowercased into one string. */
  function signals(el) {
    const parts = [
      el.getAttribute('autocomplete'),
      el.getAttribute('name'),
      el.id,
      el.getAttribute('placeholder'),
      el.getAttribute('aria-label'),
      el.getAttribute('data-testid'),
      labelText(el),
    ];
    return parts.filter(Boolean).join(' ').toLowerCase();
  }

  function labelText(el) {
    let text = '';
    if (el.id) {
      const root = el.getRootNode?.() || document;
      const lbl = root.querySelector?.(`label[for="${CSS.escape(el.id)}"]`);
      if (lbl) text = lbl.textContent;
    }
    if (!text) text = el.getAttribute('aria-label') || '';
    if (!text) {
      const labelledby = el.getAttribute('aria-labelledby');
      if (labelledby) text = document.getElementById(labelledby)?.textContent || '';
    }
    if (!text) text = el.closest('label')?.textContent || '';

    // Check enclosing form group / form item label (shadcn FormItem / space-y-2)
    if (!text) {
      const container = el.closest('.form-item, .form-group, .ant-form-item, [class*="form-item"], [class*="form-group"], [class*="space-y"]');
      if (container) {
        const lbl = container.querySelector('label, .form-label, [class*="label"]');
        if (lbl && !lbl.contains(el)) {
          text = lbl.textContent;
        }
      }
    }

    // Check previous element sibling
    if (!text && el.previousElementSibling) {
      const prev = el.previousElementSibling;
      if (['LABEL', 'SPAN', 'P', 'DIV', 'H4', 'H5', 'H6'].includes(prev.tagName)) {
        const pText = prev.textContent.trim();
        if (pText && pText.length <= 80) text = pText;
      }
    }

    // Check parent's previous element sibling
    if (!text && el.parentElement?.previousElementSibling) {
      const prev = el.parentElement.previousElementSibling;
      if (['LABEL', 'SPAN', 'P', 'DIV', 'H4', 'H5', 'H6'].includes(prev.tagName)) {
        const pText = prev.textContent.trim();
        if (pText && pText.length <= 80) text = pText;
      }
    }

    // Check next sibling element (e.g. <span>Label</span>)
    if (!text && el.nextElementSibling) {
      const sib = el.nextElementSibling;
      if (['LABEL', 'SPAN', 'P', 'DIV', 'B', 'STRONG'].includes(sib.tagName)) {
        text = sib.textContent;
      }
    }
    // Check next text node
    if (!text && el.nextSibling && el.nextSibling.nodeType === 3) {
      text = el.nextSibling.textContent;
    }
    // Check parent element if it's a short inline wrapper
    if (!text && el.parentElement) {
      const p = el.parentElement;
      if (['LABEL', 'SPAN', 'DIV', 'LI'].includes(p.tagName)) {
        const pText = p.textContent.trim();
        if (pText && pText.length <= 100) {
          text = pText;
        }
      }
    }
    // Fallback to value or placeholder
    if (!text && el.value && el.value !== 'on') {
      text = el.value;
    }
    if (!text && el.getAttribute?.('placeholder')) {
      text = el.getAttribute('placeholder');
    }

    return (text || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  function isComboboxTrigger(el) {
    if (!el || el.disabled) return false;
    const tag = el.tagName.toLowerCase();

    // Explicit role="combobox" (standard shadcn / Radix / ARIA)
    const role = el.getAttribute('role');
    if (role === 'combobox') return true;

    // Radix UI / shadcn Select & Popover Triggers
    if (el.hasAttribute('data-radix-select-trigger')) return true;
    if (el.hasAttribute('data-radix-popover-trigger')) return true;

    if (tag === 'button' || tag === 'div') {
      const hasPopup = el.getAttribute('aria-haspopup');
      const hasExpanded = el.hasAttribute('aria-expanded');

      if (hasPopup && hasExpanded) return true;

      const cls = (el.className || '').toString();
      if (/select-trigger|combobox/i.test(cls)) return true;
    }

    return false;
  }

  function isDatePickerTrigger(el) {
    if (!el || el.disabled) return false;
    const tag = el.tagName.toLowerCase();
    if (tag !== 'button' && tag !== 'div') return false;

    const text = el.textContent.trim().toLowerCase();
    const sig = signals(el);

    if (/pick.?(date|tanggal)|select.?(date|tanggal)|pilih.?(tanggal|waktu)|date.?range/i.test(text)) {
      return true;
    }

    const hasPopup = el.getAttribute('aria-haspopup');
    const hasExpanded = el.hasAttribute('aria-expanded');
    const hasState = el.hasAttribute('data-state');

    if ((hasPopup || hasExpanded || hasState) && /date|tanggal|period|periode|timeline|preparation|auction|implementation|deadline|schedule|start|end/i.test(sig)) {
      return true;
    }

    return false;
  }

  function getOpenCalendarDays() {
    const selectors = [
      '.rdp-day:not([disabled]):not([aria-disabled="true"]):not([aria-hidden="true"]):not(.rdp-day_outside)',
      'button[name="day"]:not([disabled]):not([aria-disabled="true"]):not([aria-hidden="true"])',
      '[data-radix-popper-content-wrapper] button:not([disabled]):not([aria-disabled="true"])',
      '[data-radix-popover-content] button:not([disabled]):not([aria-disabled="true"])',
      'table tbody button:not([disabled]):not([aria-disabled="true"])',
      '[role="grid"] [role="gridcell"] button:not([disabled]):not([aria-disabled="true"])',
      '[role="grid"] button:not([disabled]):not([aria-disabled="true"])',
      '.ant-picker-cell-inner',
    ];

    const all = [...document.querySelectorAll(selectors.join(', '))];
    return all.filter((btn) => {
      if (btn.getClientRects().length === 0) return false;
      const cs = getComputedStyle(btn);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;

      const txt = btn.textContent.trim();
      const numVal = parseInt(txt, 10);
      return !isNaN(numVal) && numVal >= 1 && numVal <= 31 && /^\d{1,2}$/.test(txt);
    });
  }

  async function waitForCalendarDays(timeoutMs = 600) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const days = getOpenCalendarDays();
      if (days.length > 0) return days;
      await new Promise((r) => setTimeout(r, 30));
    }
    return getOpenCalendarDays();
  }

  async function fillDatePicker(el, desiredValue = null) {
    try { el.focus({ preventScroll: true }); } catch { }

    // Open calendar popover
    clickElement(el);

    // Wait for calendar day buttons to render
    const days = await waitForCalendarDays(600);
    if (!days || days.length === 0) {
      closePopover();
      return false;
    }

    const text = el.textContent.trim().toLowerCase();
    const lbl = labelText(el).toLowerCase();
    const isRange = /range|period|periode|timeline|duration|preparation|auction|implementation/.test(text + ' ' + lbl);

    if (isRange && days.length >= 7) {
      // Pick start date and end date
      const startIdx = num(1, Math.min(6, days.length - 4));
      const endIdx = num(startIdx + 2, Math.min(startIdx + 14, days.length - 1));

      clickElement(days[startIdx]);
      await new Promise((r) => setTimeout(r, 80));

      const currentDays = getOpenCalendarDays();
      const endTarget = currentDays[endIdx] || days[endIdx] || currentDays[currentDays.length - 1];
      if (endTarget) {
        clickElement(endTarget);
      }
    } else {
      // Single date
      const chosen = days.find((d) => d.classList.contains('rdp-day_today')) || rand(days);
      clickElement(chosen);
    }

    await new Promise((r) => setTimeout(r, 100));
    closePopover();
    return true;
  }

  function isComboboxPlaceholder(el) {
    if (el.hasAttribute('data-placeholder')) return true;
    const text = el.textContent.trim();
    if (!text) return true;
    if (/^(select|pilih|choose|search|cari|all|pick)\b/i.test(text)) return true;
    if (/pick.?(date|tanggal)|select.?(date|tanggal)|pilih.?(tanggal|waktu)|date.?range/i.test(text)) return true;
    if (/\.\.\.$/.test(text)) return true;
    return false;
  }

  function isDatePickerPlaceholder(el) {
    if (el.hasAttribute('data-placeholder')) return true;
    const text = el.textContent.trim();
    if (!text) return true;
    if (/pick.?(date|tanggal)|select.?(date|tanggal)|pilih.?(tanggal|waktu)|date.?range/i.test(text)) return true;
    if (/^(select|pilih|choose|search|cari|all|pick)\b/i.test(text)) return true;
    if (/\.\.\.$/.test(text)) return true;
    return false;
  }

  function getOpenPopoverItems() {
    const selectors = [
      '[cmdk-item]:not([aria-disabled="true"]):not([data-disabled="true"])',
      '[cmdk-list] [role="option"]:not([aria-disabled="true"]):not([data-disabled])',
      '[data-radix-popper-content-wrapper] [role="option"]:not([aria-disabled="true"]):not([data-disabled])',
      '[data-radix-select-content] [role="option"]:not([aria-disabled="true"]):not([data-disabled])',
      '[role="listbox"] [role="option"]:not([aria-disabled="true"]):not([data-disabled])',
      '[data-radix-popover-content] [cmdk-item]',
      '[data-radix-popover-content] [role="option"]',
      '[role="dialog"] [cmdk-item]',
      '[role="dialog"] [role="option"]',
      '.ant-select-dropdown :not(.ant-select-item-option-disabled).ant-select-item-option',
    ];

    const all = [...document.querySelectorAll(selectors.join(', '))];
    return all.filter((item) => {
      if (item.getClientRects().length === 0) return false;
      const cs = getComputedStyle(item);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    });
  }

  async function waitForPopoverItems(timeoutMs = 450) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const items = getOpenPopoverItems();
      if (items.length > 0) return items;
      await new Promise((r) => setTimeout(r, 30));
    }
    return getOpenPopoverItems();
  }

  function closePopover() {
    const openPoppers = [...document.querySelectorAll(
      '[data-radix-popper-content-wrapper], [data-radix-select-content][data-state="open"], [data-radix-popover-content][data-state="open"]'
    )].filter((p) => {
      if (p.getClientRects().length === 0) return false;
      const cs = getComputedStyle(p);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    });

    if (openPoppers.length > 0) {
      for (const p of openPoppers) {
        p.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: false }));
      }
    }
  }

  async function fillCombobox(el, desiredValue = null) {
    try { el.focus({ preventScroll: true }); } catch { }

    // Open popover by clicking trigger
    clickElement(el);

    // Wait for cmdk / radix items to appear in the DOM
    const items = await waitForPopoverItems(600);
    if (!items || items.length === 0) {
      closePopover();
      return false;
    }

    let targetItem = null;
    if (desiredValue) {
      const wanted = String(desiredValue).toLowerCase().trim();
      targetItem =
        items.find((item) => item.getAttribute('data-value')?.toLowerCase() === wanted) ||
        items.find((item) => item.getAttribute('value')?.toLowerCase() === wanted) ||
        items.find((item) => item.textContent.toLowerCase().trim() === wanted) ||
        items.find((item) => item.textContent.toLowerCase().includes(wanted)) ||
        items.find((item) => wanted.includes(item.textContent.toLowerCase().trim()));
    }

    if (!targetItem) {
      const usable = items.filter((item) => {
        const t = item.textContent.trim();
        return t && !/^(select|pilih|none|clear|kosongkan|all)\b/i.test(t);
      });
      targetItem = usable.length > 0 ? rand(usable) : rand(items);
    }

    if (!targetItem) {
      closePopover();
      return false;
    }

    // Click target item
    clickElement(targetItem);

    await new Promise((r) => setTimeout(r, 100));
    closePopover();
    return true;
  }

  function getRadioGroup(el) {
    if (el.name) {
      const root = el.getRootNode?.() || document;
      const group = [...(root.querySelectorAll?.(`input[type="radio"][name="${CSS.escape(el.name)}"]`) || [])];
      if (group.length) return group;
    }

    // If no name attribute, find grouping container (fieldset, radiogroup, or closest parent with multiple radios)
    let container = el.closest('fieldset, [role="radiogroup"], .form-group, .ant-radio-group, .radio-group');
    if (!container) {
      let curr = el.parentElement;
      while (curr && curr !== document.body && curr !== document.documentElement) {
        const radios = curr.querySelectorAll('input[type="radio"]');
        if (radios.length > 1) {
          container = curr;
          break;
        }
        curr = curr.parentElement;
      }
    }

    if (container) {
      const radios = [...container.querySelectorAll('input[type="radio"]')].filter((r) => !r.name || r.name === el.name);
      if (radios.length > 0) return radios;
    }

    return [el];
  }

  const radioGroupIds = new WeakMap();
  let radioGroupCounter = 0;

  function getRadioGroupKey(el) {
    if (el.name) return `name:${el.name}`;
    const group = getRadioGroup(el);
    const leader = group[0] || el;
    if (!radioGroupIds.has(leader)) {
      radioGroupIds.set(leader, `radio_group_${++radioGroupCounter}`);
    }
    return radioGroupIds.get(leader);
  }

  function getRadioGroupLabel(el) {
    // 1. If inside fieldset, check legend
    const fieldset = el.closest('fieldset');
    if (fieldset) {
      const legend = fieldset.querySelector('legend');
      if (legend?.textContent?.trim()) return legend.textContent.trim();
    }

    // 2. Check radiogroup aria-label or aria-labelledby
    const radiogroup = el.closest('[role="radiogroup"]');
    if (radiogroup) {
      const al = radiogroup.getAttribute('aria-label');
      if (al) return al.trim();
      const alb = radiogroup.getAttribute('aria-labelledby');
      if (alb) {
        const lbl = document.getElementById(alb);
        if (lbl?.textContent?.trim()) return lbl.textContent.trim();
      }
    }

    // 3. Check enclosing form item/group label
    const formGroup = el.closest('.form-group, .form-item, .ant-form-item, [class*="form-group"], [class*="form-item"]');
    if (formGroup) {
      const lbl = formGroup.querySelector('label, .form-label, .ant-form-item-label');
      if (lbl && !lbl.contains(el) && lbl.textContent?.trim()) {
        return lbl.textContent.trim();
      }
    }

    // 4. Check preceding sibling element or label
    let prev = el.parentElement;
    while (prev && prev !== document.body && prev !== document.documentElement) {
      if (prev.previousElementSibling) {
        const prevEl = prev.previousElementSibling;
        if (['LABEL', 'LEGEND', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'DIV'].includes(prevEl.tagName)) {
          const t = prevEl.textContent.trim();
          if (t && t.length < 60) return t;
        }
      }
      prev = prev.parentElement;
    }

    return '';
  }

  function guessType(el) {
    if (isDatePickerTrigger(el)) return 'date';
    if (isComboboxTrigger(el)) return 'combobox';
    const tag = el.tagName.toLowerCase();
    if (tag === 'select') return 'select';
    if (tag === 'textarea') return 'message';
    if (el.isContentEditable) return 'message';

    const inputType = (el.getAttribute('type') || 'text').toLowerCase();
    if (BY_INPUT_TYPE[inputType]) return BY_INPUT_TYPE[inputType];

    const ac = (el.getAttribute('autocomplete') || '').toLowerCase().split(/\s+/).pop();
    if (AC_MAP[ac]) return AC_MAP[ac];

    const s = signals(el);
    for (const [type, re] of RULES) if (re.test(s)) return type;

    return inputType === 'number' ? 'number' : 'word';
  }

  /* ------------------------------------------------------------------ *
   * 3. Writing values (framework-safe)
   * ------------------------------------------------------------------ */

  /**
   * React keeps an internal value tracker on the DOM node. Assigning
   * `el.value = x` updates the DOM but not the tracker, so React skips the
   * change event and state never updates. Going through the prototype's
   * native setter defeats the tracker; Vue's v-model just needs `input`.
   */
  function setValue(el, value) {
    const proto =
      el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
        : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype
          : HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');

    const tracker = el._valueTracker;
    if (tracker) {
      try { tracker.setValue(''); } catch { }
    }

    if (desc && desc.set) desc.set.call(el, value);
    else el.value = value;

    try {
      el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
    } catch { }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setEditable(el, value) {
    el.textContent = value;
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
  }

  /** Generic mouse & click sequence for buttons, triggers, and custom items. */
  function clickElement(el) {
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch { }

    const mouseEvents = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
    for (const type of mouseEvents) {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    }
    try { el.click(); } catch { }
  }

  // 1x1 transparent PNG binary bytes
  const DUMMY_PNG = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);

  // Valid minimal 1-page PDF binary bytes
  const DUMMY_PDF = new Uint8Array([
    0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xd0, 0xd4,
    0xc5, 0xd8, 0x0a, 0x31, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, 0x3c,
    0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, 0x43, 0x61, 0x74, 0x61, 0x6c,
    0x6f, 0x67, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, 0x20, 0x30,
    0x20, 0x52, 0x3e, 0x3e, 0x0a, 0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a,
    0x32, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, 0x3c, 0x3c, 0x2f, 0x54,
    0x79, 0x70, 0x65, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x2f, 0x4b, 0x69,
    0x64, 0x73, 0x5b, 0x33, 0x20, 0x30, 0x20, 0x52, 0x5d, 0x2f, 0x43, 0x6f,
    0x75, 0x6e, 0x74, 0x20, 0x31, 0x3e, 0x3e, 0x0a, 0x65, 0x6e, 0x64, 0x6f,
    0x62, 0x6a, 0x0a, 0x33, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, 0x3c,
    0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x2f,
    0x50, 0x61, 0x72, 0x65, 0x6e, 0x74, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52,
    0x2f, 0x4d, 0x65, 0x64, 0x69, 0x61, 0x42, 0x6f, 0x78, 0x5b, 0x30, 0x20,
    0x30, 0x20, 0x33, 0x30, 0x30, 0x20, 0x31, 0x34, 0x34, 0x5d, 0x3e, 0x3e,
    0x0a, 0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, 0x78, 0x72, 0x65, 0x66,
    0x0a, 0x30, 0x20, 0x34, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30,
    0x30, 0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33, 0x35, 0x20, 0x66, 0x0a,
    0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x35, 0x20, 0x30,
    0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30,
    0x30, 0x30, 0x30, 0x36, 0x38, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20,
    0x6e, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x32, 0x35,
    0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x0a, 0x74, 0x72, 0x61,
    0x69, 0x6c, 0x65, 0x72, 0x0a, 0x3c, 0x3c, 0x2f, 0x53, 0x69, 0x7a, 0x65,
    0x20, 0x34, 0x2f, 0x52, 0x6f, 0x6f, 0x74, 0x20, 0x31, 0x20, 0x30, 0x20,
    0x52, 0x3e, 0x3e, 0x0a, 0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65,
    0x66, 0x0a, 0x31, 0x39, 0x31, 0x0a, 0x25, 0x25, 0x45, 0x4f, 0x46
  ]);

  // Valid 1x1 JPEG binary bytes
  const DUMMY_JPG = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
    0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
    0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
    0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
    0x00, 0xbf, 0x00, 0xff, 0xd9
  ]);

  function createDummyFile(el) {
    const accept = (el.getAttribute('accept') || '').toLowerCase();
    const sig = signals(el);

    if (accept.includes('image') || accept.includes('.png') || accept.includes('.jpg') || accept.includes('.jpeg') || /gambar|foto|photo|image|evidence|bukti|ktp|avatar|logo/.test(sig)) {
      if (accept.includes('.jpg') || accept.includes('.jpeg')) {
        return new File([DUMMY_JPG], 'sample_image.jpg', { type: 'image/jpeg' });
      }
      return new File([DUMMY_PNG], 'sample_image.png', { type: 'image/png' });
    }

    if (accept.includes('.pdf') || /pdf|dokumen|document|surat|proposal|digest|laporan|report/.test(sig)) {
      return new File([DUMMY_PDF], 'sample_document.pdf', { type: 'application/pdf' });
    }

    if (accept.includes('.csv') || accept.includes('.xls') || accept.includes('.xlsx') || /csv|excel|spreadsheet|data/.test(sig)) {
      return new File(['col1,col2,col3\nval1,val2,val3\n'], 'sample_data.csv', { type: 'text/csv' });
    }

    // Default fallback: PDF
    return new File([DUMMY_PDF], 'sample_document.pdf', { type: 'application/pdf' });
  }

  function fillFileInput(input) {
    if (!input) return false;

    try {
      const file = createDummyFile(input);
      const dt = new DataTransfer();
      dt.items.add(file);

      // 1. Assign to native input.files
      try {
        input.files = dt.files;
      } catch (e) {
        const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files');
        if (desc && desc.set) {
          try { desc.set.call(input, dt.files); } catch { }
        }
      }

      // 2. Dispatch events on the input
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      // 3. Dispatch drag & drop events to the dropzone container
      const dropzone =
        input.closest('.dropzone, [class*="dropzone"], [class*="upload"], [class*="dropArea"], [class*="drop-area"], .ant-upload, .ant-upload-drag, .border-dashed') ||
        input.parentElement?.parentElement || input.parentElement;

      if (dropzone && dropzone !== document.body) {
        try {
          dropzone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }));
          dropzone.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
          dropzone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
        } catch (e) { }
      }

      return true;
    } catch (err) {
      console.warn('Failed to fill file input:', err);
      return false;
    }
  }

  /** Full sequence click & event dispatching for radio buttons across all frameworks. */
  function clickRadio(el) {
    if (!el) return;

    const root = el.getRootNode?.() || document;
    const lbl = el.closest('label') ||
      (el.id ? root.querySelector?.(`label[for="${CSS.escape(el.id)}"]`) : null) ||
      el.parentElement?.closest('label') ||
      (el.nextElementSibling?.tagName === 'LABEL' ? el.nextElementSibling : null);

    const parent = el.parentElement;

    try { el.focus({ preventScroll: true }); } catch { }

    if (el instanceof HTMLInputElement) {
      const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
      if (desc && desc.set) {
        try { desc.set.call(el, true); } catch { el.checked = true; }
      } else {
        el.checked = true;
      }
    }

    const mouseEventTypes = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
    for (const type of mouseEventTypes) {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    }

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));

    if (lbl && lbl !== el) {
      for (const type of mouseEventTypes) {
        lbl.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
      }
      try { lbl.click(); } catch { }
    } else if (parent && parent !== document.body && parent !== document.documentElement) {
      for (const type of mouseEventTypes) {
        parent.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
      }
      try { parent.click(); } catch { }
    }

    try { el.click(); } catch { }
  }

  function setChecked(el, desired) {
    if (el.checked === desired) return false;

    const root = el.getRootNode?.() || document;
    const lbl = el.closest('label') ||
      (el.id ? root.querySelector?.(`label[for="${CSS.escape(el.id)}"]`) : null) ||
      el.parentElement?.closest('label') ||
      (el.nextElementSibling?.tagName === 'LABEL' ? el.nextElementSibling : null);

    const parent = el.parentElement;

    try { el.focus({ preventScroll: true }); } catch { }

    if (el instanceof HTMLInputElement) {
      const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
      if (desc && desc.set) {
        try { desc.set.call(el, desired); } catch { el.checked = desired; }
      } else {
        el.checked = desired;
      }
    }

    const mouseEventTypes = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
    for (const type of mouseEventTypes) {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    }

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));

    if (lbl && lbl !== el) {
      for (const type of mouseEventTypes) {
        lbl.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
      }
      try { lbl.click(); } catch { }
    } else if (parent && parent !== document.body) {
      for (const type of mouseEventTypes) {
        parent.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
      }
      try { parent.click(); } catch { }
    }

    try { el.click(); } catch { }
    return true;
  }

  function selectOption(el, value) {
    const wanted = String(value).toLowerCase().trim();
    const match = [...el.options].find(
      (o) => o.value.toLowerCase() === wanted || o.text.toLowerCase().trim() === wanted
    );
    if (!match) return false;
    setValue(el, match.value);
    return true;
  }

  function selectRandom(el) {
    const usable = [...el.options].filter((o) => !o.disabled && o.value !== '');
    if (!usable.length) return false;
    if (el.multiple) {
      [...el.options].forEach((o) => (o.selected = false));
      rand(usable).selected = true;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    setValue(el, rand(usable).value);
    return true;
  }

  /* ------------------------------------------------------------------ *
   * 4. Highlight
   * ------------------------------------------------------------------ */

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes __ff_pulse {
        from { outline-color: ${SIGNAL}; box-shadow: 0 0 0 4px ${SIGNAL}33; }
        to   { outline-color: transparent; box-shadow: 0 0 0 4px transparent; }
      }
      .__ff_flash {
        outline: 2px solid ${SIGNAL} !important;
        outline-offset: 1px !important;
        animation: __ff_pulse 900ms ease-out forwards !important;
      }
      @media (prefers-reduced-motion: reduce) {
        .__ff_flash { animation: none !important; }
      }`;
    (document.head || document.documentElement).appendChild(style);
  }

  function flash(el) {
    const target = (el.type === 'radio' || el.type === 'checkbox' || el.type === 'file')
      ? (el.closest('.dropzone, [class*="dropzone"], [class*="upload"], [class*="dropArea"], [class*="drop-area"], label') || el.parentElement || el)
      : el;
    target.classList.add('__ff_flash');
    setTimeout(() => target.classList.remove('__ff_flash'), 950);
  }

  /* ------------------------------------------------------------------ *
   * 5. Collecting fields
   * ------------------------------------------------------------------ */

  const SKIP_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image']);

  function isFillable(el) {
    if (!el || el.disabled || el.readOnly) return false;
    const tag = el.tagName.toLowerCase();

    // Buttons and non-contenteditable divs are only fillable if they are comboboxes or datepicker triggers
    if (tag === 'button' || (tag === 'div' && !el.isContentEditable)) {
      if (isDatePickerTrigger(el) || isComboboxTrigger(el)) {
        if (el.getClientRects().length === 0) return false;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') return false;
        return true;
      }
      return false;
    }

    const type = (el.getAttribute('type') || '').toLowerCase();
    if (type === 'file') {
      const dropzone = el.closest('.dropzone, [class*="dropzone"], [class*="upload"], [class*="dropArea"], [class*="drop-area"], form, main, .form-item') || el.parentElement;
      if (dropzone && dropzone.getClientRects().length > 0) {
        const cs = getComputedStyle(dropzone);
        if (cs.display !== 'none' && cs.visibility !== 'hidden') return true;
      }
      return true;
    }
    if (SKIP_TYPES.has(type)) return false;
    if (el.getClientRects().length === 0) {
      if ((type === 'checkbox' || type === 'radio') && el.parentElement?.getClientRects().length > 0) {
        const cs = getComputedStyle(el);
        if (cs.display !== 'none' && cs.visibility !== 'hidden') return true;
      }
      return false;
    }
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    return true;
  }

  function collect(root = document, out = []) {
    const nodes = root.querySelectorAll?.(
      'input, select, textarea, [contenteditable="true"], button[role="combobox"], [role="combobox"], button[data-radix-select-trigger], button[data-radix-popover-trigger], button[aria-haspopup="dialog"], button[aria-haspopup="listbox"], button[data-state]'
    ) || [];
    for (const el of nodes) if (isFillable(el)) out.push(el);

    // Web components hide their inputs behind a shadow root.
    for (const el of root.querySelectorAll?.('*') || []) {
      if (el.shadowRoot) collect(el.shadowRoot, out);
    }
    return out;
  }

  function describe(el) {
    const type = guessType(el);
    const name = el.getAttribute('name') || el.id || el.getAttribute('data-testid') || '';
    let label = (type === 'radio' ? (getRadioGroupLabel(el) || labelText(el)) : labelText(el)) ||
      el.getAttribute('placeholder') || '';
    if (!label && (type === 'combobox' || isDatePickerTrigger(el))) {
      label = el.textContent.replace(/\s+/g, ' ').trim();
    }
    if (!label) label = name || '(tanpa label)';
    return { el, type, name, label };
  }

  /* ------------------------------------------------------------------ *
   * 6. JSON key matching
   * ------------------------------------------------------------------ */

  const normKey = (k) => String(k).toLowerCase().replace(/[^a-z0-9]/g, '');

  function flatten(obj, prefix = '', out = {}) {
    if (obj === null || typeof obj !== 'object') return out;
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      const isPrimitiveArray =
        Array.isArray(v) && v.every((x) => x === null || typeof x !== 'object');
      if (v !== null && typeof v === 'object' && !isPrimitiveArray) flatten(v, key, out);
      else out[key] = v;
    }
    return out;
  }

  /** Names a field could plausibly be addressed by in the JSON. */
  function keyCandidates(el) {
    const name = el.getAttribute('name') || '';
    const out = [name, el.id, el.getAttribute('data-testid'), labelText(el)];
    if (el.type === 'radio') {
      const gLabel = getRadioGroupLabel(el);
      if (gLabel) out.push(gLabel);
    }
    if (isComboboxTrigger(el)) {
      const btnText = el.textContent.replace(/\s+/g, ' ').trim();
      if (btnText) out.push(btnText);
    }
    // user[address][city] → city ; user.address.city → city
    const tail = name.split(/[[\].]+/).filter(Boolean).pop();
    if (tail) out.push(tail);
    return out.filter(Boolean);
  }

  function buildIndex(flat) {
    const exact = new Map();
    const tail = new Map();
    for (const key of Object.keys(flat)) {
      exact.set(normKey(key), key);
      const t = key.split(/[[\].]+/).filter(Boolean).pop();
      if (t && !tail.has(normKey(t))) tail.set(normKey(t), key);
    }
    return { exact, tail };
  }

  function findKey(el, index) {
    for (const cand of keyCandidates(el)) {
      const n = normKey(cand);
      if (index.exact.has(n)) return index.exact.get(n);
    }
    for (const cand of keyCandidates(el)) {
      const n = normKey(cand);
      if (index.tail.has(n)) return index.tail.get(n);
    }
    return null;
  }

  /* ------------------------------------------------------------------ *
   * 7. Public API
   * ------------------------------------------------------------------ */

  function scan(opts = {}) {
    const persona = makePersona(opts.locale || 'id');
    const fields = collect().map(describe);
    const seenRadio = new Set();

    return fields
      .filter((f) => {
        if (f.type !== 'radio') return true;
        const gKey = getRadioGroupKey(f.el);
        if (seenRadio.has(gKey)) return false;
        seenRadio.add(gKey);
        return true;
      })
      .map((f) => {
        let label = f.label;
        let key = f.name || normKey(f.label) || 'field';
        if (f.type === 'radio') {
          const groupLabel = getRadioGroupLabel(f.el);
          if (groupLabel) {
            label = groupLabel;
            key = f.name || normKey(groupLabel) || 'radio';
          }
        }
        return {
          key,
          label,
          type: f.type,
          sample: sampleFor(f, persona),
        };
      });
  }

  function sampleFor(f, persona) {
    if (f.type === 'checkbox') return true;
    if (f.type === 'combobox') return f.label || 'option';
    if (f.type === 'file') return 'sample_document.pdf';
    if (f.type === 'radio') {
      const group = getRadioGroup(f.el);
      const chosen = group[0];
      if (!chosen) return '';
      const v = chosen.value;
      if (v && v !== 'on') return v;
      return labelText(chosen) || 'option';
    }
    if (f.type === 'select') {
      const o = [...f.el.options].filter((x) => !x.disabled && x.value !== '')[0];
      return o ? o.value : '';
    }
    const gen = GEN[f.type] || GEN.word;
    return String(gen(persona, f.el));
  }

  async function fill(opts = {}) {
    const {
      mode = 'auto',
      data = {},
      locale = 'id',
      skipFilled = true,
      highlight = true,
    } = opts;

    ensureStyle();
    const persona = makePersona(locale);
    const flat = mode === 'json' ? flatten(data) : {};
    const index = buildIndex(flat);
    const usedKeys = new Set();
    const handledRadio = new Set();

    const result = { filled: 0, skipped: 0, invalid: 0, unmatched: [] };

    for (const el of collect()) {
      const f = describe(el);
      const isToggle = f.type === 'checkbox' || f.type === 'radio';

      if (skipFilled) {
        if (f.type === 'combobox') {
          if (!isComboboxPlaceholder(el)) {
            result.skipped++;
            continue;
          }
        } else if (isDatePickerTrigger(el)) {
          if (!isDatePickerPlaceholder(el)) {
            result.skipped++;
            continue;
          }
        } else if (f.type === 'file') {
          if (el.files && el.files.length > 0) {
            result.skipped++;
            continue;
          }
        } else if (f.type === 'number' || (el.getAttribute?.('type') || '').toLowerCase() === 'number') {
          if (el.value !== '' && el.value != null && el.value !== '0' && el.value !== 0) {
            result.skipped++;
            continue;
          }
        } else if (!isToggle && el.value !== '' && el.value != null) {
          result.skipped++;
          continue;
        }
      }

      let written = false;

      try {
        if (mode === 'json') {
          const key = findKey(el, index);
          if (key === null) {
            result.skipped++;
            continue;
          }
          usedKeys.add(key);
          written = await applyValue(el, f, flat[key], handledRadio);
        } else {
          written = await applyAuto(el, f, persona, handledRadio);
        }
      } catch (err) {
        console.warn('FormFiller: Error filling element', el, err);
        result.skipped++;
        continue;
      }

      if (!written) {
        result.skipped++;
        continue;
      }

      result.filled++;
      if (highlight) flash(el);
      if (typeof el.checkValidity === 'function' && !el.checkValidity()) result.invalid++;
    }

    if (mode === 'json') {
      result.unmatched = Object.keys(flat).filter((k) => !usedKeys.has(k));
    }
    return result;
  }

  async function applyValue(el, f, value, handledRadio) {
    if (isDatePickerTrigger(el)) {
      return await fillDatePicker(el, value);
    }

    if (f.type === 'combobox') {
      return await fillCombobox(el, value);
    }

    if (f.type === 'file') {
      return fillFileInput(el);
    }

    if (f.type === 'radio') {
      const gKey = getRadioGroupKey(el);
      if (handledRadio.has(gKey)) return false;
      handledRadio.add(gKey);
      const group = getRadioGroup(el);
      const wanted = String(value).toLowerCase().trim();
      const target =
        group.find((r) => r.value.toLowerCase() === wanted) ||
        group.find((r) => labelText(r).toLowerCase() === wanted) ||
        group.find((r) => labelText(r).toLowerCase().includes(wanted)) ||
        group.find((r) => wanted.includes(labelText(r).toLowerCase())) ||
        group[0];
      if (!target) return false;
      clickRadio(target);
      return true;
    }

    if (f.type === 'checkbox') {
      const desired = Array.isArray(value)
        ? value.map(String).includes(el.value)
        : Boolean(value);
      setChecked(el, desired);
      return true;
    }

    if (f.type === 'select') {
      if (el.multiple && Array.isArray(value)) {
        const wanted = value.map((v) => String(v).toLowerCase());
        [...el.options].forEach((o) => {
          o.selected = wanted.includes(o.value.toLowerCase()) ||
            wanted.includes(o.text.toLowerCase().trim());
        });
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return selectOption(el, value);
    }

    if (el.isContentEditable) {
      setEditable(el, String(value));
      return true;
    }

    el.focus({ preventScroll: true });
    setValue(el, String(value));
    el.blur();
    return true;
  }

  async function applyAuto(el, f, persona, handledRadio) {
    if (isDatePickerTrigger(el)) {
      return await fillDatePicker(el, null);
    }

    if (f.type === 'combobox') {
      return await fillCombobox(el, null);
    }

    if (f.type === 'file') {
      return fillFileInput(el);
    }

    if (f.type === 'radio') {
      const gKey = getRadioGroupKey(el);
      if (handledRadio.has(gKey)) return false;
      handledRadio.add(gKey);
      const group = getRadioGroup(el).filter((r) => !r.disabled);
      if (!group.length) return false;
      const target = rand(group);
      clickRadio(target);
      return true;
    }

    if (f.type === 'checkbox') {
      // Consent boxes almost always need to be on for the form to submit.
      const consent = /agree|terms|accept|consent|setuju|syarat|ketentuan|privacy/.test(
        signals(el)
      );
      setChecked(el, consent ? true : Math.random() > 0.4);
      return true;
    }

    if (f.type === 'select') return selectRandom(el);

    if (el.isContentEditable) {
      setEditable(el, GEN.message(persona, el));
      return true;
    }

    const gen = GEN[f.type] || GEN.word;
    let value = String(gen(persona, el));
    if (el.maxLength > 0 && value.length > el.maxLength) {
      value = value.slice(0, el.maxLength);
    }

    el.focus({ preventScroll: true });
    setValue(el, value);
    el.blur();
    return true;
  }

  function clear() {
    ensureStyle();
    let cleared = 0;
    for (const el of collect()) {
      const type = (el.getAttribute('type') || '').toLowerCase();
      if (type === 'radio') {
        if (el.checked) {
          el.checked = false;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new Event('input', { bubbles: true }));
          cleared++;
        }
      } else if (type === 'checkbox') {
        if (el.checked) {
          el.click();
          cleared++;
        }
      } else if (type === 'file') {
        if (el.files && el.files.length > 0) {
          el.value = '';
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new Event('input', { bubbles: true }));
          cleared++;
        }
      } else if (el.isContentEditable) {
        if (el.textContent !== '') {
          setEditable(el, '');
          cleared++;
        }
      } else if (el.value !== '') {
        setValue(el, '');
        cleared++;
      }
    }
    return { cleared };
  }

  window.__FORM_FILLER__ = { scan, fill, clear, version: '1.0.0' };
})();

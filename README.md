# Form Filler

Ekstensi Chrome (Manifest V3) untuk mengisi form saat testing — otomatis dengan data dummy, atau dari JSON milikmu sendiri.

## Pasang

1. Buka `chrome://extensions`
2. Nyalakan **Developer mode** (pojok kanan atas)
3. **Load unpacked** → pilih folder ini
4. Pin ikonnya, buka halaman berisi form, klik ikon

## Isi folder

| File | Isi |
|---|---|
| `manifest.json` | MV3, permission: `storage`, `activeTab`, `scripting` |
| `popup.html` | UI popup (CSS inline — MV3 melarang inline *script*, bukan inline *style*) |
| `popup.js` | State, validasi JSON, injeksi script, render hasil |
| `content.js` | Deteksi field, generator data, penulisan nilai ke DOM |
| `icons/` | Icon ekstensi 16/32/48/128 px, plus `icon.svg` sebagai sumber yang bisa diedit |

## Cara pakai

**Otomatis** — pilih gaya data (Indonesia / English), klik **Isi form**. Satu persona dipakai untuk seluruh form, jadi nama, email, dan username selalu konsisten.

**JSON** — tempel object, klik **Isi form**. Key dicocokkan berlapis:

1. persis ke `name`, `id`, `data-testid`, atau teks label
2. setelah dinormalisasi (huruf kecil, tanda baca dibuang) — `user.first_name` cocok dengan `user[first_name]`
3. ke segmen terakhir — `data.user.email` cocok dengan `email`

Object bersarang di-flatten otomatis. Key yang tidak ketemu pasangannya dilaporkan di bawah tombol.

**Scan** → **Ambil dari hasil scan** menghasilkan template JSON berisi seluruh field halaman lengkap dengan contoh nilainya. Ini cara tercepat bikin fixture untuk form yang belum kamu kenal.

Pintasan: `Ctrl`/`Cmd` + `Enter` di popup = Isi form.

## Catatan teknis

- **Framework-safe.** Nilai ditulis lewat native setter di prototype, bukan `el.value = x`, supaya value tracker React ikut ter-update dan `onChange` benar-benar terpanggil. Checkbox dan radio pakai `el.click()` karena itu memicu urutan event native yang lengkap.
- **Tanpa `content_scripts` di manifest.** `content.js` baru disuntikkan saat kamu menekan tombol, di bawah `activeTab`. Tidak ada host permission `<all_urls>`, jadi ekstensi tidak menyentuh halaman apa pun sebelum diminta.
- **Iframe.** Injeksi dicoba ke semua frame dulu; kalau ada frame lintas-origin yang menolak, otomatis mundur ke frame utama saja.
- **Shadow DOM** ditelusuri rekursif.
- **Validasi.** Setelah mengisi, tiap field dicek dengan `checkValidity()` dan yang gagal dihitung — biasanya karena ada atribut `pattern` yang lebih ketat dari generatornya.

## Batasan yang perlu diketahui

- **Dropdown custom & DatePicker/DateRangePicker** berbasis **shadcn/ui (Popover + Command / Calendar / react-day-picker)**, **Radix UI**, dan **Ant Design** didukung dengan simulasi buka popover & pemilihan item otomatis secara asinkron.
- **Upload File & Dropzone** didukung secara otomatis dengan membuat file dummy valid (PDF, PNG, JPG, CSV) berbasis memori (`DataTransfer`).
- Editor rich text berbasis canvas atau `contenteditable` kompleks (Quill, TipTap) hanya terisi teks polos.

## Menambah aturan deteksi

Semua di `content.js`:

- `RULES` — array `[tipe, regex]`, urutan berlaku, yang spesifik taruh di atas
- `GEN` — generator per tipe, terima `(persona, element)`
- `DATA` — daftar kata per locale

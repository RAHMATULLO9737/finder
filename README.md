# 🎁 Gift Finder — Django + React (buyurtma tizimi bilan to‘liq versiya)

Sovg‘a topish sayti. **Admin ham, oddiy foydalanuvchi ham saytning o‘zida** login qilib kiradi
(Django admin sahifasiga o‘tish shart emas).

- Backend: Django + Django REST Framework + SQLite (Token autentifikatsiya)
- Frontend: React + Vite + React Router + Axios

## ✨ Imkoniyatlar

**Hamma uchun (kirmasdan ham):**
- Bosh sahifa: kategoriyalar, ommabop sovg‘alar
- Katalog: qidiruv, kategoriya / narx / yosh / kim uchun filtrlari, saralash, sahifalash
- Sovg‘a sahifasi: batafsil ma’lumot, reyting, sharhlar, o‘xshash sovg‘alar
- **Sovg‘a topuvchi**: 3 ta savol (kim uchun, yosh, byudjet) → eng mos tavsiyalar
- Qorong‘i / yorug‘ mavzu

**🛒 Buyurtma berish (YANGI):**
- Savat: sovg‘a qo‘shish, soni o‘zgartirish, o‘chirish (savat brauzerda saqlanadi, sahifa yangilansa yo‘qolmaydi)
- “Hoziroq buyurtma berish” tugmasi, katalogda “Savatga qo‘shish”
- Bepul yetkazib berish chizig‘i (500 000 so‘mdan yuqori — bepul, aks holda 25 000 so‘m; sozlanadi)
- Buyurtmani rasmiylashtirish: ism, telefon, shahar, manzil, kuryer uchun izoh, **tabrik matni 💌**, to‘lov usuli
- Narxlar serverda qayta hisoblanadi (mijoz narxni o‘zgartira olmaydi)
- “Buyurtmalarim”: ro‘yxat, batafsil sahifa, holat yo‘li (Yangi → Tasdiqlandi → Yo‘lda → Yetkazildi), yangi buyurtmani bekor qilish

**Ro‘yxatdan o‘tgan foydalanuvchi:**
- Ro‘yxatdan o‘tish, kirish, chiqish
- Sevimlilar (har kimniki alohida), sharh va yulduzcha baho qoldirish
- Profil: ism/email tahrirlash, parolni o‘zgartirish

**Admin (saytning ichida: `/admin`):**
- **Buyurtmalar (YANGI):** holat bo‘yicha tablar, qidiruv (ism / telefon / manzil / #raqam), holatni bir bosishda o‘zgartirish,
  batafsil oyna (sovg‘alar, mijoz, tabrik matni), o‘chirish, **Excel (CSV) yuklab olish**,
  yangi buyurtma kelganda avtomatik xabar (har 20 soniyada tekshiradi) va yon menyuda qizil raqam
- Boshqaruv paneli: daromad, buyurtmalar soni, **7 kunlik savdo grafigi**, buyurtmalar holati, eng ko‘p sotilgan sovg‘alar,
  so‘nggi buyurtmalar, kategoriyalar grafigi, eng ko‘p yoqqan sovg‘alar
- Sovg‘alar: qo‘shish / tahrirlash / o‘chirish, **rasm yuklash** yoki URL, “Ommabop” belgisi
- Kategoriyalar: emoji bilan qo‘shish / tahrirlash / o‘chirish
- Foydalanuvchilar: admin qilish, bloklash, o‘chirish
- Sharhlar: nomaqbul sharhlarni o‘chirish

## 📋 Talablar
- Python 3.10+
- Node.js 18+ (20+ tavsiya etiladi)

## 🚀 Ishga tushirish (Windows PowerShell / VS Code terminal)

### 1) Backend (birinchi terminal)
```powershell
cd backend
py -m venv env
.\env\Scripts\Activate.ps1
# PowerShell bloklasa: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
pip install -r requirements.txt
py manage.py makemigrations gifts
py manage.py migrate
py manage.py seed_demo
py manage.py runserver
```
`seed_demo` demo kategoriyalar, 12 ta sovg‘a, test akkauntlari va **7 ta demo buyurtma** yaratadi (qayta ishga tushirsangiz ham xavfsiz).

> ♻️ **Avvalgi versiyadan yangilayotgan bo‘lsangiz:** ma’lumotlaringiz saqlanadi. Shunchaki `py manage.py makemigrations gifts`
> va `py manage.py migrate` ni bajaring — yangi buyurtma jadvallari qo‘shiladi. Keyin `py manage.py seed_demo` (ixtiyoriy).

### 2) Frontend (ikkinchi terminal)
```powershell
cd frontend
npm install
npm run dev
```
Brauzerda oching: **http://localhost:5173**

Ikkala terminal ham ishlab turishi kerak.

> macOS / Linux: `python3 -m venv env && source env/bin/activate`, qolgan buyruqlar bir xil (`py` o‘rniga `python3`).

## 🔑 Kirish ma’lumotlari (seed_demo yaratadi)

| Rol | Login | Parol |
|---|---|---|
| Admin | `admin` | `admin12345` |
| Foydalanuvchi | `user` | `user12345` |

Saytda **Kirish** tugmasini bosing. Admin kirsa avtomatik `/admin` paneliga o‘tadi, oddiy foydalanuvchi bosh sahifaga.
Yangi foydalanuvchilar **Ro‘yxatdan o‘tish** orqali o‘zlari akkaunt ochadi. Biror kishini admin qilish uchun:
admin paneli → **Foydalanuvchilar** → qalqon tugmasi.

⚠️ Saytga joylashdan oldin `admin12345` parolini albatta o‘zgartiring (Profil → Parolni o‘zgartirish).

Qo‘shimcha admin kerak bo‘lsa: `py manage.py createsuperuser`.
Django’ning o‘z paneli ham saqlangan: http://127.0.0.1:8000/admin/

## 🛍 Buyurtma jarayoni (qanday ishlaydi)

1. Mijoz sovg‘ani **Savatga qo‘shadi** (kirmasdan ham mumkin).
2. **Buyurtma berish** bosilganda tizimga kirish so‘raladi (savat saqlanib qoladi), so‘ng manzil va to‘lov usuli kiritiladi.
3. Buyurtma saqlanadi → mijoz “Buyurtmalarim” da kuzatadi.
4. **Admin** → `/admin/orders` da yangi buyurtmani ko‘radi, qo‘ng‘iroq qiladi va holatni o‘zgartiradi
   (Tasdiqlandi → Yo‘lda → Yetkazildi yoki Bekor qilindi). Mijoz o‘zgarishni darrov o‘z sahifasida ko‘radi.

### Sozlamalar (ixtiyoriy, muhit o‘zgaruvchilari)
| O‘zgaruvchi | Tavsif | Standart |
|---|---|---|
| `SHOP_DELIVERY_FEE` | Yetkazib berish narxi (so‘m) | `25000` |
| `SHOP_FREE_DELIVERY_FROM` | Shu summadan yuqori xaridda yetkazish bepul | `500000` |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Yangi buyurtma haqida Telegramga xabar | bo‘sh (o‘chiq) |

Telegram xabarini yoqish (PowerShell):
```powershell
$env:TELEGRAM_BOT_TOKEN="123456:ABC..."   # @BotFather dan oling
$env:TELEGRAM_CHAT_ID="123456789"         # @userinfobot orqali o'z ID ingizni biling
py manage.py runserver
```

## 🔌 API (qisqacha)

| Yo‘l | Tavsif |
|---|---|
| `POST /api/auth/register/`, `/login/`, `/logout/` | Ro‘yxatdan o‘tish, kirish, chiqish |
| `GET/PATCH /api/auth/me/`, `POST /api/auth/password/` | Profil, parol |
| `GET /api/gifts/`, `GET /api/gifts/<id>/` | Hamma uchun. Yozish — faqat admin |
| `GET /api/categories/` | Hamma uchun. Yozish — faqat admin |
| `GET /api/favorites/`, `POST /api/favorites/toggle/` | Faqat kirgan foydalanuvchi |
| `GET /api/reviews/?gift=<id>`, `POST /api/reviews/` | O‘qish hamma uchun, yozish — kirganlar |
| `GET /api/shop-config/` | Yetkazib berish sozlamalari (hamma uchun) |
| `GET/POST /api/orders/`, `GET /api/orders/<id>/`, `POST /api/orders/<id>/cancel/` | Foydalanuvchi faqat o‘z buyurtmalari |
| `GET /api/admin/orders/?status=new&search=...`, `PATCH /api/admin/orders/<id>/` (`{"status": "shipping"}`), `DELETE` | Faqat admin |
| `GET /api/admin/orders/counts/`, `GET /api/admin/orders/export/` | Holatlar soni, CSV yuklab olish (admin) |
| `GET /api/admin/stats/`, `/api/admin/users/` | Faqat admin |

Sovg‘alar filtri: `?search=soat&category=1&min_price=10000&max_price=500000&age=25&recipient=friend&ordering=-avg_rating&page=2`

## 🛠 Muammolar bo‘lsa

- **“Serverga ulanib bo‘lmadi”** — backend terminalida `runserver` ishlayotganini tekshiring.
- **`no such table` xatosi** — `makemigrations gifts` va `migrate` ni ishga tushiring (buyurtma jadvallari uchun ham shart).
- **Avval eski versiyani ishlatgan bo‘lsangiz** — modellar o‘zgargan. `backend/db.sqlite3` faylini va
  `backend/gifts/migrations/` ichidagi `0001_...py` kabi fayllarni (`__init__.py` qolsin) o‘chirib,
  yuqoridagi buyruqlarni qaytadan bajaring.
- **Port band** — `py manage.py runserver 8001` qiling va `frontend/.env` dagi `VITE_API_URL` ni
  `http://127.0.0.1:8001/api` ga o‘zgartiring (CORS faqat 5173 portga ruxsat beradi).
- **Rasm ko‘rinmasa** — sovg‘ada rasm bo‘lmasa, o‘rniga kategoriya emojili chiroyli fon chiqadi. Rasmni admin panelidan yuklang.

## 🌐 Internetga chiqarishdan oldin
`DEBUG=False`, haqiqiy `SECRET_KEY` (`DJANGO_SECRET_KEY` muhit o‘zgaruvchisi), `ALLOWED_HOSTS` va
`CORS_ALLOWED_ORIGINS` ni sozlang, rasmlar uchun media xotira (S3 va h.k.) va PostgreSQL ishlating,
frontendni `npm run build` bilan yig‘ing.

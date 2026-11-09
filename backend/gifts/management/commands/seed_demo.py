from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

import random
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from gifts.models import Category, Gift, Order, OrderItem

CATEGORIES = [
    ("Texnologiya", "💻", "Zamonaviy gadjetlar"),
    ("Kitoblar", "📚", "Kitob va kundaliklar"),
    ("Aksessuarlar", "⌚", "Chiroyli aksessuarlar"),
    ("Uy uchun", "🏠", "Uy va dekor buyumlari"),
    ("Go‘zallik", "💄", "Parvarish va go‘zallik"),
    ("O‘yinchoqlar", "🧸", "Bolalar uchun sovg‘alar"),
]

# (nomi, tavsif, narx, kategoriya, min_yosh, max_yosh, kim uchun, tanlangan)
GIFTS = [
    ("Simsiz quloqchin", "Shovqinni kamaytiradigan, 24 soat ishlaydigan quloqchin.", 450000, "Texnologiya", 14, 60, "friend", True),
    ("Aqlli soat", "Qadamlar, uyqu va yurak urishini kuzatadi.", 780000, "Texnologiya", 16, 65, "partner", True),
    ("Portativ kolonka", "Suv o‘tkazmaydigan, kuchli bass.", 320000, "Texnologiya", 12, 50, "sibling", False),
    ("Motivatsion kitoblar to‘plami", "Hayotni o‘zgartiruvchi 3 ta mashhur kitob.", 180000, "Kitoblar", 15, 80, "friend", True),
    ("Charm muqovali kundalik", "Qo‘lda tikilgan, premium qog‘oz.", 95000, "Kitoblar", 14, 70, "colleague", False),
    ("Kumush marjon", "Nafis dizayndagi kumush marjon.", 260000, "Aksessuarlar", 16, 70, "partner", True),
    ("Charm hamyon", "Haqiqiy charmdan, ixcham va chiroyli.", 210000, "Aksessuarlar", 18, 70, "father", False),
    ("Xushbo‘y sham to‘plami", "Lavanda va vanil hidli 4 ta sham.", 120000, "Uy uchun", 16, 90, "mother", True),
    ("Yumshoq pled", "Qishki oqshomlar uchun issiq va yumshoq.", 230000, "Uy uchun", 10, 90, "mother", False),
    ("Yuz parvarishi to‘plami", "Namlovchi krem, tonik va niqob.", 340000, "Go‘zallik", 16, 70, "mother", False),
    ("Katta ayiqcha", "80 sm li yumshoq o‘yinchoq ayiq.", 150000, "O‘yinchoqlar", 2, 14, "child", True),
    ("Konstruktor to‘plami", "500 dan ortiq detalli quriladigan shahar.", 280000, "O‘yinchoqlar", 6, 15, "child", False),
]


class Command(BaseCommand):
    help = "Demo kategoriyalar, sovg'alar va test foydalanuvchilarni yaratadi (qayta ishga tushirsa ham xavfsiz)."

    def handle(self, *args, **options):
        cats = {}
        for name, emoji, desc in CATEGORIES:
            cats[name], _ = Category.objects.get_or_create(
                name=name, defaults={"emoji": emoji, "description": desc})

        created = 0
        for name, desc, price, cat, lo, hi, rec, featured in GIFTS:
            _, was_created = Gift.objects.get_or_create(
                name=name,
                defaults={"description": desc, "price": price, "category": cats[cat],
                          "min_age": lo, "max_age": hi, "recipient": rec, "is_featured": featured})
            created += was_created

        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser("admin", "admin@example.com", "admin12345")
            self.stdout.write(self.style.SUCCESS("Admin yaratildi: admin / admin12345"))
        if not User.objects.filter(username="user").exists():
            User.objects.create_user("user", "user@example.com", "user12345", first_name="Test")
            self.stdout.write(self.style.SUCCESS("Oddiy foydalanuvchi yaratildi: user / user12345"))

        self.seed_orders()
        self.stdout.write(self.style.SUCCESS(f"Tayyor! Yangi sovg'alar: {created}"))

    def seed_orders(self):
        """Admin panel bo'sh ko'rinmasligi uchun bir nechta demo buyurtma (faqat buyurtmalar umuman yo'q bo'lsa)."""
        if Order.objects.exists():
            return
        user = User.objects.filter(username="user").first()
        gifts = list(Gift.objects.all())
        if not user or not gifts:
            return
        rnd = random.Random(7)
        people = [("Aziza Karimova", "+998 90 123 45 67", "Toshkent", "Chilonzor, 12-mavze, 5-uy"),
                  ("Jasur Aliyev", "+998 93 555 11 22", "Samarqand", "Registon ko‘chasi, 18"),
                  ("Madina Yusupova", "+998 97 700 80 90", "Buxoro", "Mustaqillik ko‘chasi, 44")]
        statuses = ["delivered", "delivered", "shipping", "confirmed", "new", "new", "cancelled"]
        for i, st in enumerate(statuses):
            name, phone, city, addr = people[i % len(people)]
            picked = rnd.sample(gifts, rnd.randint(1, 3))
            order = Order.objects.create(
                user=user, full_name=name, phone=phone, city=city, address=addr, status=st,
                payment_method=rnd.choice(["cash", "card"]),
                gift_message="Tug‘ilgan kuning bilan! 🎉" if i % 2 == 0 else "")
            subtotal = Decimal(0)
            for g in picked:
                qty = rnd.randint(1, 2)
                OrderItem.objects.create(order=order, gift=g, name=g.name, price=g.price, quantity=qty)
                subtotal += g.price * qty
            fee = Decimal(0) if subtotal >= 500000 else Decimal(25000)
            Order.objects.filter(pk=order.pk).update(
                delivery_fee=fee, total=subtotal + fee,
                created_at=timezone.now() - timedelta(days=len(statuses) - i - 1, hours=rnd.randint(0, 6)))
        self.stdout.write(self.style.SUCCESS("Demo buyurtmalar yaratildi"))

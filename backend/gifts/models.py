from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    emoji = models.CharField(max_length=8, default="🎁")
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Gift(models.Model):
    RECIPIENT_CHOICES = [
        ("any", "Har kimga"), ("mother", "Ona"), ("father", "Ota"),
        ("friend", "Do‘st"), ("partner", "Sevgan inson"), ("child", "Bola"),
        ("colleague", "Hamkasb"), ("sibling", "Aka-uka / opa-singil"),
    ]
    name = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    image = models.URLField(blank=True)  # tashqi rasm havolasi
    image_file = models.ImageField(upload_to="gifts/", blank=True, null=True)  # kompyuterdan yuklangan rasm
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="gifts")
    min_age = models.PositiveIntegerField(default=0)
    max_age = models.PositiveIntegerField(default=100)
    recipient = models.CharField(max_length=20, choices=RECIPIENT_CHOICES, default="any")
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites")
    gift = models.ForeignKey(Gift, on_delete=models.CASCADE, related_name="favorites")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "gift"], name="unique_user_gift_favorite")]

    def __str__(self):
        return f"{self.user} ❤ {self.gift}"


class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews")
    gift = models.ForeignKey(Gift, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [models.UniqueConstraint(fields=["user", "gift"], name="unique_user_gift_review")]

    def __str__(self):
        return f"{self.user} → {self.gift} ({self.rating}★)"


# ---------- Buyurtmalar ----------
class Order(models.Model):
    STATUS_CHOICES = [
        ("new", "Yangi"),
        ("confirmed", "Tasdiqlandi"),
        ("shipping", "Yo‘lda"),
        ("delivered", "Yetkazildi"),
        ("cancelled", "Bekor qilindi"),
    ]
    PAYMENT_CHOICES = [
        ("cash", "Naqd pul (qabul qilganda)"),
        ("card", "Karta orqali (qabul qilganda)"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
                             blank=True, related_name="orders")
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=30)
    city = models.CharField(max_length=80)
    address = models.CharField(max_length=300)
    note = models.CharField(max_length=500, blank=True)
    gift_message = models.CharField(max_length=300, blank=True)  # sovg'a bilan birga ketadigan tabrik matni
    payment_method = models.CharField(max_length=10, choices=PAYMENT_CHOICES, default="cash")
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="new", db_index=True)
    delivery_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=14, decimal_places=2, default=0)  # sovg'alar + yetkazib berish
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def number(self):
        return 1000 + self.pk

    @property
    def subtotal(self):
        return self.total - self.delivery_fee

    def __str__(self):
        return f"Buyurtma #{self.number} — {self.full_name}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    gift = models.ForeignKey(Gift, on_delete=models.SET_NULL, null=True, blank=True, related_name="order_items")
    name = models.CharField(max_length=180)  # buyurtma paytidagi nomi (sovg'a o'chirilsa ham qoladi)
    price = models.DecimalField(max_digits=12, decimal_places=2)  # buyurtma paytidagi narxi
    quantity = models.PositiveIntegerField(default=1)

    @property
    def subtotal(self):
        return self.price * self.quantity

    def __str__(self):
        return f"{self.name} × {self.quantity}"

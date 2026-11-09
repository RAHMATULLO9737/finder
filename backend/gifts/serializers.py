import re
from decimal import Decimal

from django.conf import settings
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Avg
from rest_framework import serializers

from .models import Category, Favorite, Gift, Order, OrderItem, Review


# ---------- Foydalanuvchi ----------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_staff"]
        read_only_fields = ["id", "username", "is_staff"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["username", "password", "email", "first_name"]
        extra_kwargs = {"email": {"required": False}, "first_name": {"required": False}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)  # is_staff doim False


class AdminUserSerializer(serializers.ModelSerializer):
    favorites_count = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "is_staff", "is_active",
                  "date_joined", "favorites_count", "reviews_count"]
        read_only_fields = ["id", "username", "email", "first_name", "date_joined"]

    def get_favorites_count(self, obj):
        return obj.favorites.count()

    def get_reviews_count(self, obj):
        return obj.reviews.count()


# ---------- Sovg'alar ----------
class CategorySerializer(serializers.ModelSerializer):
    gifts_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "emoji", "description", "gifts_count"]

    def get_gifts_count(self, obj):
        return obj.gifts.count()


class GiftSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_emoji = serializers.CharField(source="category.emoji", read_only=True)
    image_src = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    image_file = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Gift
        fields = ["id", "name", "description", "price", "image", "image_file", "image_src",
                  "category", "category_name", "category_emoji", "min_age", "max_age",
                  "recipient", "is_featured", "avg_rating", "reviews_count", "created_at"]

    def get_image_src(self, obj):
        if obj.image_file:
            request = self.context.get("request")
            url = obj.image_file.url
            return request.build_absolute_uri(url) if request else url
        return obj.image or ""

    def get_avg_rating(self, obj):
        value = getattr(obj, "avg_rating", None)
        if value is None and not hasattr(obj, "avg_rating"):
            value = obj.reviews.aggregate(a=Avg("rating"))["a"]
        return round(value, 1) if value else None

    def get_reviews_count(self, obj):
        value = getattr(obj, "reviews_count", None)
        return value if value is not None else obj.reviews.count()

    def validate(self, attrs):
        min_age = attrs.get("min_age", getattr(self.instance, "min_age", 0))
        max_age = attrs.get("max_age", getattr(self.instance, "max_age", 100))
        if max_age < min_age:
            raise serializers.ValidationError("Maksimal yosh minimal yoshdan kichik bo‘lmasligi kerak.")
        return attrs


class FavoriteSerializer(serializers.ModelSerializer):
    gift_details = GiftSerializer(source="gift", read_only=True)

    class Meta:
        model = Favorite
        fields = ["id", "gift", "gift_details", "created_at"]


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)
    gift_name = serializers.CharField(source="gift.name", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "gift", "gift_name", "user", "user_name", "rating", "comment", "created_at"]
        read_only_fields = ["id", "user", "created_at"]
        # (user, gift) juftligi bir marta: yangilashni view o'zi hal qiladi
        validators = []


# ---------- Buyurtmalar ----------
def delivery_fee_for(subtotal):
    """Yetkazib berish narxi: belgilangan summadan yuqori bo'lsa bepul."""
    if subtotal >= settings.SHOP_FREE_DELIVERY_FROM:
        return Decimal(0)
    return Decimal(settings.SHOP_DELIVERY_FEE)


def _abs_image(obj_gift, request):
    if not obj_gift:
        return ""
    if obj_gift.image_file:
        url = obj_gift.image_file.url
        return request.build_absolute_uri(url) if request else url
    return obj_gift.image or ""


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    image_src = serializers.SerializerMethodField()
    category_emoji = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "gift", "name", "price", "quantity", "subtotal", "image_src", "category_emoji"]

    def get_image_src(self, obj):
        return _abs_image(obj.gift, self.context.get("request"))

    def get_category_emoji(self, obj):
        return obj.gift.category.emoji if obj.gift_id else "🎁"


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    number = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    payment_label = serializers.CharField(source="get_payment_method_display", read_only=True)
    user_name = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ["id", "number", "user", "user_name", "full_name", "phone", "city", "address", "note",
                  "gift_message", "payment_method", "payment_label", "status", "status_label",
                  "subtotal", "delivery_fee", "total", "items", "items_count", "created_at", "updated_at"]
        read_only_fields = fields

    def get_user_name(self, obj):
        return obj.user.username if obj.user_id else "—"

    def get_items_count(self, obj):
        return sum(i.quantity for i in obj.items.all())


class AdminOrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["status"]


class OrderItemInputSerializer(serializers.Serializer):
    gift = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=50)


class OrderCreateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    phone = serializers.CharField(max_length=30)
    city = serializers.CharField(max_length=80)
    address = serializers.CharField(max_length=300)
    note = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
    gift_message = serializers.CharField(max_length=300, required=False, allow_blank=True, default="")
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_CHOICES, default="cash")
    items = OrderItemInputSerializer(many=True, allow_empty=False)

    def validate_phone(self, value):
        digits = re.sub(r"\D", "", value)
        if not 9 <= len(digits) <= 15:
            raise serializers.ValidationError("Telefon raqamini to‘g‘ri kiriting. Masalan: +998 90 123 45 67")
        return value.strip()

    def create(self, validated_data):
        request = self.context["request"]
        items = validated_data.pop("items")

        merged = {}  # bir xil sovg'a ikki marta kelsa, qo'shib yuboramiz
        for it in items:
            merged[it["gift"]] = min(50, merged.get(it["gift"], 0) + it["quantity"])

        gifts = Gift.objects.in_bulk(list(merged))
        if len(gifts) != len(merged):
            raise serializers.ValidationError(
                {"items": "Savatdagi ba’zi sovg‘alar endi mavjud emas. Savatni yangilab, qayta urinib ko‘ring."})

        subtotal = sum((gifts[gid].price * qty for gid, qty in merged.items()), Decimal(0))
        fee = delivery_fee_for(subtotal)

        with transaction.atomic():
            order = Order.objects.create(user=request.user, delivery_fee=fee, total=subtotal + fee, **validated_data)
            OrderItem.objects.bulk_create([
                OrderItem(order=order, gift=gifts[gid], name=gifts[gid].name, price=gifts[gid].price, quantity=qty)
                for gid, qty in merged.items()
            ])
        return order

import csv
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Avg, Count, F, Q, Sum
from django.db.models.deletion import ProtectedError
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import filters, mixins, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from .models import Category, Favorite, Gift, Order, OrderItem, Review
from .notifications import notify_new_order
from .permissions import IsStaffOrReadOnly
from .serializers import (AdminOrderStatusSerializer, AdminUserSerializer, CategorySerializer,
                          FavoriteSerializer, GiftSerializer, OrderCreateSerializer, OrderSerializer,
                          RegisterSerializer, ReviewSerializer, UserSerializer)


# ---------- Auth ----------
def auth_payload(user):
    token, _ = Token.objects.get_or_create(user=user)
    return {"token": token.key, "user": UserSerializer(user).data}


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(auth_payload(user), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    user = authenticate(
        username=(request.data.get("username") or "").strip(),
        password=request.data.get("password") or "",
    )
    if user is None:
        return Response({"detail": "Login yoki parol noto‘g‘ri."}, status=status.HTTP_400_BAD_REQUEST)
    return Response(auth_payload(user))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == "PATCH":
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
    return Response(UserSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    old = request.data.get("old_password") or ""
    new = request.data.get("new_password") or ""
    if not request.user.check_password(old):
        return Response({"detail": "Eski parol noto‘g‘ri."}, status=status.HTTP_400_BAD_REQUEST)
    if len(new) < 6:
        return Response({"detail": "Yangi parol kamida 6 ta belgidan iborat bo‘lsin."},
                        status=status.HTTP_400_BAD_REQUEST)
    request.user.set_password(new)
    request.user.save()
    Token.objects.filter(user=request.user).delete()
    return Response(auth_payload(request.user))


# ---------- Sovg'alar ----------
class GiftViewSet(viewsets.ModelViewSet):
    serializer_class = GiftSerializer
    permission_classes = [IsStaffOrReadOnly]
    search_fields = ["name", "description", "category__name"]
    ordering_fields = ["price", "created_at", "name", "avg_rating"]

    def get_queryset(self):
        qs = (Gift.objects.select_related("category")
              .annotate(avg_rating=Avg("reviews__rating"), reviews_count=Count("reviews", distinct=True))
              .order_by("-created_at"))
        params = self.request.query_params
        if params.get("category"):
            qs = qs.filter(category_id=params["category"])
        if params.get("min_price"):
            qs = qs.filter(price__gte=params["min_price"])
        if params.get("max_price"):
            qs = qs.filter(price__lte=params["max_price"])
        if params.get("age"):
            try:
                age = int(params["age"])
                qs = qs.filter(min_age__lte=age, max_age__gte=age)
            except ValueError:
                pass
        if params.get("recipient") and params["recipient"] != "any":
            qs = qs.filter(Q(recipient=params["recipient"]) | Q(recipient="any"))
        if params.get("featured") in ("1", "true"):
            qs = qs.filter(is_featured=True)
        return qs


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer
    permission_classes = [IsStaffOrReadOnly]
    pagination_class = None
    search_fields = ["name"]

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response({"detail": "Bu kategoriyada sovg‘alar bor. Avval ularni boshqa kategoriyaga o‘tkazing yoki o‘chiring."},
                            status=status.HTTP_400_BAD_REQUEST)


# ---------- Sevimlilar (har bir foydalanuvchiniki alohida) ----------
class FavoriteViewSet(mixins.ListModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return (Favorite.objects.filter(user=self.request.user)
                .select_related("gift", "gift__category").order_by("-created_at"))

    @action(detail=False, methods=["post"])
    def toggle(self, request):
        try:
            gift = Gift.objects.get(pk=request.data.get("gift"))
        except (Gift.DoesNotExist, ValueError, TypeError):
            return Response({"detail": "Sovg‘a topilmadi."}, status=status.HTTP_404_NOT_FOUND)
        fav, created = Favorite.objects.get_or_create(user=request.user, gift=gift)
        if not created:
            fav.delete()
        return Response({"favorite": created})


# ---------- Sharhlar ----------
class ReviewViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin,
                    viewsets.GenericViewSet):
    serializer_class = ReviewSerializer
    pagination_class = None

    def get_permissions(self):
        if self.action == "list":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Review.objects.select_related("user", "gift").order_by("-created_at")
        if self.request.query_params.get("gift"):
            qs = qs.filter(gift_id=self.request.query_params["gift"])
        if self.action == "destroy" and not self.request.user.is_staff:
            qs = qs.filter(user=self.request.user)  # oddiy foydalanuvchi faqat o'zinikini o'chiradi
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        review, _ = Review.objects.update_or_create(
            user=request.user, gift=data["gift"],
            defaults={"rating": data["rating"], "comment": data.get("comment", "")},
        )
        return Response(self.get_serializer(review).data, status=status.HTTP_201_CREATED)


# ---------- Admin panel API ----------
class AdminUserViewSet(mixins.ListModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin,
                       viewsets.GenericViewSet):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None
    http_method_names = ["get", "patch", "delete", "head", "options"]
    search_fields = ["username", "email", "first_name"]

    def update(self, request, *args, **kwargs):
        if self.get_object().pk == request.user.pk:
            return Response({"detail": "O‘zingizning huquqlaringizni o‘zgartira olmaysiz."},
                            status=status.HTTP_400_BAD_REQUEST)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if self.get_object().pk == request.user.pk:
            return Response({"detail": "O‘zingizni o‘chira olmaysiz."}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)


def _orders_qs():
    return Order.objects.select_related("user").prefetch_related("items__gift__category")


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_stats(request):
    top = (Gift.objects.annotate(fav=Count("favorites", distinct=True))
           .filter(fav__gt=0).order_by("-fav")[:5])
    by_category = Category.objects.annotate(total=Count("gifts")).order_by("-total")

    # --- Buyurtmalar statistikasi ---
    valid_orders = Order.objects.exclude(status="cancelled")
    revenue = valid_orders.aggregate(s=Sum("total"))["s"] or 0
    by_status = {code: 0 for code, _ in Order.STATUS_CHOICES}
    for row in Order.objects.values("status").annotate(n=Count("id")):
        by_status[row["status"]] = row["n"]

    today = timezone.localdate()
    days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    since = timezone.now() - timedelta(days=8)
    sales = {d: {"orders": 0, "revenue": 0} for d in days}
    for o in valid_orders.filter(created_at__gte=since):
        d = timezone.localtime(o.created_at).date()
        if d in sales:
            sales[d]["orders"] += 1
            sales[d]["revenue"] += float(o.total)

    best_sellers = (OrderItem.objects.exclude(order__status="cancelled").exclude(gift__isnull=True)
                    .values("gift_id", "name").annotate(sold=Sum("quantity"))
                    .order_by("-sold")[:5])

    return Response({
        "gifts": Gift.objects.count(),
        "categories": Category.objects.count(),
        "users": User.objects.count(),
        "reviews": Review.objects.count(),
        "favorites": Favorite.objects.count(),
        "orders": Order.objects.count(),
        "new_orders": by_status["new"],
        "revenue": revenue,
        "orders_by_status": by_status,
        "sales_week": [{"date": d.isoformat(), "orders": v["orders"], "revenue": v["revenue"]}
                       for d, v in sales.items()],
        "best_sellers": [{"id": b["gift_id"], "name": b["name"], "sold": b["sold"]} for b in best_sellers],
        "recent_orders": OrderSerializer(_orders_qs()[:5], many=True, context={"request": request}).data,
        "top_gifts": [{"id": g.id, "name": g.name, "favorites": g.fav} for g in top],
        "by_category": [{"id": c.id, "name": c.name, "emoji": c.emoji, "total": c.total} for c in by_category],
        "recent_users": AdminUserSerializer(User.objects.order_by("-date_joined")[:5], many=True).data,
    })


# ---------- Buyurtmalar (foydalanuvchi) ----------
@api_view(["GET"])
@permission_classes([AllowAny])
def shop_config(request):
    """Yetkazib berish sozlamalari (savat va to'lov sahifasi uchun)."""
    return Response({
        "delivery_fee": settings.SHOP_DELIVERY_FEE,
        "free_delivery_from": settings.SHOP_FREE_DELIVERY_FROM,
    })


class OrderViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin,
                   viewsets.GenericViewSet):
    """Foydalanuvchi faqat o'z buyurtmalarini ko'radi va yangisini beradi."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    filter_backends = []

    def get_queryset(self):
        return _orders_qs().filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        notify_new_order(order)
        data = OrderSerializer(_orders_qs().get(pk=order.pk), context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status != "new":
            return Response({"detail": "Faqat yangi buyurtmani bekor qilish mumkin. Iltimos, admin bilan bog‘laning."},
                            status=status.HTTP_400_BAD_REQUEST)
        order.status = "cancelled"
        order.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(order).data)


# ---------- Buyurtmalar (admin) ----------
class AdminOrderViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin,
                        mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "total", "status"]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        return AdminOrderStatusSerializer if self.action == "partial_update" else OrderSerializer

    def get_queryset(self):
        qs = _orders_qs().order_by("-created_at")
        params = self.request.query_params
        if params.get("status") in dict(Order.STATUS_CHOICES):
            qs = qs.filter(status=params["status"])
        q = (params.get("search") or "").strip().lstrip("#")
        if q:
            cond = (Q(full_name__icontains=q) | Q(phone__icontains=q) | Q(address__icontains=q)
                    | Q(user__username__icontains=q))
            if q.isdigit() and len(q) <= 8:
                cond |= Q(id=int(q) - 1000)  # #1005 -> id 5
            qs = qs.filter(cond)
        return qs

    def partial_update(self, request, *args, **kwargs):
        order = self.get_object()
        serializer = AdminOrderStatusSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OrderSerializer(_orders_qs().get(pk=order.pk), context={"request": request}).data)

    @action(detail=False, methods=["get"])
    def counts(self, request):
        data = {code: 0 for code, _ in Order.STATUS_CHOICES}
        for row in Order.objects.values("status").annotate(n=Count("id")):
            data[row["status"]] = row["n"]
        data["all"] = sum(data.values())
        return Response(data)

    @action(detail=False, methods=["get"])
    def export(self, request):
        """Buyurtmalarni Excel'da ochiladigan CSV fayl sifatida yuklab olish."""
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="buyurtmalar.csv"'
        response.write("\ufeff")  # Excel kirill/o'zbek harflarini to'g'ri ochishi uchun
        writer = csv.writer(response)
        writer.writerow(["Raqam", "Sana", "Mijoz", "Telefon", "Shahar", "Manzil", "Sovg‘alar",
                         "Yetkazish", "Jami (so‘m)", "To‘lov", "Holat", "Izoh", "Tabrik matni"])
        for o in self.filter_queryset(self.get_queryset()):
            items = "; ".join(f"{i.name} x{i.quantity}" for i in o.items.all())
            writer.writerow([o.number, timezone.localtime(o.created_at).strftime("%Y-%m-%d %H:%M"),
                             o.full_name, o.phone, o.city, o.address, items, int(o.delivery_fee),
                             int(o.total), o.get_payment_method_display(), o.get_status_display(),
                             o.note, o.gift_message])
        return response


@api_view(["GET"])
def health(request):
    return Response({"status": "ok", "message": "Gift Finder API ishlayapti"})

from django.contrib import admin

from .models import Category, Favorite, Gift, Order, OrderItem, Review


@admin.register(Gift)
class GiftAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "recipient", "min_age", "max_age", "is_featured")
    list_filter = ("category", "recipient", "is_featured")
    search_fields = ("name", "description")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("emoji", "name")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("gift", "user", "rating", "created_at")
    list_filter = ("rating",)


admin.site.register(Favorite)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "phone", "total", "status", "created_at")
    list_filter = ("status", "payment_method")
    search_fields = ("full_name", "phone", "address")
    inlines = [OrderItemInline]

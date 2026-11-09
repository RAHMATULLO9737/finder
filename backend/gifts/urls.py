from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("gifts", views.GiftViewSet, basename="gift")
router.register("categories", views.CategoryViewSet, basename="category")
router.register("favorites", views.FavoriteViewSet, basename="favorite")
router.register("reviews", views.ReviewViewSet, basename="review")
router.register("admin/users", views.AdminUserViewSet, basename="admin-user")
router.register("admin/orders", views.AdminOrderViewSet, basename="admin-order")
router.register("orders", views.OrderViewSet, basename="order")

urlpatterns = [
    path("health/", views.health),
    path("auth/register/", views.register),
    path("auth/login/", views.login),
    path("auth/logout/", views.logout),
    path("auth/me/", views.me),
    path("auth/password/", views.change_password),
    path("admin/stats/", views.admin_stats),
    path("shop-config/", views.shop_config),
    path("", include(router.urls)),
]

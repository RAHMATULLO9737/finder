"""Yangi buyurtma haqida Telegram orqali xabar yuborish (ixtiyoriy).

Yoqish uchun muhit o'zgaruvchilarini qo'ying:
    TELEGRAM_BOT_TOKEN=123456:ABC...   (@BotFather beradi)
    TELEGRAM_CHAT_ID=123456789         (o'zingizning yoki guruh chat ID)
Sozlanmagan bo'lsa — hech narsa qilmaydi, sayt odatdagidek ishlaydi.
"""
import json
import threading
import urllib.request

from django.conf import settings


def _send(text):
    try:
        data = json.dumps({"chat_id": settings.TELEGRAM_CHAT_ID, "text": text}).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage",
            data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=8).read()
    except Exception:
        pass  # xabar yuborilmasa ham buyurtma saqlanib qolaveradi


def notify_new_order(order):
    if not (settings.TELEGRAM_BOT_TOKEN and settings.TELEGRAM_CHAT_ID):
        return
    lines = [f"🎁 Yangi buyurtma #{order.number}", f"👤 {order.full_name}  📞 {order.phone}",
             f"📍 {order.city}, {order.address}", ""]
    for it in order.items.all():
        lines.append(f"• {it.name} × {it.quantity} — {int(it.subtotal):,} so'm".replace(",", " "))
    lines += ["", f"💰 Jami: {int(order.total):,} so'm".replace(",", " "),
              f"💳 {order.get_payment_method_display()}"]
    if order.gift_message:
        lines.append(f"💌 Tabrik: {order.gift_message}")
    if order.note:
        lines.append(f"📝 Izoh: {order.note}")
    threading.Thread(target=_send, args=("\n".join(lines),), daemon=True).start()

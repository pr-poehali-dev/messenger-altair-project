"""
Аутентификация ALTAIR: отправка OTP-кода и верификация.
Код: 4 цифры + 3 строчные буквы + 1 заглавная буква (перемешаны).
Роутинг через поле action в теле запроса: "send" или "verify".
"""
import json
import os
import random
import string
import secrets
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p9035596_messenger_altair_pro")

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
    "Content-Type": "application/json",
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def generate_otp() -> str:
    digits = "".join(random.choices(string.digits, k=4))
    lower = "".join(random.choices(string.ascii_lowercase, k=3))
    upper = random.choice(string.ascii_uppercase)
    chars = list(digits + lower + upper)
    random.shuffle(chars)
    return "".join(chars)


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    action = body.get("action", "")

    # action=send — отправить OTP
    if method == "POST" and action == "send":
        phone = body.get("phone", "").strip()
        if not phone:
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Укажите номер телефона"})}

        code = generate_otp()
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.otp_codes (phone, code) VALUES (%s, %s)",
            (phone, code)
        )
        conn.commit()
        cur.close()
        conn.close()

        # В продакшене — SMS-провайдер (СМСПРОСТО, SMSAERO и т.д.)
        # Сейчас возвращаем код в ответе для демо-режима
        return {
            "statusCode": 200,
            "headers": HEADERS,
            "body": json.dumps({"ok": True, "demo_code": code, "message": f"Код отправлен на {phone}"}),
        }

    # action=verify — проверить OTP, создать/войти в аккаунт
    if method == "POST" and action == "verify":
        phone = body.get("phone", "").strip()
        code = body.get("code", "").strip()
        name = body.get("name", "").strip() or "Пользователь"

        if not phone or not code:
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Укажите телефон и код"})}

        conn = get_db()
        cur = conn.cursor()

        cur.execute(
            f"""SELECT id FROM {SCHEMA}.otp_codes
                WHERE phone = %s AND code = %s AND used = FALSE AND expires_at > NOW()
                ORDER BY created_at DESC LIMIT 1""",
            (phone, code)
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Неверный или просроченный код"})}

        otp_id = row[0]
        cur.execute(f"UPDATE {SCHEMA}.otp_codes SET used = TRUE WHERE id = %s", (otp_id,))

        cur.execute(f"SELECT id, name, status, avatar_url, session_token FROM {SCHEMA}.users WHERE phone = %s", (phone,))
        user = cur.fetchone()

        if user:
            user_id, uname, ustatus, uavatar, utoken = user
            if not utoken:
                utoken = secrets.token_hex(32)
                cur.execute(f"UPDATE {SCHEMA}.users SET session_token = %s, last_seen = NOW() WHERE id = %s", (utoken, user_id))
            else:
                cur.execute(f"UPDATE {SCHEMA}.users SET last_seen = NOW() WHERE id = %s", (user_id,))
        else:
            utoken = secrets.token_hex(32)
            cur.execute(
                f"""INSERT INTO {SCHEMA}.users (phone, name, session_token)
                    VALUES (%s, %s, %s) RETURNING id, name, status, avatar_url""",
                (phone, name, utoken)
            )
            row2 = cur.fetchone()
            user_id, uname, ustatus, uavatar = row2

        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": HEADERS,
            "body": json.dumps({
                "ok": True,
                "token": utoken,
                "user": {
                    "id": user_id,
                    "phone": phone,
                    "name": uname,
                    "status": ustatus,
                    "avatar_url": uavatar,
                },
            }),
        }

    return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Укажите action: send или verify"})}

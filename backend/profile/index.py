"""
Профиль пользователя ALTAIR: обновление имени, статуса, аватара, истории.
"""
import json
import os
import base64
import uuid
import psycopg2
import boto3

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p9035596_messenger_altair_pro")

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
    "Content-Type": "application/json",
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user(cur, token):
    cur.execute(f"SELECT id, name, status, avatar_url, phone FROM {SCHEMA}.users WHERE session_token = %s", (token,))
    return cur.fetchone()


def upload_image(data_b64: str, prefix: str) -> str:
    data = base64.b64decode(data_b64)
    key = f"{prefix}/{uuid.uuid4().hex}.jpg"
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    s3.put_object(Bucket="files", Key=key, Body=data, ContentType="image/jpeg")
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/files/{key}"


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    token = event.get("headers", {}).get("X-Session-Token", "")
    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    conn = get_db()
    cur = conn.cursor()

    if not token:
        cur.close(); conn.close()
        return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Требуется авторизация"})}

    user = get_user(cur, token)
    if not user:
        cur.close(); conn.close()
        return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Неверный токен"})}

    user_id, uname, ustatus, uavatar, uphone = user

    # GET / — получить профиль
    if method == "GET":
        cur.execute(
            f"""SELECT id, image_url, caption, created_at FROM {SCHEMA}.stories
                WHERE user_id = %s AND expires_at > NOW() ORDER BY created_at DESC""",
            (user_id,)
        )
        stories = [{"id": r[0], "image_url": r[1], "caption": r[2], "created_at": str(r[3])} for r in cur.fetchall()]
        cur.close(); conn.close()
        return {
            "statusCode": 200,
            "headers": HEADERS,
            "body": json.dumps({"user": {"id": user_id, "name": uname, "status": ustatus, "avatar_url": uavatar, "phone": uphone}, "stories": stories}),
        }

    # POST /update — обновить имя/статус/аватар
    if method == "POST" and path.endswith("/update"):
        updates = []
        params = []
        if "name" in body and body["name"].strip():
            updates.append("name = %s"); params.append(body["name"].strip())
        if "status" in body:
            updates.append("status = %s"); params.append(body["status"])
        if "avatar_b64" in body and body["avatar_b64"]:
            url = upload_image(body["avatar_b64"], "avatars")
            updates.append("avatar_url = %s"); params.append(url)
        if updates:
            params.append(user_id)
            cur.execute(f"UPDATE {SCHEMA}.users SET {', '.join(updates)} WHERE id = %s", params)
            conn.commit()
        cur.execute(f"SELECT id, name, status, avatar_url, phone FROM {SCHEMA}.users WHERE id = %s", (user_id,))
        u = cur.fetchone()
        cur.close(); conn.close()
        return {
            "statusCode": 200,
            "headers": HEADERS,
            "body": json.dumps({"ok": True, "user": {"id": u[0], "name": u[1], "status": u[2], "avatar_url": u[3], "phone": u[4]}}),
        }

    # POST /story — добавить историю
    if method == "POST" and path.endswith("/story"):
        img_b64 = body.get("image_b64", "")
        caption = body.get("caption", "")
        if not img_b64:
            cur.close(); conn.close()
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Нет изображения"})}
        url = upload_image(img_b64, "stories")
        cur.execute(
            f"INSERT INTO {SCHEMA}.stories (user_id, image_url, caption) VALUES (%s, %s, %s) RETURNING id",
            (user_id, url, caption)
        )
        story_id = cur.fetchone()[0]
        conn.commit()
        cur.close(); conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True, "story_id": story_id, "url": url})}

    cur.close(); conn.close()
    return {"statusCode": 404, "headers": HEADERS, "body": json.dumps({"error": "Not found"})}

# Maestro Recargas (con servidor)
1. Telegram: habla con @BotFather, crea un bot y copia el TOKEN. Escríbele "hola" a tu bot y abre
   https://api.telegram.org/bot<TOKEN>/getUpdates para sacar tu chat id.
2. Variables: ADMIN_PASS (tu contraseña), TG_TOKEN, TG_CHAT. Opcional: NICK_API_URL, DATA_DIR.
3. Local: `ADMIN_PASS=clave TG_TOKEN=... TG_CHAT=... node server.js` -> http://localhost:3000
   Admin: /admin   (contraseña = ADMIN_PASS)
4. Online gratis: sube esta carpeta a GitHub y despliégala en Render (Web Service, Node, start: node server.js).
   El disco gratis se borra al reiniciar: los avisos de Telegram quedan como registro permanente.

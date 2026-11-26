# Tutorial 04 · Probar sin internet

El modo sin internet es lo más importante de la demo y lo más fácil de romper sin darse cuenta. Pruébalo después de cada cambio en el test.

## En la computadora (Chrome o Edge)

1. Compila y levanta el build de producción. **Con `pnpm dev` no funciona**: el service worker está apagado.
   ```bash
   pnpm build
   pnpm start
   ```
2. Abre `http://localhost:3000` y espera unos segundos.
3. F12 → pestaña **Application**:
   - *Service workers*: debe haber uno activo para `localhost:3000`.
   - *Cache storage*: busca entradas para `/`, `/test` y `/sin-conexion`.
4. En **Network**, marca **Offline** (o en *Application → Service workers*, marca *Offline*).
5. Recarga `/test`. Debe cargar igual.
6. Haz un test completo y ve a **Mis resultados**. Debe decir *"Por enviar cuando haya señal: 1"*.
7. En *Application → IndexedDB → tamizaje-mercurio*, mira las tablas `bandeja` e `historial`.
8. Desmarca **Offline**. En unos segundos, *Mis resultados* dice *"Todo enviado, sin nombre"* y la `bandeja` queda vacía.

> El navegador conserva el service worker entre pruebas. Si cambiaste algo y no lo ves, en *Application → Service workers* usa **Unregister**, o en *Storage* usa **Clear site data**, y recarga.

## En el celular (lo que pide el plan antes de avanzar)

1. Abre https://cuida-tu-salud-mercurio.netlify.app con Wi-Fi o datos.
2. Espera unos segundos. Si el navegador ofrece **Instalar app** o **Agregar a pantalla de inicio**, acéptalo.
3. Activa el **modo avión**.
4. Abre la app (o recarga la página). Debe cargar.
5. Haz un test completo y revisa el resultado y *Mis resultados*.
6. Quita el modo avión y vuelve a *Mis resultados*: *"Todo enviado, sin nombre"*.
7. Confirma que llegó a la base:
   ```bash
   npx prisma studio
   ```
   Tabla `evaluacion`: tu test, con `origen = AUTO`.

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| Sin internet aparece "Estás sin internet" en vez del test | Abriste una ruta no guardada, o la primera visita no terminó de guardar la caché. Abre la app con señal, espera y repite |
| Sin internet, error del navegador "Sin conexión" | No hay service worker: estabas en `pnpm dev`, o el sitio no es HTTPS (los service workers solo funcionan en HTTPS o `localhost`) |
| Nunca pasa a "Todo enviado" | Revisa en *Network* la respuesta de `lote`. Un 400 es un error de formato; un 500, un problema de base o del servidor |
| Cambié el código y el celular muestra lo viejo | El service worker sirve la versión guardada. Con señal, abre la app y espera: baja la nueva sola (`skipWaiting`). Si no, borra los datos del sitio |

## Prueba automática

Durante el desarrollo se usó un script con Playwright que hace exactamente estos pasos en Edge (modo avión, test, volver la señal). No está en el repositorio porque depende de Edge instalado. Las pruebas de Vitest cubren la lógica (`SincronizarPendientes`, Dexie), pero no el service worker: para eso, esta prueba manual.

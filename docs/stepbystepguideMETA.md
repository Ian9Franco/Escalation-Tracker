# 🔗 Guía: Conexión con Meta Ads API

Esta guía detalla los pasos técnicos para integrar **F-Tracker** con el ecosistema de Meta para automatizar el seguimiento y escalado.

## Step 1: Configuración en Meta for Developers

1.  Ingresa a [Meta for Developers](https://developers.facebook.com/).
2.  Crea una nueva App de tipo **Negocio** (Business).
3.  En el dashboard de la App, añade el producto **Marketing API**.

## Step 2: Obtención de Credenciales

Necesitarás clonar estas variables en tu `.env.local`:

- `META_ACCESS_TOKEN`: Genera un Token de Acceso de Usuario con los permisos `ads_management`, `ads_read` y `business_management`.
- `META_AD_ACCOUNT_ID`: El ID de tu cuenta publicitaria (formato `act_123456...`).
- `META_APP_SECRET`: Lo encuentras en Configuración -> Básica.

## Step 3: Implementación del Webhook (Opcional)

Para recibir actualizaciones en tiempo real cuando un presupuesto cambia desde el Administrador de Anuncios:

1.  Configura un endpoint `/api/webhooks/meta` en Next.js.
2.  Registra la URL en el portal de desarrolladores.
3.  Verifica los eventos de `ads_budget_adjustment`.

## Step 4: Endpoint de Sincronización

Crea una función server-side que consulte:
`https://graph.facebook.com/v18.0/${META_AD_ACCOUNT_ID}/campaigns?fields=name,daily_budget,lifetime_budget,status`

---

> [!IMPORTANT]
> Los tokens de acceso de corta duración expiran en 2 horas. Te recomendamos generar un **System User Token** desde el Business Manager para una conexión permanente.

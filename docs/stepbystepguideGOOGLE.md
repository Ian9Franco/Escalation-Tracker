# 🔗 Guía: Conexión con Google Ads API

Sigue estos pasos para habilitar la sincronización automática con tus campañas de búsqueda, display o video en Google Ads.

## Step 1: Google Cloud Project

1.  Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/).
2.  Habilita la **Google Ads API**.
3.  Configura la **Pantalla de Consentimiento OAuth** (Interna o Externa).

## Step 2: Developer Token

1.  En tu cuenta de Google Ads (nivel MCC/Administrador), ve a **Herramientas y Configuración -> Configuración del Centro de API**.
2.  Solicita un **Developer Token**. (Puede tardar unos días en ser aprobado para acceso de producción, pero el acceso de prueba es inmediato).

## Step 3: OAuth2 Credentials

Necesitas generar un Client ID y Client Secret:

1.  En Google Cloud -> Credenciales -> Crear Credenciales -> ID de cliente de OAuth.
2.  Tipo de aplicación: Web / Desktop.
3.  Guarda el `refresh_token` obtenido tras el primer login.

## Step 4: Variables de Entorno

Añade a tu `.env.local`:

- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_ADS_CUSTOMER_ID`

## Step 5: Consultas (GAQL)

Usa el cliente oficial de Google Ads para Node.js y realiza consultas usando Google Ads Query Language (GAQL):
`SELECT campaign.id, campaign.name, campaign.amount_micros FROM campaign`

---

> [!TIP]
> Google Ads maneja los presupuestos en "micros" (moneda \* 1,000,000). Asegúrate de dividir el resultado por un millón en tu lógica de frontend.

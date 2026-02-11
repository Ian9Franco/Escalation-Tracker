# 📈 Escalation Tracker

Plataforma inteligente para el seguimiento y escalación progresiva de presupuestos en campañas de marketing digital (Meta Ads, Google Ads, etc.).

## 🚀 Características Principales

- **Dashboard Inteligente**: Visualización clara del presupuesto actual, metas de inmersión y progreso.
- **Estrategias Flexibles**:
  - Configuración de incremento porcentual personalizado por campaña.
  - Frecuencias variables: Diario, Cada 3 días, Semanal o Mensual.
- **Auto-Cálculo de Metas**: El sistema calcula automáticamente cuántos períodos y en qué fecha exacta se alcanzará el presupuesto meta.
- **Gestión Multi-Cliente**: Administra múltiples clientes y sus campañas de forma independiente.
- **Controles Granulares**:
  - Avance manual por campaña.
  - Pausar/Reanudar escalación.
  - Override de porcentaje para ajustes puntuales.
- **Seguridad**: Soporte para Row Level Security (RLS) via Supabase.

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15+ (App Router, TypeScript)
- **Base de Datos**: Supabase (PostgreSQL)
- **Estilos**: Vanilla CSS con variables modernas y Glassmorphism.
- **Iconos**: Lucide React.

## 🚦 Configuración Rápida

### 1. Clonar el repositorio

```bash
git clone https://github.com/Ian9Franco/Escalation-Tracker.git
cd Escalation-Tracker
```

### 2. Variables de Entorno

Crea un archivo `.env.local` con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica_anon
```

### 3. Base de Datos

Ve al SQL Editor de tu proyecto en Supabase y ejecuta el contenido de:

- `sql/Consolidated-App-Schema.sql`

### 4. Lanzar en Local

```bash
npm install
npm run dev
```

## 📄 Estructura de Archivos SQL

- `sql/Consolidated-App-Schema.sql`: Estructura completa y "maestra" del proyecto.
- `sql/Fix-Schema.sql`: Migraciones incrementales para bases de datos ya existentes.

---

Desarrollado para optimizar la escalación de presupuestos publicitarios de forma profesional y basada en datos.

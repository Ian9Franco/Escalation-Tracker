# 🏗️ Guía de Estructuras: F-Tracker

Esta guía explica los tres tipos de estructuras disponibles para tus campañas y cómo afectan la gestión del presupuesto y el seguimiento.

---

## 🟢 1. Estructura Standard (`campaign_budget`)

**Definición:** El presupuesto se gestiona como una única unidad global para toda la campaña.

- **Lógica de Presupuesto:** Tienes un solo valor de "Presupuesto Actual" que se escala según el porcentaje definido (ej. +20%).
- **Gestión:** Ideal para campañas de **CBO (Campaign Budget Optimization)** donde el algoritmo de la plataforma decide cómo distribuir el dinero internamente.
- **Cuándo usar:** Cuando solo te interesa trackear el gasto total de una campaña sin importar el desglose interno.

---

## 🔵 2. Estructura Adset (`adset_budget`)

**Definición:** El presupuesto se fragmenta en múltiples **Conjuntos de Anuncios** (AdSets).

- **Lógica de Presupuesto:** El sistema permite añadir campos individuales por cada conjunto. El presupuesto inicial se divide equitativamente entre ellos de forma automática y el modal te muestra el cálculo en tiempo real.
- **Gestión:** Útil para **ABO (Ad Set Budget Optimization)**. El dashboard muestra un desglose detallado de cada conjunto con su presupuesto individual asignado dentro de la tarjeta de campaña.
- **Control Granular:** Permite identificar qué unidad de la campaña está escalando correctamente.
- **Cuándo usar:** Cuando escalas presupuestos a nivel de audiencia o interés de forma separada.

---

## 🟡 3. Estructura Mixed (`mixed_budget`)

**Definición:** El presupuesto se distribuye entre diferentes **Plataformas o Canales**.

- **Lógica de Presupuesto:** Similar a Adset, permitiendo añadir múltiples plataformas (ej. Meta, Google, TikTok). Se divide el presupuesto inicial entre los canales ingresados y se visualiza el desglose en el dashboard.
- **Gestión:** Permite centralizar una "estrategia de omnicanalidad" donde el cliente tiene un Presupuesto Total que quieres subir un X%, repartido en varios proveedores.
- **Cuándo usar:** Para estrategias multi-canal donde quieres que el tracker te dé una visión consolidada del escalado total de la cuenta.

---

## 📊 Comparativa Rápida

| Característica      | Standard          | Adset                       | Mixed                        |
| :------------------ | :---------------- | :-------------------------- | :--------------------------- |
| **Desglose**        | Ninguno (Global)  | Por Conjuntos (Audiencias)  | Por Plataformas (Canales)    |
| **Presupuesto**     | 1 Solo Bloque     | Dividido entre N conjuntos  | Dividido entre N plataformas |
| **Uso Principal**   | CBO / Simplicidad | ABO / Control de Audiencias | Estrategia Omnicanal         |
| **Identificadores** | N/A               | Nombre de Adset             | Nombre de Plataforma         |

> [!TIP]
> Si tienes dudas, empieza con **Standard**. Siempre puedes crear campañas nuevas con mayor detalle a medida que la cuenta escala.

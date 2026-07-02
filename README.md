# 🚀 Gespeia: Plataforma Inteligente de Distribución y Ventas

¡Bienvenido al futuro de la gestión de pedidos! **Gespeia** es una solución integral diseñada para modernizar y automatizar el flujo de ventas, control de inventario y atención al cliente en empresas de distribución de bebidas y productos al por mayor.

Lo que hace única a esta plataforma no es solo su panel de administración ultrarrápido, sino su **Asistente de Inteligencia Artificial nativo**, capaz de procesar pedidos conversacionales en lenguaje natural, liberando a su equipo de ventas de tareas repetitivas.

---

## 🌟 Características Principales

### 🤖 Asistente de Ventas con IA (Powered by Groq & Genkit)
Olvídese de los formularios largos y los errores humanos. Nuestro asistente virtual impulsado por los modelos más avanzados (Qwen / Llama) funciona como un vendedor incansable 24/7.
- **Toma de pedidos en lenguaje natural**: El cliente o vendedor solo tiene que decir "Ponme 12 botellas de agua y 5 colas para el restaurante El Buen Sabor".
- **Comprobación de Stock en Tiempo Real**: La IA verifica instantáneamente si hay existencias suficientes e informa al usuario.
- **Onboarding Automático**: Si un número de teléfono no está registrado, la IA se encarga de preguntar el nombre y la dirección para crear la ficha del nuevo cliente en el acto.

### 📦 Gestión de Inventario Inteligente
- **Catálogo Detallado**: Gestione sus marcas, productos y precios de forma centralizada.
- **Control de Stock Dinámico**: El stock se actualiza automáticamente cuando se confirma un pedido.
- **Prevención de Sobregiros**: El sistema y la IA actúan en sincronía para bloquear pedidos que excedan el inventario disponible.

### 👥 CRM y Gestión de Clientes
- **Base de Datos Centralizada**: Mantenga toda la información de sus clientes (ID, Nombre, Teléfono, Dirección) a un clic de distancia.
- **Reconocimiento por Teléfono**: El sistema identifica rápidamente a los clientes habituales, agilizando sus pedidos recurrentes.

### 🛒 Panel de Pedidos Transparente
- **Creación Manual o Asistida**: Administre pedidos a través del clásico panel visual, o deje que la IA lo haga por usted.
- **Visualización Clara**: Listado completo de los ítems del pedido, precios unitarios y cálculo del total.
- **Cancelaciones Seguras**: Si se elimina un pedido, el stock reservado vuelve instantáneamente al inventario.

---

## 💻 Interfaz de Usuario Moderna y Responsiva

Construida sobre **Next.js 15**, **React** y **TailwindCSS**, la plataforma ofrece una experiencia visual de primer nivel:
- **Vista Dividida (Split View)**: Trabaje en el inventario o los pedidos en la mitad de la pantalla mientras atiende al chat de la IA en la otra mitad.
- **Hot-Reload y Sincronización Inmediata**: Cualquier cambio realizado por la IA (como crear un nuevo pedido) se refleja de inmediato en los paneles de gestión gracias a su arquitectura moderna.
- **Modo Debugging para Administradores**: Un panel ocultable que permite ver en tiempo real qué "herramientas" (tools) está usando la IA y analizar cualquier error de red o de stock.

---

## 🛠️ Arquitectura Técnica de Vanguardia

Para los equipos de IT y desarrolladores, **Gespeia** es sinónimo de rendimiento y escalabilidad:
- **Framework Core**: Next.js (App Router) + Turbopack.
- **Orquestación de IA**: **Firebase Genkit** con integración directa a los modelos hiperrápidos de **Groq** (permitiendo latencias mínimas en respuestas complejas).
- **Tool Calling (Function Calling) Nativo**: La IA no solo "habla", sino que ejecuta funciones TypeScript seguras (Zod) para interactuar con la base de datos subyacente.
- **UI Components**: Shadcn-ui & Radix UI para componentes accesibles, rápidos y altamente personalizables.

---

*Gespeia no es solo un software de gestión; es su próximo empleado del mes, operando a la velocidad de la luz.*

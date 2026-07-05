# Documento de Diseño del Agente "Gespeia"

## Fase 1: Identidad y Misión del Agente
**Nombre del Agente:** Gespeia Sales Agent.

**Objetivo Principal (Goal):** Guiar al cliente desde la recepción de una intención de compra en lenguaje natural hasta la confirmación de un pedido estructurado en la base de datos, garantizando que haya stock suficiente. El ciclo termina cuando el pedido se inserta con éxito o cuando el cliente cancela explícitamente la operación.

**Restricciones y Límites (Guardrails):**
- **Inventario estricto:** Jamás confirmar un pedido sin haber llamado antes a la herramienta de verificación de stock. No inventar disponibilidades.
- **Precios inmutables:** No aplicar descuentos ni alterar precios bajo ninguna circunstancia conversacional.
- **Ámbito restringido:** Negarse educadamente a responder cualquier pregunta que no esté relacionada con el catálogo de bebidas, el estado de pedidos o el registro del cliente.

**Borrador de System Prompt Avanzado:**
```text
[ROL Y CONTEXTO]
Eres Gespeia, el agente de ventas B2B experto de una distribuidora de bebidas. Interactúas con gerentes de restaurantes y tiendas para gestionar sus pedidos mayoristas de forma rápida y amable.

[MISIÓN PRINCIPAL]
Tu objetivo es capturar los productos que desea el cliente, verificar disponibilidad en tiempo real y cerrar el pedido en el sistema. Si el cliente es nuevo, debes hacerle el onboarding pidiendo nombre y dirección.

[REGLAS OBLIGATORIAS]
1. NUNCA asumas que hay stock. Usa SIEMPRE tus herramientas para comprobarlo.
2. NO puedes modificar los precios base del sistema.
3. Si el cliente pide cantidades absurdas (ej. 10.000 palés), pide confirmación humana.

[FORMATO DE SALIDA]
Mantén un tono profesional, directo y conciso. Evita párrafos largos. Confirma siempre las acciones tomadas ("He reservado 10 cajas de agua para ti").
```

## Fase 2: Percepción y Entorno
**Definición del Entorno:** El agente opera sobre una base de datos relacional (gestionada mediante un CRM interno) y percibe el mundo a través de una interfaz de chat web integrada en el panel de Next.js.

**Percepción (Inputs):** Recibe eventos de tipo "nuevo mensaje de chat" y webhooks internos si el inventario cambia de forma asíncrona mientras atiende al usuario.

**Modelo de Memoria:**
- **Memoria a Corto Plazo:** El historial de la conversación actual (ventana de contexto) y el "carrito virtual" de los productos que se están negociando en la sesión activa.
- **Memoria a Largo Plazo:** La base de datos SQL/NoSQL que almacena la ficha del cliente (ID, teléfono, dirección) y el registro histórico de sus pedidos frecuentes para ofrecer reposiciones rápidas.

## Fase 3: Catálogo de Herramientas (Tools)

**Herramienta 1: Verificación de Inventario**
- **Nombre técnico:** `comprobar_stock_producto`
- **Descripción para el LLM:** Úsala siempre que el cliente mencione un producto para saber si hay existencias suficientes antes de añadirlo al pedido.
- **Parámetros de entrada:** 
  - `nombre_producto` (String): El nombre genérico o marca de la bebida (ej. "Cola", "Agua con gas").
  - `cantidad_deseada` (Integer): Número de unidades o cajas solicitadas.
- **Output esperado:** Un JSON con `{"disponible": boolean, "stock_actual": integer, "precio_unitario": float}`.

**Herramienta 2: Registro de Cliente (Onboarding)**
- **Nombre técnico:** `crear_ficha_cliente`
- **Descripción para el LLM:** Úsala únicamente cuando no reconozcas el teléfono del usuario o el sistema te indique que es un cliente no registrado.
- **Parámetros de entrada:**
  - `telefono` (String): El número de contacto.
  - `nombre_comercial` (String): Nombre del negocio o restaurante.
  - `direccion_entrega` (String): Dirección física completa.
- **Output esperado:** ID del nuevo cliente generado en la base de datos `{"cliente_id": "CUST-987"}`.

**Herramienta 3: Confirmación de Pedido**
- **Nombre técnico:** `ejecutar_alta_pedido`
- **Descripción para el LLM:** Úsala como paso final para asentar la compra una vez que el cliente haya dado su confirmación explícita ("Sí, haz el pedido").
- **Parámetros de entrada:**
  - `cliente_id` (String): El identificador del cliente.
  - `items` (Array de Objetos): Lista de productos con su ID y cantidad final.
- **Output esperado:** `{"estado": "COMPLETADO", "numero_seguimiento": "ORD-1024"}`.

## Fase 4: El Ciclo de Razonamiento (Loop ReAct)
**Ejemplo del flujo cognitivo del agente:**
- **Pensamiento (Thought):** El cliente con ID conocido ha pedido "12 botellas de agua y 5 colas". Necesito saber si tenemos ese stock disponible antes de confirmarle el precio total.
- **Acción (Act):** Llamo a la función `comprobar_stock_producto` para el agua (cantidad 12) y luego para la cola (cantidad 5).
- **Observación (Observe):** El sistema me devuelve que hay 50 aguas a 1€ y 2 colas a 2€. Hay falta de stock en las colas.
- **Pensamiento (Thought):** No puedo completar el pedido tal cual. Debo informar al usuario del límite de colas y ofrecerle solo 2, confirmando las 12 aguas.
- **Acción/Respuesta:** El agente genera el texto informando del problema de stock y espera confirmación del usuario para romper el bucle y llamar a `ejecutar_alta_pedido`.

## Fase 5: Gestión de Riesgos y Control
- **Control de Bucles Infinitos:** El sistema del agente tendrá configurado un parámetro `max_tool_calls = 5` por cada mensaje del usuario. Si falla intentando buscar el nombre de un producto 5 veces, cortará el proceso y pedirá al usuario que reformule la pregunta.
- **Manejo de Errores Críticos:** Si la base de datos de inventario se cae (500 Error en la herramienta de stock), el agente tiene una instrucción catch: devolverá un mensaje genérico: "Nuestros sistemas de almacén están actualizándose. Por favor, inténtalo en 5 minutos" y detendrá su ejecución.
- **Intervención Humana (Human-in-the-Loop):** Se establece una regla dura en el backend: si el valor total calculado del carrito supera los 3.000€, el agente no podrá usar la herramienta `ejecutar_alta_pedido`. Entrará en un estado bloqueado y enviará un mensaje: "Tu pedido requiere revisión manual por su gran volumen. Un comercial validará la operación en breve", notificando al administrador por el panel de Gespeia.
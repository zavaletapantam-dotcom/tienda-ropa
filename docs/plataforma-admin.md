# Plataforma MAISON: panel admin, stock y cuentas

Todo queda en **Cloudflare**, en la misma cuenta de la tienda y de maison.pe:
- **Base de datos (Cloudflare D1):** clientes, pedidos, historial y stock.
- **Lógica (Pages Functions):** confirmar o cancelar pedidos, descontar stock e iniciar sesión.
- **Inicio de sesión con Google:** usa la app de Google que crea el dueño (pasos abajo).

## Fase 1: panel admin y stock real
Al panel solo entra el dueño, con su correo de Google.
- **Stock del día** por producto, color y talla (el cliente compra "Polo Luxury Verde talla M").
- **Gerencia:** marcar agotado, ocultar o quitar un producto, y poner el % de descuento (el precio se calcula solo).
- **Pedidos consultados:** cuando el cliente toca "Enviar pedido por WhatsApp", el pedido queda *pendiente* (ej.: Polo Luxury Verde M × 2).
- **Regla (if):**
  - **Si procede** → se descuentan exactamente esas unidades, una sola vez. Si no hay stock suficiente, no deja confirmar.
  - **Si se cancela** → el stock no se toca.
- **En la tienda:** una talla en 0 sale como *Agotado* y no se puede pedir.
- **Estrategia:** ventas del día y de la semana, lo más vendido frente a lo más consultado, y avisos de stock bajo.

## Fase 2: cuentas de clientes con Google
- Opcional: no obligar a crear cuenta para pedir (obligarlo hace perder ventas).
- Desde la fase 1 ya hay base de clientes: cada pedido guarda nombre, celular y distrito.
- Hace falta una **política de privacidad** (Ley 29733) y cambiar el texto de Contacto "No guardamos tus datos".

## Paso a paso para el dueño: app de Google
Hacerlo con el Gmail de la tienda: **maison.pe.dandy@gmail.com**.

1. Entrar a **console.cloud.google.com** y aceptar los términos.
2. Arriba, en **Seleccionar proyecto**, elegir **Proyecto nuevo**. Nombre: **MAISON**. Tocar **Crear** y dejarlo seleccionado.
3. Ir a **Google Auth Platform** y tocar **Comenzar**:
   - Nombre de la app: **MAISON**
   - Correo de asistencia y de contacto: **maison.pe.dandy@gmail.com**
   - Público: **Externo**
4. En **Desarrollo de la marca**:
   - Página principal: **https://maison.pe**
   - Política de privacidad: **https://maison.pe/privacidad**
   - Dominio autorizado: **maison.pe**
   - Sin logo por ahora: si se sube, Google lo revisa y puede tardar días.
5. En **Acceso a los datos**, tocar **Agregar o quitar permisos** y marcar solo: **openid**, **…/auth/userinfo.email** y **…/auth/userinfo.profile**. Guardar.
6. En **Clientes**, tocar **Crear cliente**:
   - Tipo: **Aplicación web**. Nombre: **MAISON web**.
   - Orígenes de JavaScript autorizados: **https://maison.pe**
   - URI de redireccionamiento autorizados: **https://maison.pe/api/auth/google/callback**
7. Copiar el **ID de cliente** y el **Secreto de cliente**. El secreto es como una contraseña: no mandarlo por grupos ni chats. Se guarda directo en Cloudflare como variable secreta del proyecto `maison-pe`.
8. En **Público**, tocar **Publicar app** (pasar a **En producción**). En "Prueba" solo entran hasta 100 correos agregados a mano.

Opcional: en **IAM y administración**, agregar a **zavaletapantam@gmail.com** como **Editor**.
Si Google pide verificar que maison.pe es de la tienda, se agrega un registro TXT en el DNS de Cloudflare.

## Pendientes
- **Visto bueno del dueño** a Términos y condiciones, Política de privacidad y Uso de datos (publicados el 10/11/2026 en maison.pe/terminos, /privacidad y /datos).
- **Registro del banco de datos de clientes** ante la Autoridad Nacional de Protección de Datos Personales (Ministerio de Justicia). Lo hace el dueño. Con el código de inscripción, se agrega en la Política de privacidad, punto 1.
- **Ruleta de descuentos:** antes de lanzarla, confirmar con un contador si una promoción que depende del azar necesita autorización del Ministerio del Interior. Si se aprueba, se redactan sus condiciones y se menciona en Términos (punto 9).
- **Libro de Reclamaciones virtual** con formulario y número correlativo, conectado al panel (rama `panel-admin`). Hasta entonces, los reclamos se reciben por correo (Ayuda → Libro de reclamaciones).
- **Copia automática del reclamo al correo del cliente:** requiere el plan Workers Paid de Cloudflare (US$5 al mes).

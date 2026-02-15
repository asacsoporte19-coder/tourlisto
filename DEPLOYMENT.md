# 🚀 Deployar TourListo en Vercel

Esta guía te ayudará a subir tu proyecto a GitHub y desplegarlo en Vercel.

## 📋 Requisitos Previos

- Cuenta de GitHub
- Cuenta de Vercel (puedes usar tu cuenta de GitHub)
- Variables de entorno configuradas (Supabase, etc.)

---

## 🔧 Paso 1: Preparar el Proyecto (✅ Completado)

El proyecto ya ha sido limpiado y preparado:

- ✅ Archivos temporales eliminados
- ✅ `.gitignore` actualizado
- ✅ Configuración de Next.js verificada

---

## 📦 Paso 2: Subir a GitHub

### 2.1 Verificar el estado de Git

```bash
cd c:\Users\Administrador\Desktop\Antigravity\test\TourListo
git status
```

### 2.2 Agregar todos los archivos

```bash
git add .
```

### 2.3 Hacer commit

```bash
git commit -m "feat: initial commit - TourListo app ready for deployment"
```

### 2.4 Crear repositorio en GitHub

1. Ve a [GitHub](https://github.com/new)
2. Crea un nuevo repositorio llamado `tourlisto` (o el nombre que prefieras)
3. **NO** inicialices con README, .gitignore o license (ya los tienes)

### 2.5 Conectar y hacer push

```bash
# Reemplaza YOUR_USERNAME con tu usuario de GitHub
git remote add origin https://github.com/YOUR_USERNAME/tourlisto.git
git branch -M main
git push -u origin main
```

---

## 🌐 Paso 3: Desplegar en Vercel

### 3.1 Conectar con Vercel

1. Ve a [Vercel](https://vercel.com)
2. Inicia sesión con tu cuenta de GitHub
3. Click en **"Add New Project"**
4. Selecciona tu repositorio `tourlisto`

### 3.2 Configurar el Proyecto

Vercel detectará automáticamente que es un proyecto Next.js. Configuración recomendada:

- **Framework Preset**: Next.js (detectado automáticamente)
- **Root Directory**: `./` (por defecto)
- **Build Command**: `npm run build` (por defecto)
- **Output Directory**: `.next` (por defecto)

### 3.3 Configurar Variables de Entorno

> [!IMPORTANT]
> Debes configurar las siguientes variables de entorno en Vercel:

Basándote en tu archivo `.env.local`, añade estas variables en el dashboard de Vercel:

**Variables de Supabase:**

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

**Variables de Gemini (si aplica):**

```bash
GEMINI_API_KEY=tu_api_key_de_gemini
```

**Otras variables que tengas en `.env.local`**

Para añadir las variables:

1. En la sección "Environment Variables" del dashboard de Vercel
2. Añade cada variable con su nombre y valor
3. Selecciona los entornos: **Production**, **Preview**, y **Development**

### 3.4 Desplegar

1. Click en **"Deploy"**
2. Espera a que termine el build (2-5 minutos)
3. ✅ ¡Tu app estará en vivo!

---

## 🔄 Deployments Automáticos

Cada vez que hagas push a la rama `main`, Vercel desplegará automáticamente los cambios:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push
```

---

## 🛠️ Comandos Útiles

### Desarrollo Local

```bash
npm run dev
```

### Build Local (para verificar antes de deploy)

```bash
npm run build
npm start
```

### Verificar Linting

```bash
npm run lint
```

---

## 📱 PWA (Progressive Web App)

Tu app está configurada con PWA, lo que significa que:

- ✅ Los usuarios pueden instalarla en sus dispositivos
- ✅ Funciona offline (con service workers)
- ✅ Se actualiza automáticamente

---

## 🔒 Seguridad

> [!CAUTION]
> **NUNCA** subas archivos `.env` o con credenciales a GitHub

El `.gitignore` está configurado para ignorar:

- `.env*` - Archivos de entorno
- `*config*.env` - Archivos de configuración con credenciales

---

## 📊 Monitoreo

Después del deployment, puedes:

- Ver logs en el dashboard de Vercel
- Configurar alertas
- Ver analytics de uso
- Revisar el rendimiento

---

## ❓ Troubleshooting

### Build Failed

- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs de build en Vercel
- Prueba hacer build local: `npm run build`

### Runtime Error

- Verifica las variables de entorno
- Revisa los logs de runtime en Vercel
- Verifica la conexión con Supabase

### Variables de Entorno No Funcionan

- Las variables que empiezan con `NEXT_PUBLIC_` son públicas
- Las demás solo están disponibles en el servidor
- Después de cambiar variables, haz un nuevo deploy

---

## 🎉 ¡Listo

Tu aplicación TourListo ahora está:

- ✅ Limpia y lista para producción
- ✅ En GitHub para control de versiones
- ✅ Desplegada en Vercel con CI/CD automático
- ✅ Configurada como PWA

**URL de tu app:** `https://tourlisto.vercel.app` (o la que Vercel te asigne)

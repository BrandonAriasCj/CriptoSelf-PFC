# Quiz Perfil de Trading 📈

Una aplicación React moderna y responsiva para determinar el perfil de trading de los usuarios a través de un quiz interactivo. Perfecta para campañas de marketing en TikTok y redes sociales.

## ✨ Características

- **Quiz interactivo** de 6 preguntas con animaciones fluidas
- **Diseño responsivo** optimizado para móviles
- **Cartilla personalizada** descargable como imagen
- **3 perfiles de trading**: Conservador, Moderado y Agresivo
- **Funcionalidad de compartir** nativa del navegador
- **Animaciones suaves** con Framer Motion
- **Interfaz moderna** con gradientes y efectos glassmorphism

## 🚀 Instalación

1. Clona o descarga el proyecto
2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm start
```

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## 📱 Optimización Móvil

La aplicación está completamente optimizada para dispositivos móviles:
- Diseño responsivo que se adapta a cualquier tamaño de pantalla
- Botones y elementos táctiles optimizados para dedos
- Tipografía escalable y legible en pantallas pequeñas
- Animaciones suaves que no afectan el rendimiento

## 🎯 Perfiles de Trading

### Trader Conservador 🛡️
- Enfoque en preservación del capital
- Inversiones de bajo riesgo
- Horizonte temporal largo

### Trader Moderado ⚖️
- Balance entre riesgo y rentabilidad
- Diversificación inteligente
- Horizonte temporal mediano

### Trader Agresivo 🚀
- Alto apetito por el riesgo
- Trading activo
- Búsqueda de alta rentabilidad

## 🛠️ Tecnologías Utilizadas

- **React 18** - Framework principal
- **Framer Motion** - Animaciones fluidas
- **Lucide React** - Iconos modernos
- **HTML2Canvas** - Generación de imágenes
- **CSS3** - Estilos modernos con gradientes y glassmorphism

## 📊 Estructura del Proyecto

```
src/
├── components/
│   ├── WelcomeScreen.js    # Pantalla de bienvenida
│   ├── QuizCard.js         # Tarjeta de preguntas
│   ├── ResultCard.js       # Cartilla de resultados
│   └── *.css              # Estilos de componentes
├── data/
│   └── questions.js        # Preguntas y perfiles
├── App.js                  # Componente principal
└── index.js               # Punto de entrada
```

## 🎨 Personalización

### Modificar Preguntas
Edita el archivo `src/data/questions.js` para cambiar:
- Preguntas del quiz
- Opciones de respuesta
- Sistema de puntuación
- Perfiles de resultado

### Cambiar Estilos
Los estilos están organizados por componente en archivos CSS separados:
- Colores y gradientes en variables CSS
- Diseño responsivo con media queries
- Animaciones personalizables

### Agregar Nuevos Perfiles
En `src/data/questions.js`, puedes agregar nuevos perfiles con:
- Título y descripción
- Características específicas
- Recomendaciones personalizadas
- Colores y iconos únicos

## 📈 Para Campañas de Marketing

Esta aplicación es perfecta para:
- **TikTok Ads** - Diseño optimizado para móviles
- **Instagram Stories** - Cartillas compartibles
- **Lead Generation** - Captura de interés en trading
- **Content Marketing** - Contenido interactivo y viral

## 🚀 Despliegue

Para construir la aplicación para producción:

```bash
npm run build
```

Esto creará una carpeta `build/` con los archivos optimizados listos para desplegar en cualquier servidor web.

## 📝 Licencia

Este proyecto está disponible para uso personal y comercial.

---

¡Perfecto para generar leads y engagement en tus campañas de trading! 🎯
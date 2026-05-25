# 📝 Soporte de Markdown - Academia

## ✅ Implementado

He agregado soporte completo para Markdown en el contenido de las lecciones usando `react-markdown`.

## 📦 Librerías Instaladas

```bash
npm install react-markdown remark-gfm rehype-raw
```

- **react-markdown**: Renderiza Markdown en React
- **remark-gfm**: GitHub Flavored Markdown (tablas, listas de tareas, etc.)
- **rehype-raw**: Permite HTML dentro del Markdown (opcional)

## 🎨 Estilos Aplicados

El Markdown usa los estilos del sistema de tu aplicación:

```css
prose prose-sm max-w-none
  /* Headings */
  prose-headings:text-foreground
  prose-h1:text-3xl prose-h1:mb-6
  prose-h2:text-2xl prose-h2:mb-4
  prose-h3:text-xl prose-h3:mb-3
  
  /* Text */
  prose-p:text-muted-foreground
  prose-strong:text-foreground
  
  /* Lists */
  prose-ul:text-muted-foreground
  prose-ol:text-muted-foreground
  
  /* Code */
  prose-code:text-primary
  prose-code:bg-muted
  prose-pre:bg-muted
  
  /* Links */
  prose-a:text-primary
  prose-a:no-underline
  hover:prose-a:underline
```

## 📚 Sintaxis Soportada

### 1. Encabezados
```markdown
# Título Principal (H1)
## Subtítulo (H2)
### Sección (H3)
#### Subsección (H4)
```

### 2. Texto
```markdown
**Texto en negrita**
*Texto en cursiva*
~~Texto tachado~~
`código inline`
```

### 3. Listas

**No ordenadas:**
```markdown
- Item 1
- Item 2
  - Sub-item 2.1
  - Sub-item 2.2
- Item 3
```

**Ordenadas:**
```markdown
1. Primer paso
2. Segundo paso
3. Tercer paso
```

**Listas de tareas:**
```markdown
- [x] Tarea completada
- [ ] Tarea pendiente
- [ ] Otra tarea
```

### 4. Enlaces e Imágenes
```markdown
[Texto del enlace](https://ejemplo.com)
![Texto alternativo](url-de-imagen.jpg)
```

### 5. Citas
```markdown
> Esta es una cita
> Puede tener múltiples líneas
```

### 6. Código

**Inline:**
```markdown
Usa `console.log()` para imprimir
```

**Bloques:**
````markdown
```python
def trading_strategy():
    return "Buy low, sell high"
```
````

### 7. Tablas (GFM)
```markdown
| Columna 1 | Columna 2 | Columna 3 |
|-----------|-----------|-----------|
| Dato 1    | Dato 2    | Dato 3    |
| Dato 4    | Dato 5    | Dato 6    |
```

### 8. Líneas Horizontales
```markdown
---
***
___
```

### 9. Emojis
```markdown
:smile: :rocket: :chart_with_upwards_trend:
✅ ⚠️ 📊 💰
```

## 💡 Ejemplo de Contenido

```markdown
# ¿Qué es el Trading?

El **trading** es la compra y venta de instrumentos financieros con el objetivo de obtener beneficios a corto plazo.

## Conceptos Clave

### 1. Mercados Financieros
Los mercados financieros son plataformas donde se negocian activos como:
- **Acciones**: Participaciones en empresas
- **Forex**: Divisas internacionales
- **Criptomonedas**: Monedas digitales como Bitcoin

### 2. Tipos de Trading
1. **Day Trading**: Operaciones del mismo día
2. **Swing Trading**: Operaciones de días/semanas
3. **Scalping**: Operaciones muy rápidas

## Ventajas y Riesgos

| Ventajas | Riesgos |
|----------|---------|
| ✅ Ganancias rápidas | ⚠️ Pérdidas significativas |
| ✅ Flexibilidad | ⚠️ Estrés emocional |
| ✅ Acceso global | ⚠️ Costos de transacción |

> **Importante**: El trading requiere educación, práctica y gestión adecuada del riesgo.

Para más información, visita [nuestra guía](https://ejemplo.com).

```python
# Ejemplo de estrategia simple
def simple_strategy(price, ma_20):
    if price > ma_20:
        return "BUY"
    else:
        return "SELL"
```

## Conclusión
El trading puede ser lucrativo, pero requiere:
- [x] Educación continua
- [x] Práctica constante
- [ ] Gestión de riesgo
```

## 🎯 Cómo Usar

### En el Backend (Django)

El contenido de las lecciones ya está en Markdown:

```python
# lessons/models.py
class Lesson(models.Model):
    content = models.TextField(verbose_name="Contenido")
    # El contenido se guarda en formato Markdown
```

### En el Frontend (React)

El componente `LessonViewer` automáticamente renderiza el Markdown:

```tsx
<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {lesson.content}
</ReactMarkdown>
```

## 🎨 Personalización

Si quieres personalizar los estilos del Markdown, edita las clases en `LessonViewer.tsx`:

```tsx
<div className="prose prose-sm max-w-none
  prose-headings:text-foreground
  prose-p:text-muted-foreground
  // Agrega más personalizaciones aquí
">
```

## 📝 Crear Nuevas Lecciones

Al crear lecciones en el admin de Django, escribe el contenido en Markdown:

```python
# En el admin o en populate_lessons.py
lesson = Lesson.objects.create(
    title="Mi Lección",
    content="""
# Título de la Lección

## Introducción
Este es el contenido en **Markdown**.

### Puntos Clave
- Punto 1
- Punto 2
- Punto 3

```python
# Código de ejemplo
print("Hola Trading!")
```

> Recuerda: La práctica hace al maestro.
    """
)
```

## ✨ Características

- ✅ **Sintaxis completa de Markdown**
- ✅ **GitHub Flavored Markdown (GFM)**
- ✅ **Tablas**
- ✅ **Listas de tareas**
- ✅ **Bloques de código con sintaxis**
- ✅ **Citas**
- ✅ **Enlaces e imágenes**
- ✅ **Estilos consistentes con la app**
- ✅ **Responsive**
- ✅ **Dark/Light mode**

## 🔍 Testing

Para probar el Markdown:

1. Ve a una lección
2. El contenido se renderizará automáticamente
3. Todos los elementos de Markdown funcionarán

## 📊 Ejemplo Visual

### Antes (texto plano)
```
# Título
Texto normal
**Negrita**
```

### Después (renderizado)
```
Título (grande y bold)
Texto normal (color muted)
Negrita (color foreground, bold)
```

## 🎉 Beneficios

1. **Contenido Rico**: Formato profesional sin HTML
2. **Fácil de Escribir**: Sintaxis simple y legible
3. **Mantenible**: Fácil de editar y actualizar
4. **Consistente**: Usa los estilos del sistema
5. **Flexible**: Soporta múltiples formatos

## 🚀 Próximos Pasos

Puedes extender el soporte agregando:

1. **Syntax Highlighting**: Para bloques de código
   ```bash
   npm install react-syntax-highlighter
   ```

2. **Matemáticas**: Para fórmulas
   ```bash
   npm install remark-math rehype-katex
   ```

3. **Diagramas**: Para gráficos
   ```bash
   npm install mermaid
   ```

---

**Estado**: ✅ IMPLEMENTADO
**Versión**: 1.0
**Última actualización**: Noviembre 2024

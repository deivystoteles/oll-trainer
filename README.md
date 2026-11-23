# OLL Trainer

Entrenador web para memorizar los 57 algoritmos **OLL** del cubo de Rubik (método CFOP).

## Características

- Cubo 3D con casos OLL aleatorios
- Solución, vista de la posición y animación paso a paso
- Marca cada caso como acertado ✓ o fallado ✗
- Barra de progreso por algoritmo
- Catálogo de los 57 casos, agrupados por forma
- Color de la capa superior configurable

## Capturas

| Entrenamiento | Detalles y solución |
|---|---|
| ![](images/img-1.JPG) | ![](images/img-4.JPG) |

| Todos los algoritmos | Configuración |
|---|---|
| ![](images/img-3.JPG) | ![](images/img-2.JPG) |

## Uso

```bash
git clone https://github.com/deivystoteles/oll-trainer.git
cd oll-trainer
npx serve  # luego abre la URL que aparece en la terminal
```

## Tecnologías

HTML, CSS y JavaScript puro, con [cubing.js](https://js.cubing.net/cubing/) para el cubo 3D (CDN).

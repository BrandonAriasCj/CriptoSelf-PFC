branch=$(git rev-parse --abbrev-ref HEAD)

echo "Rama actual: $branch"

if [ "$branch" = "main" ]; then
    git pull origin main
    echo "Se logro la actualización de la rama main"
else
    echo "No estás en main, no se ejecutará nada."
fi

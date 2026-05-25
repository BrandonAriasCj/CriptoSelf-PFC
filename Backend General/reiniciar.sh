sudo systemctl stop nginx
sudo systemctl daemon-reload
sudo systemctl start nginx


sudo systemctl stop gunicorn
sudo systemctl daemon-reload
sudo systemctl start gunicorn

echo listo

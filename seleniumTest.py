from selenium import webdriver
import time

# Lista de rutas/URLs a visitar
protocolo = "http"
ipserver = "127.0.0.1"
puertoFrontend = 3000
urlFrond = [
    f"{protocolo}://{ipserver}:{puertoFrontend}/",
]


# Configurar el navegador (Chrome en este caso)
driver = webdriver.Chrome()

# Recorrer cada URL
for url in urlFrond:
    driver.get(url)           
    print(f"Visitando: {url}")
    time.sleep(1)             


driver.quit()

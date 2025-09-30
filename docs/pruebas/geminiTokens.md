## WS/Questions-video
Estas son notas acerca de las pruebas que se hicieron con el componente Questions-video relacionadas con el conteo de tokens.
Al hacer pruebas con este componente de websocket, se comenzo a recibir un error 429 RESOURCE_EXHAUSTED. Leyendo en la [documentación](https://ai.google.dev/gemini-api/docs/troubleshooting) resulta ser que con el modelo 2.5 flash de gemini, unicamente podemos gastar hasta  1M de tokens por minuto, sin embargo, al procesar un video de Audiencia.mp4 de 1:45:48 de duración, se gastan en promedio 1.8M de tokens, por o tanto se disparaba un error de límite de cuota.
### Solución
Se optó por cambiar al modelo 2.5 Pro que admite hasta 2M de tokens por minuto.

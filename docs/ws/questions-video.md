## Documentación acerca del canal de conexión de WS "question-video"
Este canal es para chatear con dacuai específicamente para hacer preguntas acerca de un video.
El flujo que describe el comportamiento de este módulo es _1. Questions about video - Activity diagram with video.drawio_. Además, las preguntas que hace el usuario se procesan directamente sobre el archivo de video (mp4, mpeg, etc), no sobre la transcripción e texto.

Status del módulo: __DEV__
### Web Socket connection:
El canal de conexión es el siguiente:
- Para local: `ws://localhost:3000/chatAboutVideo`
- Para producción: `wss://dacuai-production.up.railway.app/chatAboutVideo`

### Namespace para enviar los mensajes
Para enviar las preguntas y mensajes acerca del video se utiliza el namespace `chat-about-video`. Se debe enviar un JSON con la siguiente estructura:
```
{
    "videoId": string,
    "message": "Aquí va la pregunta acerca del video"
}
```

### Eventos
Los eventos a los que hay que suscribirse para recibir la respuesta de la ia son los siguientes:
- `startMessageResponseAboutVideo`. Indica que el mensaje a iniciado a procesarse
```
// Devuelve un objeto con la siguiente estructura:
{ state: "start" }
```
- `endMessageResponseAboutVideo`. Indica que el mensaje a terminado de procesarse
```
// Devuelve un objeto con la siguiente estructura:
{ state: "end" }
```
- `responseChatAboutVideo`. En este evento se recibe la respuesta principal en texto a la pregunta del usuario sobre el video. No es un objeto ni un JSON, es texto string
```
// Devuelve un string sin estructura
**Este es un ejemplo** de como el mensaje de Dacuai viene en texto __ en formato markdown__
```
- `status`. En este evento se recibe el estado de la petición en formato JSON
```
// Devuelve un JSON como el siguiente 
{ state: "Dacuai está analizando el video" }
```
- `exception`. Indica si hubo un error al procesarse la solicitud. Solo se lanza en caso de excepción
```
// Devuelve un objeto con la siguiente estructura:
{
    "status": number,
    "message": string,
    "details": string
}
```
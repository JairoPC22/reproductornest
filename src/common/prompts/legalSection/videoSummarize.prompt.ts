//Hacer un resumen del video
export const promptLegalVideoSummarize = `
"Una vez que la transcripción detallada y fiel del juicio oral esté completa, procederemos a realizar un **resumen analítico y estratégico** del video, enfocándonos en los puntos críticos para la estrategia legal y la posible apelación.

El resumen debe ser **conciso pero exhaustivo y preciso**, destacando los siguientes aspectos con base directa en la transcripción:

**1. Preparación para la Apelación o Recursos:**

* **Identificación de Posibles Errores Procesales y Violaciones al Debido Proceso:**
    * Detalla cualquier **irregularidad, omisión o violación a derechos fundamentales** observada durante el juicio (ej., indebida admisión/rechazo de pruebas, falta de imparcialidad del juzgador, afectación a derechos de defensa o de la víctima). Cita el momento con hora minutos y segundos y la intervención específica donde se manifestó.
    * **Cita el segmento exacto de la transcripción** donde se manifiesta la presunta irregularidad o violación, incluyendo el participante que la genera y el momento relevante. Cita el momento con hora minutos y segundos y la intervención específica donde se manifestó.
    * Si hay alguna objeción o protesta registrada en la transcripción relacionada con el error, menciónala. Cita el momento con hora minutos y segundos y la intervención específica donde se manifestó.

* **Análisis de Contradicciones, Consistencias y Relevancia de Testimonios y Pruebas:**
    * Señala **inconsistencias o contradicciones significativas** en las declaraciones de testigos (de cargo y descargo), peritos o de las propias partes. Especifica los **puntos exactos de contradicción** entre diferentes declaraciones o con la prueba material. Cita el momento con hora minutos y segundos y la intervención específica donde se manifestó.
    * Destaca los **puntos de particular solidez o coherencia** de los testimonios y pruebas que fortalezcan la postura de alguna de las partes. Cita el momento con hora minutos y segundos y la intervención específica donde se manifestó.
    * **Evalúa la relevancia y el peso probatorio** de cada testimonio o prueba presentada, según lo que se desprende de la oralidad del juicio.

* **Fundamentación de Agravios Potenciales y Argumentos Clave:**
    * Resume los **argumentos centrales y las pruebas clave** presentadas por cada parte (Fiscalía, Defensa, Asesor Jurídico, etc.).
    * **Analiza cómo se desahogaron estas pruebas y argumentos:** ¿Fueron presentados de manera clara y persuasiva? ¿Existieron deficiencias en su exposición o refutación que podrían constituir un agravio?
    * Identifica los **momentos cruciales donde las partes intentaron establecer su teoría del caso** y cómo lo hicieron. Cita el momento con hora minutos y segundos y la intervención específica donde se manifestaron estos momentos cruciales.

* **Cuestionamiento Preliminar de la Valoración Judicial (si aplica y se puede inferir):**
    * Si el juez emitió comentarios o preguntas que pudieran **inferir su proceso de valoración** durante el juicio, regístralos. Cita el momento con hora minutos y segundos y la intervención específica donde emitieron los comentarios o preguntas que pudieran **inferir su proceso de valoración** durante el juicio.
    * Si se ha notado alguna disparidad entre la forma en que se desahogó una prueba y una posible valoración implícita del juez, anótala como un punto para análisis futuro. Cita los momentos con hora minutos y segundos y la intervención específica donde se desahogó la prueba y la hora minutos y segundos donde el Juez realizo la valoración implicita de la prueba.

**2. Análisis Estratégico de la Propia Actuación y la de la Contraparte:**

* **Análisis de la Técnica de Litigación (Propia y de la Contraparte):**
    * Detalla las **estrategias de interrogatorio y contrainterrogatorio** utilizadas: ¿Fueron efectivas? ¿Se lograron los objetivos?
    * Evalúa la **formulación de objeciones:** ¿Fueron oportunas, pertinentes y exitosas? ¿Cómo reaccionó la parte contraria y el juez?
    * Comenta sobre el **manejo del lenguaje verbal y no verbal** de los litigantes, y la claridad en la exposición de sus argumentos y alegatos.
    * **Proporciona ejemplos específicos** de la transcripción que ilustren tanto las buenas prácticas como las áreas de mejora para cada parte.

* **Evaluación de la Estrategia General y Puntos de Impacto:**
    * Resumen la **estrategia global adoptada por cada parte:** ¿Cuáles eran sus objetivos principales? ¿Cómo intentaron desacreditar a la contraparte?
    * Identifica los **puntos fuertes y débiles más evidentes** que surgieron para cada parte durante el juicio. ¿Qué argumentos o pruebas tuvieron mayor impacto en el juzgador o resultaron más vulnerables?
    * Analiza **momentos clave donde una parte ganó terreno o lo perdió**, y las razones aparentes de ello. Cita el momento con hora minutos y segundos y la intervención específica donde se manifestó para su posterior análisis.

**Consideraciones Generales para el Análisis:**

* **Síntesis Dirigida por el Impacto:** Prioriza la inclusión de información que tenga un **impacto directo y significativo** en el resultado del juicio o en la estrategia legal. Evita detalles que no añadan valor sustancial al análisis. El objetivo no es recontar todo, sino **identificar lo relevante**.
* **Objetividad Rigurosa y Evidencia Concreta:** Todas las observaciones deben ser **estrictamente objetivas y directamente sustentadas por referencias explícitas a la transcripción**. Si una observación es una inferencia, se debe indicar como tal. La **verificabilidad** es fundamental.
* **Claridad y Concisión Extrema:** El lenguaje debe ser **extraordinariamente claro, directo y sin redundancias**. Cada frase debe aportar información crítica. Utiliza oraciones concisas y evita explicaciones prolijas.
* **Enfoque en la Accionabilidad:** Cada punto del resumen debe estar orientado a proporcionar información que el abogado pueda **utilizar para tomar decisiones**: ya sea para una apelación, para futuras defensas, o para mejorar su técnica de litigación. Si la información no es accionable, reevaluar su inclusión.
* **Estructura Coherente:** El resumen debe fluir lógicamente, conectando los puntos de manera coherente.
* **Estructura Jerárquica y Puntos Clave:** Organiza el resumen de forma que los **hallazgos más importantes resalten**. Utiliza viñetas y negritas para facilitar la lectura rápida y la identificación de los aspectos cruciales del juicio.

El objetivo de este resumen analítico es transformarme en una herramienta estratégica que permita a los abogados realizar una revisión eficiente del juicio, identificar oportunidades de apelación y refinar sus habilidades de litigación con base en evidencia concreta."

`;
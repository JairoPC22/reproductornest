export const promptLegalPdfExpLegalSummarize = `
"Procederé al análisis exhaustivo y riguroso de una serie de documentos legales. Mi objetivo es extraer y sintetizar la información de manera completamente precisa, concisa y exhaustiva, asegurando que cada dato sea directamente verificable desde los documentos proporcionados, sin suponer, interpretar o resumir información no explícita. La altísima importancia legal de esta tarea exige una rigurosidad absoluta y la entrega de información inmediatamente accionable para la toma de decisiones.

El informe final deberá contener la siguiente estructura y tipo de información, garantizando una claridad excepcional, un lenguaje directo y la ausencia total de redundancias, apto incluso para audiencias sin conocimiento previo del caso:

1. Partes Implicadas y Roles Centrales:
- Identificación exhaustiva de TODOS los actores relevantes:
   - Listado completo de todas las personas físicas y/o morales (ej., empresas, instituciones, dependencias gubernamentales) que son mencionadas o involucradas de alguna manera en la documentación.
- Determinación de Roles y Caracteres Jurídicos:
   - Para cada actor identificado, especifica su rol o carácter procesal/jurídico exacto dentro del acto o proceso (ej., Denunciante, Querellante, Víctima Directa, Víctima Indirecta, Imputado/Acusado, Demandado, Actor, Autoridad Jurisdiccional [Juez], Autoridad Investigadora [Ministerio Público, Policía], Perito [con su especialidad], Defensor Público/Privado, Asesor Jurídico de Víctimas, Notario Público, Testigo, etc.).
- Relación con el Objeto Jurídico y entre Partes:
   - Analiza y describe concisamente la relación que cada parte tiene con el objeto central del acto jurídico. ¿Son directamente afectados, responsables, facilitadores, o meros observadores?
   - Si la documentación lo permite, identifica la relación entre las partes clave (ej., víctima-imputado, demandante-demandado, autoridad-ciudadano).
- Situación Actual de las Partes (si es discernible):
   - Indica brevemente la situación procesal o jurídica actual de las partes más relevantes según la documentación (ej., "En calidad de detenido", "Citado a comparecer", "Representando legalmente a la víctima", "Sin situación jurídica definida aún").

2. Objeto Central del Acto Jurídico y Fechas Clave:
- Determinación Inequívoca del Objeto Principal:
   - Define de forma inequívoca, concisa y precisa la naturaleza principal y el objetivo central del acto o proceso jurídico que abarca la documentación. Esto debe ser la esencia del caso. (Ej., "Investigación por el delito de Fraude Específico", "Procedimiento de Divorcio Necesario por X causa", "Demanda Laboral por Despido Injustificado", "Formalización de Contrato de Compraventa Inmobiliaria").
   - Identifica si existen objetos secundarios o conexos que, aunque no sean el principal, sean relevantes para entender la complejidad del caso.
- Identificación y Contextualización de Todas las Fechas Clave:
   - Enuncia la fecha de inicio del acto jurídico principal, si está explícitamente indicada.
   - Lista todas las fechas significativas que aparezcan en los documentos y que representen hitos procesales, plazos, eventos relevantes o puntos de inflexión en el desarrollo del caso.
   - Para cada fecha, describe brevemente qué sucedió o qué representa (ej., "Fecha de la denuncia", "Fecha de notificación de demanda", "Fecha límite para presentar pruebas", "Fecha de celebración de audiencia X").
   - Identifica cualquier fecha límite o plazo perentorio que se desprenda de la documentación y que sea crítico para la estrategia legal.


3. Inventario Documental Analítico:
- Genera un listado cronológico y numerado de todos los documentos proporcionados.
- Para cada documento, la información debe ser granular y precisa:
   - Tipo de Documento: (Ej., "Denuncia de Hechos", "Acuerdo Ministerial", "Dictamen Pericial [Tipo de Pericia]", "Acta Circunstanciada", "Constancia de No Antecedentes").
   - Fecha de Emisión: (Formato Día/Mes/Año).
   - Autoridad/Instancia Emisora: Identificación precisa de la entidad o persona que lo generó (ej., "Fiscalía Especializada en Delitos Financieros", "Juzgado de Control del Distrito X", "Perito Forense Lic. [Nombre]", "Policía de Investigación [Número de Elemento]").
   - Quién Firma: Nombre(s) completo(s) y cargo(s) exacto(s) de la(s) persona(s) que lo autorizan.
   - Dirigido A: Nombre de la parte o autoridad a la que está formalmente dirigido.
   - Contenido Esencial y Propósito (Síntesis Concisa): Proporciona un resumen extremadamente concentrado del propósito fundamental y los datos más relevantes que el documento aporta al caso. Responde a: ¿Cuál es el hallazgo clave o la acción principal que este documento registra? ¿Qué aporta al entendimiento del proceso? Esta síntesis debe ser estrictamente extraída del texto del documento, sin inferencias.
4. Síntesis Estratégica Global del Proceso (Para Toma de Decisiones):
- Articula una narrativa fluida y comprensiva que integre los hallazgos más críticos de toda la documentación.
- Esta síntesis debe responder a las siguientes preguntas clave para un lector sin conocimiento previo, con el objetivo de facilitar la toma de decisiones:
  - ¿Cuáles son los hechos o argumentos centrales de cada parte principal (acusación/demanda vs. defensa/respuesta)? (Es decir, qué busca probar o refutar cada lado según los documentos).
   - ¿Quiénes son los involucrados principales y cuál es su situación actual?
   - ¿Cuáles son las principales pruebas aportadas hasta ahora por cada parte y cuál es su relevancia aparente? (Breve mención de las pruebas clave y por qué son importantes).
   - ¿Existen discrepancias o inconsistencias significativas entre los documentos o testimonios que puedan ser explotadas? (Se busca la base para contradicciones o nulidades).
   - ¿Se ha identificado alguna omisión o vacío crucial en la documentación existente que deba ser abordada? (Permite saber qué falta para construir un caso sólido).
   - ¿Cuáles son los pasos procesales/legales cruciales que se han dado hasta ahora y en qué fechas?
   - ¿Cuál es el estado actual de la situación jurídica o investigación según la documentación? (Ej., "La investigación se encuentra en fase preliminar", "Se ha dictado auto de vinculación a proceso por...", "El trámite está a la espera de resolución de...").
   - ¿Cuáles son los próximos pasos procesales/legales previsibles o las acciones que se requieren de inmediato? (Indica el horizonte de acción a corto y mediano plazo).
   - ¿Existe algún punto de urgencia, riesgo o ventaja clave evidente en la documentación? (Indicarlo de forma objetiva).
   - ¿Se pueden inferir posibles resultados o escenarios (favorable, desfavorable) basados en la información actual? (Una evaluación preliminar y objetiva de la posición del caso).
 - Prioriza la máxima claridad, objetividad y concisión. Cada afirmación debe ser directamente verificable y trazable a los documentos.
Consideraciones Fundamentales para la Calidad del Análisis:
- Exactitud Absoluta y Probatoriedad:
   - Cada pieza de información, nombre, fecha, rol o dato presentado debe ser 100% exacto y directamente verificable en el documento fuente correspondiente.
   - Cualquier afirmación en el resumen debe poder ser respaldada por una referencia explícita al documento y, si es posible, a un párrafo o sección específica (indicando "según el documento X, página Y, párrafo Z").
   - No se tolerará la inferencia o suposición si no está inequívocamente respaldada por el texto documental.
- Claridad Inequívoca y Comprensibilidad Universal:
   - El lenguaje utilizado debe ser cristalino, directo y desprovisto de ambigüedades.
   - La información debe ser comprensible para cualquier persona, incluso sin conocimientos jurídicos previos o sin familiaridad con el caso. Si se utiliza jerga legal, debe ser mínima y autoexplicativa por contexto.
   - La estructura y redacción deben facilitar la lectura rápida y la asimilación inmediata de los puntos clave.
- Objetividad Rigurosa e Imparcialidad Total:
   - El análisis y resumen deben ser estrictamente imparciales y objetivos. No se emitirán juicios de valor, opiniones personales, ni se favorecerá la postura de ninguna de las partes.
   - Los hechos y datos se presentarán tal cual aparecen en los documentos, sin sesgos o interpretaciones subjetivas.
- Exhaustividad sin Redundancia:
   - Asegura que toda la información pertinente y de relevancia estratégica esté incluida en el resumen.
   - Al mismo tiempo, la información debe ser presentada de la forma más sintetizada y eficiente posible, eliminando repeticiones innecesarias o detalles irrelevantes que no contribuyan a la comprensión del caso o a la toma de decisiones.
- Manejo Preciso de Ausencias y Ambigüedades Documentales:
   - Si un dato crucial es inexistente, incompleto, contradictorio o ambiguo en la documentación, esta limitación debe ser reflejada explícitamente en el resumen (ej., "El documento no especifica el nombre completo de...", "La fecha es ilegible en la copia del documento X, pero se infiere que es...", "Existe una contradicción entre el documento A y el B respecto a...").
   - No se deben generar datos o completar información que no esté directamente presente.
- Orientación a la Accionabilidad y Estrategia:
   - La información debe ser seleccionada y estructurada para ser directamente utilizable por los abogados en la formulación de estrategias legales, la preparación de defensas, o la toma de decisiones clave sobre el curso del proceso.
   - El resumen debe anticipar las necesidades informativas de un estratega legal.

Con este prompt, mi compromiso es entregar un análisis inquebrantable en exactitud y claridad, la piedra angular confiable para cada decisión estratégica y el éxito legal, garantizando la probatoriedad absoluta en cada detalle."

`;
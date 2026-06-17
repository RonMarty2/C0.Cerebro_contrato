# Mapa de fases academicas contra cerebros

Este mapa evita duplicar logica: cada cerebro es duenio de un tipo de decision y entrega outputs reutilizables por handoff.

| Fase | Documentos | Cerebro principal | Cerebros consumidores | Outputs esperados |
| --- | --- | --- | --- | --- |
| `intake` | todos | `WEBAPP` | `academic-planner-brain`, `document-composer-brain` | `ProjectEnvelope`, restricciones, datos faltantes |
| `topic_definition` | proyecto de grado, tesis, monografia | `academic-planner-brain` | `research-evidence-brain`, `methodology-brain` | tema, problema, objetivos, alcance |
| `business_idea_definition` | plan de negocio, factibilidad, prefactibilidad | `business-model-brain` | `market-intelligence-engine`, `financial-feasibility-brain` | idea, propuesta de valor, modelo de ingresos |
| `literature_review` | proyecto de grado, tesis, monografia | `research-evidence-brain` | `document-composer-brain`, `validation-brain` | fuentes, marco teorico, brechas |
| `methodology_design` | proyecto de grado, tesis, monografia, factibilidad | `methodology-brain` | `market-intelligence-engine`, `validation-brain` | enfoque metodologico, variables, instrumentos |
| `market_analysis` | plan de negocio, factibilidad, prefactibilidad | `market-intelligence-engine` | `simuladorPRO`, `financial-feasibility-brain`, `document-composer-brain` | segmentos, demanda, competencia, advertencias |
| `technical_operational_study` | plan de negocio, factibilidad, prefactibilidad | `operations-brain` | `simuladorPRO`, `financial-feasibility-brain` | capacidad, procesos, recursos, riesgos |
| `financial_feasibility` | plan de negocio, factibilidad, prefactibilidad | `financial-feasibility-brain` | `simuladorPRO`, `validation-brain`, `document-composer-brain` | VAN, TIR, punto de equilibrio, escenarios |
| `scenario_simulation` | plan de negocio, factibilidad, prefactibilidad | `simuladorPRO` | `financial-feasibility-brain`, `validation-brain` | escenarios, sensibilidad, supuestos de simulacion |
| `legal_environmental_review` | factibilidad, prefactibilidad, plan de negocio | `compliance-brain` | `validation-brain`, `document-composer-brain` | requisitos legales, permisos, riesgos |
| `chapter_drafting` | todos | `document-composer-brain` | `citation-brain`, `validation-brain` | secciones redactadas, citas, pendientes |
| `citation_review` | todos | `citation-brain` | `document-composer-brain`, `validation-brain` | citas normalizadas, bibliografia, fuentes invalidas |
| `integrated_validation` | todos | `validation-brain` | `WEBAPP`, `document-composer-brain` | inconsistencias, bloqueo por pendientes, aprobacion |
| `defense_preparation` | proyecto de grado, tesis, plan de negocio | `defense-coach-brain` | `WEBAPP` | resumen ejecutivo, preguntas esperadas, argumentos |

## Reglas de ruteo

- WEBAPP crea el `BrainRequest` de cada fase con el `ProjectEnvelope` vigente.
- El cerebro principal produce `BrainResponse.result` y al menos un `HandoffBlock`.
- Los consumidores solo usan `handoff.payload`, `approved_phase_outputs` y `current_inputs`; no recomputan la logica del cerebro principal.
- Si un output tiene numeros, debe llegar como `QuantitativeValue`.
- Si faltan fuentes o datos, el cerebro devuelve `warnings` y `validations` con `pending_input`.

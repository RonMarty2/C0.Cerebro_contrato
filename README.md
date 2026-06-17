# academic-brains-contract

Contrato comun para que WEBAPP, simuladorPRO, market-intelligence-engine y futuros motores academicos/profesionales hablen el mismo idioma.

El paquete define modelos TypeScript, JSON Schema, ejemplos y pruebas para documentos como proyecto de grado, tesis, monografia, plan de negocio, factibilidad, prefactibilidad y variantes futuras.

## Estructura

```text
src/index.ts                                      # Modelos TypeScript
schemas/academic-brains-contract.schema.json     # Schema canonico con $defs
schemas/project-envelope.schema.json             # Wrapper ProjectEnvelope
schemas/brain-request.schema.json                # Wrapper BrainRequest
schemas/brain-response.schema.json               # Wrapper BrainResponse
examples/*.json                                  # Requests/responses de referencia
docs/phase-brain-map.md                          # Mapa humano de fases contra cerebros
docs/phase-brain-map.json                        # Mapa reutilizable por WEBAPP
tests/contract.test.js                           # Validacion AJV + invariantes
```

## Modelos base

- `ProjectEnvelope`: contexto comun y estado aprobado del proyecto.
- `BrainRequest`: solicitud de WEBAPP o de un cerebro hacia otro motor.
- `BrainResponse`: respuesta reusable con resultado, trazabilidad, evidencia, validaciones, warnings y handoff.
- `EvidenceItem`: fuente verificable o entrada interna declarada.
- `TraceStep`: paso de razonamiento, calculo o transformacion.
- `AssumptionItem`: supuesto explicito, confianza y outputs afectados.
- `HandoffBlock`: bloque de salida que declara a que cerebros alimenta despues.
- `ValidationResult`: resultado de validaciones y `pending_input`.
- `AcademicContext`, `BusinessContext`, `FinancialContext`, `MarketContext`, `DocumentContext`: vistas especializadas del contexto.

## Reglas del contrato

1. Ningun cerebro devuelve numeros crudos en `BrainResponse.result`.
2. Todo numero debe ir como `QuantitativeValue` con `value`, `unit`, `trace_step_ids` y `evidence_ids`.
3. Ningun cerebro inventa fuentes: si la fuente no existe, devuelve `warning` o `pending_input`.
4. Los cerebros no duplican logica: consumen `handoff.payload` de cerebros anteriores.
5. Todo output reusable declara su siguiente consumidor en `handoff.to_brains`.
6. Si falta informacion, la respuesta usa `status: "needs_input"` o `status: "partial"` con `warnings` y `validations`.
7. Cambios incompatibles requieren un nuevo `contract_version`.

## Como WEBAPP orquesta

WEBAPP no calcula la logica de dominio de los cerebros. WEBAPP actua como orquestador, validador y memoria de proyecto.

Flujo recomendado:

1. Construir un `ProjectEnvelope` con datos academicos, de negocio, financieros, de mercado y documento.
2. Seleccionar el `target_brain` segun `phase_id` y `docs/phase-brain-map.json`.
3. Enviar un `BrainRequest` con `current_inputs`, `approved_phase_outputs`, `assumptions`, `constraints` y `requested_outputs`.
4. Validar la respuesta contra `schemas/brain-response.schema.json`.
5. Ejecutar invariantes de contrato: numeros trazables, referencias existentes, handoff declarado y fuentes no vacias.
6. Si `status` es `needs_input`, mostrar al usuario `warnings.pending_input` y no avanzar la fase.
7. Si `status` es `partial`, permitir avance condicionado solo cuando la fase acepte pendientes.
8. Si `status` es `completed`, guardar `result` como candidato de salida de fase.
9. Cuando el usuario aprueba, mover los outputs a `ProjectEnvelope.approved_phase_outputs`.
10. Crear los siguientes `BrainRequest` a partir de `handoff`, sin recomputar logica de otro cerebro.

## Versionado

`contract_version` inicia en `1.0.0`.

Cambios compatibles:

- agregar un campo opcional,
- agregar un nuevo `document_type` solo si los consumidores lo toleran,
- agregar ejemplos o docs.

Cambios incompatibles:

- renombrar o eliminar campos,
- cambiar semantica de un campo existente,
- permitir numeros crudos en `BrainResponse.result`,
- quitar `trace`, `evidence`, `warnings` o `handoff`.

Todo cambio incompatible debe publicarse como una nueva version de contrato y mantener adaptadores para motores antiguos.

## Uso

Instalar dependencias y ejecutar validaciones:

```bash
npm install
npm test
npm run typecheck
```

Validar desde WEBAPP:

```ts
import type { BrainRequest, BrainResponse, ProjectEnvelope } from "academic-brains-contract";

const request: BrainRequest = {
  contract_version: "1.0.0",
  request_id: "req_001",
  source_brain: "WEBAPP",
  target_brain: "market-intelligence-engine",
  task: {
    task_id: "market_analysis",
    name: "Analisis de mercado",
    instructions: "Generar outputs reutilizables sin inventar fuentes."
  },
  envelope,
  contexts: {},
  upstream_handoff: [],
  requested_outputs: ["customer_segments"],
  meta: { created_at: new Date().toISOString() }
};
```

## Consumidores iniciales

- `WEBAPP`: orquesta, valida, solicita datos faltantes y persiste outputs aprobados.
- `market-intelligence-engine`: produce mercado, segmentos, demanda y fuentes.
- `simuladorPRO`: consume supuestos trazables y produce escenarios.
- `financial-feasibility-brain`: calcula indicadores financieros con evidencia y trace.
- `document-composer-brain`: redacta secciones usando outputs aprobados, citas y warnings.
- `validation-brain`: revisa coherencia, cumplimiento academico y bloqueo por pendientes.

Ver el mapa completo en `docs/phase-brain-map.md`.

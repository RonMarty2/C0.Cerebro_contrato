const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Ajv2020 = require("ajv/dist/2020");

const rootDir = path.resolve(__dirname, "..");

const SCHEMA_IDS = {
  projectEnvelope: "https://academic-brains-contract.dev/schemas/project-envelope.schema.json",
  brainRequest: "https://academic-brains-contract.dev/schemas/brain-request.schema.json",
  brainResponse: "https://academic-brains-contract.dev/schemas/brain-response.schema.json"
};

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), "utf8"));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildAjv() {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: false
  });

  [
    "schemas/academic-brains-contract.schema.json",
    "schemas/project-envelope.schema.json",
    "schemas/brain-request.schema.json",
    "schemas/brain-response.schema.json"
  ].forEach((schemaPath) => ajv.addSchema(readJson(schemaPath)));

  return ajv;
}

function getValidator(ajv, schemaId) {
  const validate = ajv.getSchema(schemaId);
  assert.ok(validate, `Missing schema validator: ${schemaId}`);
  return validate;
}

function assertSchemaValid(validate, value) {
  const valid = validate(value);
  assert.equal(valid, true, JSON.stringify(validate.errors, null, 2));
}

function assertSchemaInvalid(validate, value) {
  const valid = validate(value);
  assert.equal(valid, false, "Expected schema validation to fail");
}

function assertUnique(ids, label) {
  const seen = new Set();
  ids.forEach((id) => {
    assert.equal(seen.has(id), false, `Duplicate ${label}: ${id}`);
    seen.add(id);
  });
}

function assertKnownRefs(ids, known, label, ownerPath) {
  ids.forEach((id) => {
    assert.equal(known.has(id), true, `${ownerPath} references unknown ${label}: ${id}`);
  });
}

function assertResponseInvariants(response) {
  const traceIds = new Set(response.trace.map((step) => step.trace_step_id));
  const evidenceIds = new Set(response.evidence.map((item) => item.evidence_id));
  const assumptionIds = new Set(response.assumptions.map((item) => item.assumption_id));

  assertUnique([...traceIds], "trace_step_id");
  assertUnique([...evidenceIds], "evidence_id");
  assertUnique([...assumptionIds], "assumption_id");

  response.trace.forEach((step) => {
    assertKnownRefs(step.evidence_ids, evidenceIds, "evidence_id", `trace.${step.trace_step_id}`);
    assertKnownRefs(step.assumption_ids, assumptionIds, "assumption_id", `trace.${step.trace_step_id}`);
    assertKnownRefs(step.depends_on, traceIds, "trace_step_id", `trace.${step.trace_step_id}`);
  });

  response.validations.forEach((validation) => {
    assertKnownRefs(validation.trace_step_ids, traceIds, "trace_step_id", `validations.${validation.validation_id}`);
    assertKnownRefs(validation.evidence_ids, evidenceIds, "evidence_id", `validations.${validation.validation_id}`);
  });

  response.evidence.forEach((evidence) => {
    assert.ok(evidence.source_name.trim(), `evidence.${evidence.evidence_id} must declare source_name`);
    assert.ok(evidence.citation.trim(), `evidence.${evidence.evidence_id} must declare citation`);
    if (evidence.source_type !== "internal_input") {
      assert.ok(
        evidence.url || evidence.locator,
        `evidence.${evidence.evidence_id} must declare url or locator for non-internal sources`
      );
    }
  });

  const quantitativePaths = [];
  const visitResultValue = (value, valuePath) => {
    if (typeof value === "number") {
      throw new Error(`Raw number found at ${valuePath}; use QuantitativeValue with trace and evidence`);
    }

    if (!value || typeof value !== "object") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => visitResultValue(item, `${valuePath}[${index}]`));
      return;
    }

    if (value.kind === "quantitative_value") {
      quantitativePaths.push(valuePath);
      assert.ok(value.trace_step_ids.length > 0, `${valuePath} must reference at least one trace_step_id`);
      assert.ok(value.evidence_ids.length > 0, `${valuePath} must reference at least one evidence_id`);
      assertKnownRefs(value.trace_step_ids, traceIds, "trace_step_id", valuePath);
      assertKnownRefs(value.evidence_ids, evidenceIds, "evidence_id", valuePath);
      assertKnownRefs(value.assumption_ids || [], assumptionIds, "assumption_id", valuePath);
      return;
    }

    Object.entries(value).forEach(([key, item]) => visitResultValue(item, `${valuePath}.${key}`));
  };

  visitResultValue(response.result, "result");
  response.handoff.forEach((block) => {
    assert.ok(block.to_brains.length > 0, `handoff.${block.handoff_id} must declare downstream brains`);
    visitResultValue(block.payload, `handoff.${block.handoff_id}.payload`);
  });

  if (response.status === "needs_input") {
    const hasPendingWarning = response.warnings.some((warning) => Boolean(warning.pending_input));
    const hasPendingValidation = response.validations.some((validation) => validation.status === "pending_input");
    assert.ok(hasPendingWarning || hasPendingValidation, "needs_input responses must declare pending_input");
  }

  return quantitativePaths;
}

test("BrainRequest example validates against JSON Schema", () => {
  const ajv = buildAjv();
  const validate = getValidator(ajv, SCHEMA_IDS.brainRequest);
  assertSchemaValid(validate, readJson("examples/brain-request.plan-negocio.market.json"));
});

test("ProjectEnvelope inside request validates independently", () => {
  const ajv = buildAjv();
  const validate = getValidator(ajv, SCHEMA_IDS.projectEnvelope);
  const request = readJson("examples/brain-request.plan-negocio.market.json");
  assertSchemaValid(validate, request.envelope);
});

test("BrainResponse examples validate and satisfy contract invariants", () => {
  const ajv = buildAjv();
  const validate = getValidator(ajv, SCHEMA_IDS.brainResponse);

  [
    "examples/brain-response.market.valid.json",
    "examples/brain-response.pending-input.json"
  ].forEach((examplePath) => {
    const response = readJson(examplePath);
    assertSchemaValid(validate, response);
    assertResponseInvariants(response);
  });
});

test("Raw numbers in BrainResponse.result are rejected", () => {
  const ajv = buildAjv();
  const validate = getValidator(ajv, SCHEMA_IDS.brainResponse);
  const response = readJson("examples/brain-response.market.valid.json");

  response.result.raw_market_size = 12345;

  assertSchemaInvalid(validate, response);
  assert.throws(
    () => assertResponseInvariants(response),
    /Raw number found/
  );
});

test("Quantitative values must reference existing trace and evidence", () => {
  const ajv = buildAjv();
  const validate = getValidator(ajv, SCHEMA_IDS.brainResponse);
  const response = clone(readJson("examples/brain-response.market.valid.json"));

  response.result.preliminary_annual_revenue.evidence_ids = ["ev_missing"];

  assertSchemaValid(validate, response);
  assert.throws(
    () => assertResponseInvariants(response),
    /unknown evidence_id/
  );
});

test("Phase map declares owners, consumers and expected outputs", () => {
  const phaseMap = readJson("docs/phase-brain-map.json");
  const phaseIds = new Set();

  phaseMap.forEach((phase) => {
    assert.ok(phase.phase_id, "phase_id is required");
    assert.equal(phaseIds.has(phase.phase_id), false, `Duplicate phase_id: ${phase.phase_id}`);
    phaseIds.add(phase.phase_id);
    assert.ok(phase.primary_brain, `phase ${phase.phase_id} must declare primary_brain`);
    assert.ok(Array.isArray(phase.consumer_brains), `phase ${phase.phase_id} must declare consumer_brains`);
    assert.ok(phase.expected_outputs.length > 0, `phase ${phase.phase_id} must declare expected_outputs`);
  });
});

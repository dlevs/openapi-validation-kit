// @ts-nocheck TODO: TURN THIS OFF
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
// TODO: Naming
import rawSchemas from './data/schemas.json';
// TODO: Options
const ajv = new Ajv({ coerceTypes: 'array', useDefaults: 'empty' });
addFormats(ajv);
const schemaMeta = {};
const addSchema = (schema, id, subjectSpecific, subjectEntire) => {
    ajv.addSchema(schema, id);
    schemaMeta[id] = {
        subjectSpecific,
        subjectEntire,
        getValidate() {
            // Compilation happens at this point, the first time it is called.
            return ajv.getSchema(id);
        },
    };
};
for (const [operationId, { params, query, headers, requestBody, responseBody },] of Object.entries(rawSchemas)) {
    addSchema(params, `${operationId}:params`, 'Request path parameter', 'Request path');
    addSchema(query, `${operationId}:query`, 'Request query parameter', 'Request query');
    addSchema(headers, `${operationId}:headers`, 'Request header', 'Request headers');
    addSchema(requestBody, `${operationId}:requestBody`, 'Request body property', 'Request body');
    for (const [status, responseBodySchema] of Object.entries(responseBody)) {
        addSchema(responseBodySchema, `${operationId}:responseBody:${status}`, 'Response body property', 'Response body');
    }
}
export class ValidationError extends Error {
    constructor(errors, schemaMeta) {
        const message = errors
            ?.map((error) => {
            if (error.instancePath) {
                return `${schemaMeta.subjectSpecific} '${error.instancePath
                    .replace(/^\//, '')
                    .replace(/\//g, '.')}' ${error.message}`;
            }
            return `${schemaMeta.subjectEntire} ${error.message}`;
        })
            .join('\n');
        super(message);
        this.errors = errors;
    }
}
function createValidator(id) {
    return function validate(data) {
        const schema = schemaMeta[id];
        if (!schema) {
            throw new Error(`No schema exists with ID "${id}"`);
        }
        const validate = schema.getValidate();
        if (!validate(data) && validate.errors) {
            throw new ValidationError(validate.errors, schema);
        }
    };
}
export const validators = Object.fromEntries(
// TODO: Object.keys
Object.entries(rawSchemas).map(([operationId]) => {
    // TODO: It's all a bit convoluted - why loop through above, and here?
    return [
        operationId,
        {
            params: createValidator(`${operationId}:params`),
            query: createValidator(`${operationId}:query`),
            headers: createValidator(`${operationId}:headers`),
            requestBody: createValidator(`${operationId}:requestBody`),
            responseBody: (data, status) => {
                const responses = rawSchemas[operationId]
                    .responseBody;
                const statusCategory = `${String(status)[0]}XX`;
                const statusKey = status in responses
                    ? status
                    : statusCategory in responses
                        ? statusCategory
                        : 'default';
                // TODO: Too convoluted
                return createValidator(`${operationId}:responseBody:${statusKey}`)(data);
            },
        },
    ];
}));

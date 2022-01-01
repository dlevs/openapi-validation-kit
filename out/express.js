import { ValidationError, validators } from './validatorsBase.js';
export const wrapRoute = Object.fromEntries(
// TODO: Object.key
Object.entries(validators).map(([operationId]) => {
    return [operationId, createHandlerWrapper(operationId)];
}));
function createHandlerWrapper(operationId) {
    return function wrapHandlerWithValidation(handler) {
        // TODO: HOC - read function name here for stacktrace
        return async function handlerWithValidation(req, res, next) {
            try {
                validators[operationId].params(req.params);
                validators[operationId].query(req.query);
                validators[operationId].headers(req.headers);
                validators[operationId].requestBody(req.body);
            }
            catch (err) {
                if (err instanceof ValidationError) {
                    res.status(422);
                    return next(err);
                }
            }
            function send(status, body) {
                try {
                    validators[operationId].responseBody(body, status);
                }
                catch (err) {
                    if (err instanceof ValidationError) {
                        res.status(422);
                        return next(err);
                    }
                }
                res.status(status).send(body);
                return modifiedRes;
            }
            const modifiedRes = {
                ...res,
                send(body) {
                    return send(200, body);
                },
                status(status) {
                    // TODO: It's a bug that we don't set status if `send()` never called. Fix
                    return {
                        ...modifiedRes,
                        send(body) {
                            return send(status, body);
                        },
                    };
                },
            };
            return handler(req, 
            // @ts-expect-error
            modifiedRes, next);
        };
    };
}

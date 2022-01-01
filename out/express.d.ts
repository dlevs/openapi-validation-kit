import type { Request, Response, NextFunction, Handler } from 'express';
import { Requests } from './data/Requests.js';
import { OperationId, ResponseBody } from './types.js';
export declare const wrapRoute: {
    findPets: WrapHandlerWithValidation<"findPets">;
    addPet: WrapHandlerWithValidation<"addPet">;
    "find pet by id": WrapHandlerWithValidation<"find pet by id">;
    deletePet: WrapHandlerWithValidation<"deletePet">;
};
interface ResponseSend<T> {
    send(data: T): void;
    json(data: T): void;
}
declare type ValidatedRequest<ID extends OperationId> = Request<Requests[ID]['params'], Requests[ID]['responseBody'][keyof Requests[ID]['responseBody']], Requests[ID]['requestBody'], Requests[ID]['query']>;
declare type ValidatedResponse<ID extends OperationId> = Omit<Response, 'status' | 'send' | 'json'> & {
    status<Status extends number>(code: Status): ResponseSend<ResponseBody<ID, Status>>;
} & ResponseSend<ResponseBody<ID, 200>>;
declare type WrapHandlerWithValidation<ID extends OperationId> = (handler: HandlerWithValidation<ID>) => Handler;
declare type HandlerWithValidation<ID extends OperationId = OperationId> = (req: ValidatedRequest<ID>, res: ValidatedResponse<ID>, next: NextFunction) => void;
export {};

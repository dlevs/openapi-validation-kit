import { Requests } from './data/Requests.js';
export declare type StatusCategory<T extends number> = `${T}` extends `${infer First}${number}` ? `${First}XX` : never;
export declare type OperationId = keyof Requests;
export declare type ResponseBodyBase<ID extends keyof Requests, Status> = Extract<Requests[ID]['responseBody'], {
    status: Status;
}>['body'];
export declare type ResponseBody<ID extends keyof Requests, Status extends number> = ResponseBodyBase<ID, `${Status}`> extends never ? ResponseBodyBase<ID, StatusCategory<Status>> extends never ? ResponseBodyBase<ID, 'default'> : ResponseBodyBase<ID, StatusCategory<Status>> : ResponseBodyBase<ID, `${Status}`>;

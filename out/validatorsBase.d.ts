import { ErrorObject } from 'ajv';
import { ResponseBody } from './types.js';
import { AnyValidateFunction } from 'ajv/dist/core.js';
interface SchemaMeta {
    subjectSpecific: string;
    subjectEntire: string;
    getValidate(): AnyValidateFunction;
}
export declare class ValidationError extends Error {
    errors: ErrorObject[];
    constructor(errors: ErrorObject[], schemaMeta: SchemaMeta);
}
declare type ValidateFn<T> = (data: any) => asserts data is T;
export declare const validators: Readonly<{
    findPets: Readonly<{
        params: (data: any) => asserts data is {};
        query: ValidateFn<{
            [k: string]: unknown;
            tags?: string[] | undefined;
            limit?: number | undefined;
        }>;
        headers: ValidateFn<{
            [k: string]: unknown;
        }>;
        requestBody: ValidateFn<never>;
        responseBody: <Status extends number>(data: unknown, status: Status) => asserts data is ResponseBody<"findPets", Status>;
    }>;
    addPet: Readonly<{
        params: (data: any) => asserts data is {};
        query: ValidateFn<{
            [k: string]: unknown;
        }>;
        headers: ValidateFn<{
            [k: string]: unknown;
        }>;
        requestBody: ValidateFn<import("./data/Requests.js").NewPet>;
        responseBody: <Status_1 extends number>(data: unknown, status: Status_1) => asserts data is ResponseBody<"addPet", Status_1>;
    }>;
    "find pet by id": Readonly<{
        params: (data: any) => asserts data is {
            id: number;
        };
        query: ValidateFn<{
            [k: string]: unknown;
        }>;
        headers: ValidateFn<{
            [k: string]: unknown;
        }>;
        requestBody: ValidateFn<never>;
        responseBody: <Status_2 extends number>(data: unknown, status: Status_2) => asserts data is ResponseBody<"find pet by id", Status_2>;
    }>;
    deletePet: Readonly<{
        params: (data: any) => asserts data is {
            id: number;
        };
        query: ValidateFn<{
            [k: string]: unknown;
        }>;
        headers: ValidateFn<{
            [k: string]: unknown;
        }>;
        requestBody: ValidateFn<never>;
        responseBody: <Status_3 extends number>(data: unknown, status: Status_3) => asserts data is ResponseBody<"deletePet", Status_3>;
    }>;
}>;
export {};

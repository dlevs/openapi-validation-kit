// ------------------------------------------------------------------
// Example file.
//
// This file is overwritten by when running the CLI. It exists for
// development purposes, so we have types to work with.
// ------------------------------------------------------------------

import { Requests } from './data/Requests.js'

// Status filter types
export type StatusCategory<T extends number> =
  `${T}` extends `${infer First}${number}` ? `${First}XX` : never

// Related to `Requests` type
export type OperationId = keyof Requests
export type ResponseBodyBase<ID extends keyof Requests, Status> = Extract<
  Requests[ID]['responseBody'],
  { status: Status }
>['body']

export type ResponseBody<
  ID extends keyof Requests,
  Status extends number
> = ResponseBodyBase<ID, `${Status}`> extends never
  ? ResponseBodyBase<ID, StatusCategory<Status>> extends never
    ? ResponseBodyBase<ID, 'default'>
    : ResponseBodyBase<ID, StatusCategory<Status>>
  : ResponseBodyBase<ID, `${Status}`>

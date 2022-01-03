import { OpenAPIV3 } from 'openapi-types'

// Status filter types
export type StatusCategory<T extends number> =
  `${T}` extends `${infer First}${number}` ? `${First}XX` : never

// Related to `Requests` type
export type ResponseBodyBase<T extends RequestType, Status> = Extract<
  T['responseBody'],
  { status: Status }
>['body']

export type ResponseBody<
  T extends RequestType,
  Status extends number
> = ResponseBodyBase<T, `${Status}`> extends never
  ? ResponseBodyBase<T, StatusCategory<Status>> extends never
    ? ResponseBodyBase<T, 'default'>
    : ResponseBodyBase<T, StatusCategory<Status>>
  : ResponseBodyBase<T, `${Status}`>

export interface RequestSchema {
  params: OpenAPIV3.SchemaObject
  query: OpenAPIV3.SchemaObject
  headers: OpenAPIV3.SchemaObject
  requestBody: OpenAPIV3.SchemaObject
  responseBody: Record<string, OpenAPIV3.SchemaObject>
}

export interface RequestType {
  params: Record<string, unknown>
  query: Record<string, unknown>
  headers: Record<string, unknown>
  requestBody: unknown
  responseBody: { status: string; body: unknown }
}

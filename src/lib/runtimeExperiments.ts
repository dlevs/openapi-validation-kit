// Existing implementation in `runtime.ts` counts on making unions of ALL
// standard http status codes. This is kinda nice, but then, you can't
// use non-standard codes.
//
// This file attempts to model things more completely by using strings,
// and template literal types.
//
// There are drawbacks:
// - I'd rather not use string status codes. Minor.
// - If you define responses `200`, `2XX` and `default`, they're all valid
//   for "status 200" responses. Not ideal.
//
// Despite the above, this is probably better. But if the types inherit,
// should validation, too? E.g. validate one of 200, 2XX or default? It's
// not really the way anyone expects it to work?
//
//----------------------------------------------------------------------

type Req = {
  addPet: {
    responseBody:
      | { status: '200'; body: { foo: '200!' } }
      | { status: '404'; body: { foo: '404!' } }
      | { status: '4XX'; body: { foo: 'four!' } }
      | { status: 'default'; body: { foo: 'default!' } }
  }
}

type ResponseBody<ID extends keyof Req, Status> = Extract<
  Req[ID]['responseBody'],
  { status: Status }
>['body']

type StatusCategoriesXX = `${1 | 2 | 3 | 4 | 5}${number}${number}`
type GetStatusCategory<T> = T extends `${infer First}XX` ? `${First}XX` : never
type GetStatusCategoryMatcher<T> = T extends `${infer First}XX`
  ? `${First}${number}${number}`
  : never
type FilterStatusExact<T> = T extends `${number}` ? T : never

type ResponseReturnExact<ID extends keyof Req> = {
  [Status in FilterStatusExact<Req[ID]['responseBody']['status']>]: {
    status: Status
    body: ResponseBody<ID, Status>
  }
}[FilterStatusExact<Req[ID]['responseBody']['status']>]

type ResponseReturnCategory<ID extends keyof Req> = {
  [Status in GetStatusCategory<Req[ID]['responseBody']['status']>]: {
    status: GetStatusCategoryMatcher<Status>
    body: ResponseBody<ID, Status>
  }
}[GetStatusCategory<Req[ID]['responseBody']['status']>]

type ResponseReturnDefault<ID extends keyof Req> = {
  [Status in Exclude<
    StatusCategoriesXX,
    GetStatusCategoryMatcher<Req[ID]['responseBody']['status']>
  >]: {
    status: Status
    body: ResponseBody<ID, 'default'>
  }
}[Exclude<
  StatusCategoriesXX,
  GetStatusCategoryMatcher<Req[ID]['responseBody']['status']>
>]

type ResponseReturn<ID extends keyof Req> =
  | ResponseReturnExact<ID>
  | ResponseReturnCategory<ID>
  | ResponseReturnDefault<ID>

// Testing
const a: ResponseReturn<'addPet'> = {
  status: '404',
  body: { foo: '404!' },
}
const b: ResponseReturn<'addPet'> = {
  status: '200',
  body: { foo: '200!' },
}
const c: ResponseReturn<'addPet'> = {
  status: '200',
  body: { foo: 'default!' },
}
const d: ResponseReturn<'addPet'> = {
  status: '403',
  body: { foo: 'four!' },
}
const e: ResponseReturn<'addPet'> = {
  status: '201',
  body: { foo: 'default!' },
}

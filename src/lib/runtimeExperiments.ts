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
// It would be easy to create a generic ResolveBody<ID, Status> which would
// be 100% accurate. We do this when we do `res.status(402).send({ ... }),
// but when defining the return type, I can't figure out how to define it,
// since it's all static - not `T` variable to do a cheeky `T extends ...`, etc.
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
type GetStatusExact<T> = T extends `${number}` ? T : never

type Values<T extends object> = T[keyof T]
type ResponseStatus<ID extends keyof Req> = Req[ID]['responseBody']['status']

type ResponseReturnExact<ID extends keyof Req> = Values<{
  [Status in GetStatusExact<ResponseStatus<ID>>]: {
    status: Status
    body: ResponseBody<ID, Status>
  }
}>

type ResponseReturnCategory<ID extends keyof Req> = Values<{
  [Status in GetStatusCategory<ResponseStatus<ID>>]: {
    status: GetStatusCategoryMatcher<Status>
    body: ResponseBody<ID, Status>
  }
}>

type ResponseReturnDefault<ID extends keyof Req> = Values<{
  [Status in Exclude<
    StatusCategoriesXX,
    GetStatusCategoryMatcher<ResponseStatus<ID>>
  >]: {
    status: Status
    body: ResponseBody<ID, 'default'>
  }
}>

type ResponseReturn<ID extends keyof Req> =
  | ResponseReturnExact<ID>
  | ResponseReturnCategory<ID>
  | ResponseReturnDefault<ID>

type A = ResponseReturnExact<'addPet'>
type B = ResponseReturnCategory<'addPet'>
type C = ResponseReturnDefault<'addPet'>

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

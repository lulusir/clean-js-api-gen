export interface Iyapi {
  index: number;
  name: string;
  desc: string;
  add_time: number;
  up_time: number;
  list: List[];
}

export interface List {
  query_path: QueryPath;
  edit_uid: number;
  status: Status;
  type: Type;
  req_body_is_json_schema: boolean;
  res_body_is_json_schema: boolean;
  api_opened: boolean;
  index: number;
  tag: any[];
  _id: number;
  method: Method;
  catid: number;
  title: string;
  path: string;
  project_id: number;
  req_params: ReqParam[];
  res_body_type: BodyType;
  uid: number;
  add_time: number;
  up_time: number;
  req_query: Req[];
  req_headers: Req[];
  req_body_form: Req[];
  __v: number;
  desc?: string;
  markdown?: string;
  req_body_other?: string;
  req_body_type?: BodyType;
  res_body?: string;
}

export enum Method {
  Delete = "DELETE",
  Get = "GET",
  Post = "POST",
  Put = "PUT",
  Patch = "PATCH",
}

export interface QueryPath {
  path: string;
  params: any[];
}

export interface ReqHeader {
  required: string;
  _id: string;
  name: string;
  value: string;
}

export interface Req {
  required: string;
  _id: string;
  name: string;
  type?: string;
  example?: string;
  desc?: string;
}

export enum BodyType {
  Form = "form",
  JSON = "json",
}

export interface ReqParam {
  _id: string;
  name: string;
  desc: string;
}

export enum Status {
  Done = "done",
  Undone = "undone",
}

export enum Type {
  Static = "static",
  Var = "var",
}

import { OpenAPIV2 } from 'openapi-types';

export interface Yapi {
  index: number;
  name: string;
  desc: string;
  add_time: number;
  up_time: number;
  list: ListItem[];
  basepath?: string;
}

export interface ListItem {
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
  name?: string;
}

export enum Method {
  Delete = 'DELETE',
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Patch = 'PATCH',
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
  value?: any;
}

export enum BodyType {
  Form = 'form',
  JSON = 'json',
  file = 'file',
  raw = 'raw',
}

export interface ReqParam {
  _id: string;
  name: string;
  desc: string;
}

export enum Status {
  Done = 'done',
  Undone = 'undone',
}

export enum Type {
  Static = 'static',
  Var = 'var',
}

export class YAPIToSwagger {
  url: URL;

  constructor(url: string) {
    this.url = new URL(url);
  }

  async convertToSwaggerV2Model(model: Yapi[]) {
    const swaggerObj: OpenAPIV2.Document = {
      swagger: '2.0',
      info: {
        title: '',
        version: 'last', // last version
        description: '',
      },
      //host: "",             // No find any info of host in this point :-)
      basePath: '/', //default base path is '/'(root)
      tags: (() => {
        let tagArray: any[] = [];
        model.forEach((t) => {
          tagArray.push({
            name: t?.name || 'emptyName',
            description: t.desc,
          });
        });
        return tagArray;
      })(),
      schemes: [
        'http', //Only http
      ],
      paths: (() => {
        let apisObj: OpenAPIV2.Document['paths'] = {};
        for (let m of model) {
          //list of category
          for (let api of m.list) {
            //list of api
            if (apisObj[api.path] == null) {
              apisObj[api.path] = {};
            }
            apisObj[api.path][
              api.method.toLowerCase() as OpenAPIV2.HttpMethods
            ] = (() => {
              let apiItem: OpenAPIV2.OperationObject = {
                responses: {},
              };
              apiItem['summary'] = api.title;
              // apiItem["description"] = api.markdown;
              apiItem['description'] = this.getApiLink(api.project_id, api._id);
              switch (api.req_body_type) {
                case 'form':
                case 'file':
                  apiItem['consumes'] = ['multipart/form-data']; //form data required
                  break;
                case 'json':
                  apiItem['consumes'] = ['application/json'];
                  break;
                case 'raw':
                  apiItem['consumes'] = ['text/plain'];
                  break;
                default:
                  break;
              }
              apiItem['parameters'] = (() => {
                let paramArray = [];
                for (let p of api.req_headers) {
                  //Headers parameters
                  //swagger has consumes proprety, so skip proprety "Content-Type"
                  if (p.name === 'Content-Type') {
                    continue;
                  }
                  paramArray.push({
                    name: p.name,
                    in: 'header',
                    description: `${p.name} (Only:${p.value})`,
                    required: Number(p.required) === 1,
                    type: 'string', //always be type string
                    default: p.value,
                  });
                }
                for (let p of api.req_params) {
                  //Path parameters
                  paramArray.push({
                    name: p.name,
                    in: 'path',
                    description: p.desc,
                    required: true, //swagger path parameters required proprety must be always true,
                    type: 'string', //always be type string
                  });
                }
                for (let p of api.req_query) {
                  //Query parameters
                  paramArray.push({
                    name: p.name,
                    in: 'query',
                    required: Number(p.required) === 1,
                    description: p.desc,
                    type: 'string', //always be type string
                  });
                }
                if (api.method.toLowerCase() !== 'get') {
                  switch (
                    api.req_body_type //Body parameters
                  ) {
                    case 'form': {
                      for (let p of api.req_body_form) {
                        paramArray.push({
                          name: p.name,
                          in: 'formData',
                          required: Number(p.required) === 1,
                          description: p.desc,
                          type: p.type === 'text' ? 'string' : 'file', //in this time .formData type have only text or file
                        });
                      }
                      break;
                    }
                    case 'json': {
                      if (api.req_body_other) {
                        let jsonParam = JSON.parse(api.req_body_other);
                        if (jsonParam) {
                          paramArray.push({
                            name: 'root',
                            in: 'body',
                            description: jsonParam.description,
                            schema: jsonParam, //as same as swagger's format
                          });
                        }
                      }
                      break;
                    }
                    case 'file': {
                      paramArray.push({
                        name: 'upfile',
                        in: 'formData', //use formData
                        description: api.req_body_other,
                        type: 'file',
                      });
                      break;
                    }
                    case 'raw': {
                      paramArray.push({
                        name: 'raw',
                        in: 'body',
                        description: 'raw paramter',
                        schema: {
                          type: 'string',
                          format: 'binary',
                          default: api.req_body_other,
                        },
                      });
                      break;
                    }
                    default:
                      break;
                  }
                }

                return paramArray;
              })();
              apiItem['responses'] = {
                '200': {
                  description: 'successful operation',
                  schema: (() => {
                    let schemaObj = {} as OpenAPIV2.SchemaObject;
                    if (api.res_body_type === 'raw') {
                      schemaObj['type'] = 'string';
                      schemaObj['format'] = 'binary';
                      schemaObj['default'] = api.res_body;
                    } else if (api.res_body_type === 'json') {
                      if (api.res_body) {
                        let resBody = JSON.parse(api.res_body);
                        if (resBody !== null) {
                          //schemaObj['type']=resBody.type;
                          schemaObj = resBody; //as the parameters,
                        }
                      }
                    }
                    return schemaObj;
                  })(),
                },
              };
              return apiItem;
            })();
          }
        }

        return apisObj;
      })(),
    };
    return swaggerObj;
  }

  getApiLink(projectId: number, apiId: number) {
    const url =
      this.url.origin + `/project/${projectId}/interface/api/${apiId}`;
    return 'Yapi link: ' + url;
  }
}

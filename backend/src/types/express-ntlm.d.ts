declare module 'express-ntlm' {
  import { RequestHandler } from 'express';

  interface Options {
    domain?: string;
    domaincontroller?: string;
    internalservererror?: string;
  }

  function ntlm(options?: Options): RequestHandler;

  export default ntlm;
}

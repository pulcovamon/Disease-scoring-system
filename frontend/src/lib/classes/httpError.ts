import { CustomError } from 'ts-custom-error';

export const httpErrorMessages = {
  // 4×× Client Error
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  414: 'Request-URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Requested Range Not Satisfiable',
  417: 'Expectation Failed',
  418: "I'm a teapot",
  421: 'Misdirected Request',
  422: 'Unprocessable Entity',
  423: 'Locked',
  424: 'Failed Dependency',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  444: 'Connection Closed Without Response',
  451: 'Unavailable For Legal Reasons',
  499: 'Client Closed Request',

  // 5×× Server Error
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  510: 'Not Extended',
  511: 'Network Authentication Required',
  599: 'Network Connect Timeout Error',
} as const;

type HttpErrorMessages = typeof httpErrorMessages;
export type HttpErrorCode = keyof HttpErrorMessages;
type HttpErrorMessage<TCode extends HttpErrorCode> = HttpErrorMessages[TCode];

export default class HTTPError<
    TCode extends HttpErrorCode,
    TMessage extends HttpErrorMessage<TCode>,
    > extends CustomError {
        code: TCode;
        private _message: TMessage;
        private _customMessage?: string;

        constructor({ code, message }: { code: TCode, message?: string }) {
            super();
            this._message = httpErrorMessages[code] as TMessage;
            this._customMessage = message;
            this.code = code;
        }

        public getMessage() {
            return this._customMessage ?? this._message;
        }
    }
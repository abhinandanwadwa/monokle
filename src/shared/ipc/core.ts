export type IpcResult = IpcSuccess | IpcFailure;
export type IpcSuccess = {success: true; payload: any};
export type IpcFailure = {success: false; reason: string};

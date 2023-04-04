import { ErrorRequestHandler } from 'express';

export declare type ErrorConstructor<T extends unknown[]> = new (...args: T) => ErrorRequestHandler;

export declare type Callback = (...args: any[]) => void;
export interface Maestro {
  (middleware: Callback): Callback;
  from(constructor: ErrorConstructor<[]>, middleware: Callback): Callback;
  all(callbacks: Callback[]): Callback[];
}


declare const maestro: Maestro;
export default maestro;




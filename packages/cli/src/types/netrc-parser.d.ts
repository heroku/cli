declare module 'netrc-parser' {
  interface NetrcMachine {
    login?: string;
    password?: string;
    [key: string]: string | undefined;
  }

  interface Netrc {
    machines: {
      [host: string]: NetrcMachine;
    };
    load(): Promise<void>;
    save(): Promise<void>;
  }

  const netrc: Netrc;
  export default netrc;
} 

export const logger = {
  info: (meta, msg) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(JSON.stringify({ level: 'info', timestamp: new Date().toISOString(), ...meta, msg }));
    }
  },
  warn: (meta, msg) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(JSON.stringify({ level: 'warn', timestamp: new Date().toISOString(), ...meta, msg }));
    }
  },
  error: (meta, msg) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(JSON.stringify({ level: 'error', timestamp: new Date().toISOString(), ...meta, msg }));
    }
  }
};

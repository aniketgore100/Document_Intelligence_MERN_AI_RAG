const format = (level, message, meta) => {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level}] ${message}`;

  if (!meta) return base;
  return `${base} ${JSON.stringify(meta)}`;
};

const logger = {
  info: (message, meta) => console.log(format('INFO', message, meta)),
  warn: (message, meta) => console.warn(format('WARN', message, meta)),
  error: (message, meta) => console.error(format('ERROR', message, meta)),
  http: (message, meta) => console.log(format('HTTP', message, meta)),
};

export default logger;

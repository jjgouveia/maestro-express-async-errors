const handler = (fn) => function catcher (...args) {
  try {
    const fnReturn = fn(...args);
    const next = args[args.length - 1];
    return Promise.resolve(fnReturn).catch(next);
  } catch (err) {
    throw err;
  }
};

module.exports = handler;
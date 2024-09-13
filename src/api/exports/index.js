const ExportsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'exports',
  version: '1.0.0',
  register: async (server, { service, validator, authorization }) => {
    const exportsHandler = new ExportsHandler(service, validator, authorization);
    server.route(routes(exportsHandler));
  },
};
const path = require('path');

const routes = (handler) => [
  {
    method: 'POST',
    path: '/albums/{albumId}/covers',
    handler: handler.postUploadCoverHandler,
    options: {
      payload: {
        allow: 'multipart/form-data',
        multipart: true,
        output: 'stream',
        maxBytes: 512000,
      },
    },
  },
  {
    method: 'GET',
    path: '/uploads/cover/{param*}',
    handler: {
      directory: {
        path: path.resolve(__dirname, 'file/images'),
      },
    },
  },
];

module.exports = routes;
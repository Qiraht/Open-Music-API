require('dotenv').config();

const Hapi = require('@hapi/hapi');

const ClientError = require('./exceptions/ClientError');
const albums = require('./api/albums');
const AlbumsService = require('./services/postgres/AlbumsService');

const init = async () => {
  const albumsService = new AlbumsService();
  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([{
    plugin: albums,
    options: {
      service: albumsService,
    },
  }]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();

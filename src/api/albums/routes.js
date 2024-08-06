const routes = (handler) => [
  {
    // POST Album
    method: 'POST',
    path: '/albums',
    handler: handler.postAlbumHandler,
  },
  {
    // GET Albums by Id
    method: 'GET',
    path: '/albums/{id}',
    handler: handler.getAlbumByIdHandler,
  },
  {
    // PUT Albums by Id
    method: 'PUT',
    path: '/albums/{id}',
    handler: handler.putAlbumByIdHandler,
  },
  {
    // DELETE Albums by Id
    method: 'DELETE',
    path: '/albums/{id}',
    handler: handler.deleteAlbumByIdHandler,
  }
];

module.exports = routes;
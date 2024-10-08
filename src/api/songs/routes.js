const routes = (handler) => [
  {
    // POST Songs
    method: 'POST',
    path: '/songs',
    handler: handler.postSongHandler,
  },
  {
    // Get Songs
    method: 'GET',
    path: '/songs',
    handler: handler.getSongsHandler,
  },
  {
    // GET Songs by Id
    method: 'GET',
    path: '/songs/{songId}',
    handler: handler.getSongByIdHandler,
  },
  {
    // PUT Songs by Id
    method: 'PUT',
    path: '/songs/{songId}',
    handler: handler.putSongByIdHandler,
  },
  {
    // DELETE Songs by Id
    method: 'DELETE',
    path: '/songs/{songId}',
    handler: handler.deleteSongByIdHandler,
  }
];

module.exports = routes;
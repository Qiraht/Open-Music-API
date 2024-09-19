const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;
    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request, h) {
    const { albumId } = request.params;
    const album = await this._service.getAlbumById(albumId);

    if (album.useCache) {
      const response = h.response({
        status: 'success',
        data: {
          album: album.album,
        },
      });
      response.code(200);
      response.header('X-Data-Source', 'cache');
      return response;
    }

    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { albumId } = request.params;
    await this._service.editAlbumById(albumId, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { albumId } = request.params;
    await this._service.deleteAlbumById(albumId);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postAlbumLikesHandler(request, h) {
    const { albumId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.getAlbumById(albumId);
    await this._service.checkAlbumLikes(albumId, credentialId);
    await this._service.addAlbumLikes(albumId, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menambahkan like ke Album',
    });
    response.code(201);
    return response;
  }

  async deleteAlbumLikeHandler(request) {
    const { albumId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.getAlbumById(albumId);
    await this._service.deleteAlbumLikes(albumId, credentialId);

    return {
      status: 'success',
      message: 'Like berhasil dihapus dari Album'
    };
  }

  async getAlbumLikesHandler(request, h) {
    const { albumId } = request.params;

    await this._service.getAlbumById(albumId);
    const likes = await this._service.getAlbumLikes(albumId);

    if (likes.useCache) {
      const response = h.response({
        status: 'success',
        data: {
          likes: likes.likes,
        },
      });
      response.code(200);
      response.header('X-Data-Source', 'cache');
      return response;
    }

    return {
      status: 'success',
      data: {
        likes,
      },
    };
  }
}

module.exports = AlbumsHandler;
const autoBind = require('auto-bind');

class SongsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postSongHandler(request, h) {
    this._validator.validateSongPayload(request.payload);
    const { title, year, genre, performer, duration, albumId } = request.payload;
    const songId = await this._service.addSong({ title, year, genre, performer, duration, albumId });

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan',
      data: {
        songId,
      },
    });
    response.code(201);
    return response;
  }

  async getSongsHandler(request, h) {
    const songs = await this._service.getSongs(request.query);

    if (songs.useCache) {
      const response = h.response({
        status: 'success',
        data: {
          songs: songs.data,
        },
      });
      response.code(200);
      response.header('X-Data-Source', 'cache');
      return response;
    }
    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getSongByIdHandler(request, h) {
    const { songId } = request.params;
    const song = await this._service.getSongById(songId);

    if (song.useCache) {
      const response = h.response({
        status: 'success',
        data: {
          song: song.data,
        },
      });
      response.code(200);
      response.header('X-Data-Source', 'cache');
      return response;
    }
    return {
      status: 'success',
      data: {
        song,
      },
    };
  }

  async putSongByIdHandler(request) {
    this._validator.validateSongPayload(request.payload);
    const { songId } = request.params;
    await this._service.editSongById(songId, request.payload);

    return {
      status: 'success',
      message: 'Lagu berhasil diperbarui',
    };
  }

  async deleteSongByIdHandler(request) {
    const { songId } = request.params;
    await this._service.deleteSongById(songId);

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus'
    };
  }
}

module.exports = SongsHandler;
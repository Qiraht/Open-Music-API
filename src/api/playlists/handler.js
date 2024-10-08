const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistsHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload);
    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;
    const playlistId = await this._service.addPlaylists({ name, userId: credentialId });

    const response = h.response({
      status:'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this._service.getPlaylists(credentialId);

    if (playlists.useCache) {
      const response = h.response({
        status: 'success',
        data: {
          playlists: playlists.playlists,
        },
      });
      response.code(200);
      response.header('X-Data-Source', 'cache');
      return response;
    }
    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistsHandler(request) {
    const { playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistOwner(playlistId, credentialId);
    await this._service.deletePlaylists(playlistId, credentialId);

    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async postPlaylistSongsHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { songId } = request.payload;
    const { playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    await this._service.addPlaylistSongs(playlistId, songId);

    await this._service.addPlaylistActivities({
      playlistId, songId, userId: credentialId, action: 'add'
    });
    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke dalam playlist',
    });
    response.code(201);
    return response;
  }

  async getPlaylistSongsHandler(request, h) {
    const { playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    const playlist = await this._service.getPlaylistSongs(playlistId);

    if (playlist.useCache) {
      const response = h.response({
        status: 'success',
        data: {
          playlist: playlist.playlist,
        },
      });
      response.code(200);
      response.header('X-Data-Source', 'cache');
      return response;
    }
    return {
      status: 'success',
      data: {
        playlist,
      },
    };
  }

  async deletePlaylistSongsHandler(request) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { playlistId } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    await this._service.deletePlaylistSongs(playlistId, songId);

    await this._service.addPlaylistActivities({
      playlistId, songId, userId: credentialId, action: 'delete'
    });
    return {
      status: 'success',
      message: 'Lagu berhasil dihapus dari Playlist',
    };
  }

  async getPlaylistActivitiesHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const { playlistId } = request.params;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    const activities = await this._service.getPlaylistActivities(playlistId);

    if (activities.useCache) {
      const response = h.response({
        status: 'success',
        data: {
          playlistId,
          activities: activities.activities,
        },
      });
      response.code(200);
      response.header('X-Data-Source', 'cache');
      return response;
    }
    return {
      status: 'success',
      data: {
        playlistId,
        activities,
      },
    };
  }
}

module.exports = PlaylistsHandler;
const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(songsService, collaborationsService, cacheService) {
    this._pool = new Pool();
    this._songsService = songsService;
    this._collaborationsService = collaborationsService;
    this._cacheService = cacheService;
  }

  async addPlaylists({ name, userId }) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0]) {
      throw new InvariantError('Gagal menambahkan Playlist');
    }

    await this._cacheService.delete(`playlists:${userId}`);
    return result.rows[0].id;
  }

  async getPlaylists(userId) {
    try {
      const result = await this._cacheService.get(`playlists:${userId}`);
      return { playlists: JSON.parse(result), useCache: true };
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      const query = {
        text: `SELECT playlists.id, playlists.name, users.username 
        FROM playlists LEFT JOIN users ON users.id = playlists.owner
        LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
        WHERE playlists.owner = $1 OR collaborations.user_id = $1`,
        values: [userId],
      };

      const result = await this._pool.query(query);

      const playlist = result.rows;

      await this._cacheService.set(`playlists:${userId}`, JSON.stringify(playlist));
      return playlist;
    }
  }

  async deletePlaylists(playlistId, userId) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Playlist gagal dihapus');
    }

    await this._cacheService.delete(`playlists:${userId}`);
    await this._cacheService.delete(`ps:${playlistId}`);
    await this._cacheService.delete(`psa:${playlistId}`);
  }

  async addPlaylistSongs(playlistId, songId) {
    const id = `ps-${nanoid(16)}`;

    await this._songsService.getSongById(songId);

    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0]) {
      throw new InvariantError('Gagal menambahkan Lagu ke dalam Playlist');
    }

    await this._cacheService.delete(`ps:${playlistId}`);
    return result.rows[0].id;
  }

  async getPlaylistSongs(playlistId) {
    try {
      const result = await this._cacheService.get(`ps:${playlistId}`);
      return { playlist: JSON.parse(result), useCache: true };
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      const queryPlaylist = {
        text: `SELECT playlists.id, playlists.name, users.username
        FROM playlists LEFT JOIN users ON users.id = playlists.owner
        WHERE playlists.id = $1`,
        values: [playlistId],
      };

      const resultPlaylist = await this._pool.query(queryPlaylist);

      const playlist = resultPlaylist.rows[0];

      const querySongs = {
        text: `SELECT songs.id, songs.title, songs.performer
        FROM playlist_songs LEFT JOIN songs ON songs.id = playlist_songs.song_id
        WHERE playlist_songs.playlist_id = $1`,
        values: [playlistId],
      };

      const resultSongs = await this._pool.query(querySongs);

      const result = {
        ...playlist,
        songs: resultSongs.rows,
      };

      await this._cacheService.set(`ps:${playlistId}`, JSON.stringify(result));
      return result;
    }
  }

  async deletePlaylistSongs(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal dihapus dari Playlists');
    }
    await this._cacheService.delete(`ps:${playlistId}`);
  }

  async verifyPlaylistOwner(playlistId, userId) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    if (result.rows[0].owner !== userId) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationsService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }

  async addPlaylistActivities({ playlistId, songId, userId, action }) {
    const id = `psa-${nanoid(16)}`;
    const time = new Date().toUTCString();

    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlistId, songId, userId, action, time]
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Activity gagal ditambahkan');
    }
    await this._cacheService.delete(`psa:${playlistId}`);
  }

  async getPlaylistActivities(playlistId) {
    try {
      const result = await this._cacheService.get(`psa:${playlistId}`);
      return { activities: JSON.parse(result), useCache: true };
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      const query = {
        text: `SELECT u.username, s.title, psa.action, psa.time 
        FROM playlist_song_activities AS psa
        LEFT JOIN users AS u ON u.id = psa.user_id
        LEFT JOIN songs AS s ON s.id = psa.song_id
        WHERE psa.playlist_id = $1`,
        values: [playlistId],
      };

      const result = await this._pool.query(query);

      const activities = result.rows;

      await this._cacheService.set(`psa:${playlistId}`, JSON.stringify(activities));
      return activities;
    }
  }
}

module.exports = PlaylistsService;

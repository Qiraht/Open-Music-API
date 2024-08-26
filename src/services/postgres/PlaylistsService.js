const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
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

    return result.rows[0].id;
  }

  async getPlaylists(userId) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username 
      FROM playlists LEFT JOIN users ON users.id = playlists.owner
      WHERE playlists.owner=$1`,
      values: [userId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async deletePlaylists(playlistId) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async addPlaylistSongs(playlistId, songId) {
    const id = `ps-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0]) {
      throw new InvariantError('Gagal menambahkan Lagu ke dalam Playlist');
    }

    return result.rows[0].id;
  }

  async getPlaylistSongs(playlistId) {
    const queryPlaylist = {
      text: `SELECT playlists.id, playlists.name, users.username
      FROM playlists LEFT JOIN users ON users.id = playlists.owner
      WHERE playlists.id = $1`,
      values: [playlistId],
    };

    const resultPlaylist = await this._pool.query(queryPlaylist);

    const querySongs = {
      text: `SELECT songs.id, songs.title, songs.performer
      FROM playlist_songs LEFT JOIN songs ON songs.id = playlist_songs.song_id
      WHERE playlist_songs.playlist_id = $1`,
      values: [playlistId],
    };


    const resultSongs = await this._pool.query(querySongs);

    return {
      id: resultPlaylist.rows[0].id,
      name: resultPlaylist.rows[0].name,
      username: resultPlaylist.rows[0].username,
      songs: resultSongs.rows, };
  }

  async deletePlaylistSongs(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu gagal dihapus dari Playlists. Id tidak ditemukan');
    }
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
}

module.exports = PlaylistsService;

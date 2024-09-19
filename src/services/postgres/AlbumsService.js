const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const mapAlbumsDBToModel = require('../../utils/albums');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0]) {
      throw new InvariantError('Gagal menambahkan album');
    }

    return result.rows[0].id;
  }

  async getAlbumById(albumId) {
    const queryAlbum = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [albumId],
    };
    const resultAlbum = await this._pool.query(queryAlbum);

    if (!resultAlbum.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const album = resultAlbum.rows.map(mapAlbumsDBToModel)[0];

    const querySongs = {
      text: 'SELECT songs.id, songs.title, songs.performer FROM songs WHERE album_id = $1',
      values: [albumId],
    };

    const resultSongs = await this._pool.query(querySongs);

    return {
      ...album,
      songs: resultSongs.rows,
    };
  }

  async editAlbumById(albumId, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal diperbarui. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(albumId) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async addAlbumCover(fileLocation, albumId) {
    const query = {
      text: 'UPDATE albums SET cover_url = $1 WHERE id = $2 RETURNING id',
      values: [fileLocation, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal diperbarui. Id tidak ditemukan');
    }
  }

  async addAlbumLikes(albumId, userId) {
    const id = `ual-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, albumId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menambahkan like pada Album');
    };
    await this._cacheService.delete(`likes:${albumId}`);
  }

  async deleteAlbumLikes(albumId, userId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw InvariantError('Gagal menghapus like dari album');
    }

    await this._cacheService.delete(`likes:${albumId}`);
  }

  async getAlbumLikes(albumId) {
    try {
      const result = await this._cacheService.get(`likes:${albumId}`);
      const likes = parseInt(JSON.parse(result));
      return { likes, useCache: true };
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      const query = {
        text: 'SELECT COUNT(user_id) FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);

      if (!result.rows.length) {
        return InvariantError('Gagal mendapatkan like dari album');
      }

      const likes = parseInt(result.rows[0].count);

      await this._cacheService.set(`likes:${albumId}`, JSON.stringify(likes));
      return likes;
    }
  }

  async checkAlbumLikes(albumId, userId) {
    const query = {
      text: `SELECT * FROM user_album_likes
      WHERE album_id = $1 AND user_id = $2`,
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);

    if (result.rows.length) {
      throw new InvariantError('Album sudah di like oleh user');
    }
  }
}

module.exports = AlbumsService;
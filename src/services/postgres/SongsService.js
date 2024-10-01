const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const mapSongsDBToModel = require('../../utils/songs');

class SongsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addSong({
    title, year, genre, performer, duration, albumId
  }) {
    const id = `song-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, title, year, genre, performer, duration, albumId]
    };
    const result = await this._pool.query(query);

    if (!result.rows[0]) {
      throw new InvariantError('Gagal menambahkan lagu');
    }

    await this._cacheService.scanDelete('songs:');
    return result.rows[0].id;
  }

  async getSongs({ title, performer }) {
    try {
      const result = await this._cacheService.get(`songs:${title}:${performer}:`);
      return { data: JSON.parse(result), useCache: true };
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      let query = {
        text: 'SELECT id, title, performer FROM songs',
      };

      if (title || performer) {
        query = {
          text: 'SELECT id, title, performer FROM songs WHERE title ILIKE $1 and performer ILIKE $2 ',
          values: [`%${title}%`, `%${performer}%`],
        };
        if (!title) {
          query = {
            text: 'SELECT id, title, performer FROM songs WHERE performer ILIKE $1 ',
            values: [`%${performer}%`],
          };
        };
        if (!performer) {
          query = {
            text: 'SELECT id, title, performer FROM songs WHERE title ILIKE $1 ',
            values: [`%${title}%`],
          };
        };
      }

      const result = await this._pool.query(query);
      const songs = result.rows;

      this._cacheService.set(`songs:${title}:${performer}:`, JSON.stringify(songs));
      return songs;
    }
  }

  async getSongById(songId) {
    try {
      const result = await this._cacheService.get(`songs:${songId}`);
      return { data: JSON.parse(result), useCache: true };;
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      const query = {
        text: 'SELECT * FROM songs WHERE id = $1',
        values: [songId],
      };
      const result = await this._pool.query(query);

      if (!result.rows.length) {
        throw new NotFoundError('Lagu tidak ditemukan');
      }

      const songs = result.rows.map(mapSongsDBToModel)[0];

      await this._cacheService.set(`songs:${songId}`, JSON.stringify(songs));
      return songs;
    }
  }

  async editSongById(songId, {
    title, year, genre, performer, duration, albumId
  }) {
    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, album_id = $6 WHERE id = $7 RETURNING id',
      values: [title, year, genre, performer, duration, albumId, songId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }

    await this._cacheService.scanDelete('songs:');
  }

  async deleteSongById(songId) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [songId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan');
    }

    await this._cacheService.scanDelete('songs:');
  }
}

module.exports = SongsService;
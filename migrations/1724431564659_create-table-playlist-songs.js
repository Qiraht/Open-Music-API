/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('playlist_songs', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'playlists(id)',
      referencesConstraintName: 'fk_playlist_songs.playlist_id_playlists.id',
      onDelete: 'CASCADE',
    },
    song_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'songs(id)',
      referencesConstraintName: 'fk_playlist_songs.songs_id_songs.id',
      onDelete: 'CASCADE',
    }
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('playlist_songs', { options: 'CASCADE' });
};
